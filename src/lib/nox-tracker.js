/**
 * NoxTracker — Clickz Behavioral ML Recommendation Engine
 * WolfTech Innovations / Nox Marketplace
 *
 * Drop this into your Astro project and call NoxTracker.init() on page load.
 * Requires: @cosmicjs/sdk installed, env vars COSMIC_BUCKET_SLUG, COSMIC_READ_KEY, COSMIC_WRITE_KEY
 *
 * Per-user profile vectors stored in CosmicJS under object type "nox-user-profiles"
 * Tracks: watch time, scroll velocity, dwell, time-of-day session patterns, likes,
 *         saves, buys, shares, return views, cross-site pixel data
 * Reranks feed in real time using cosine similarity + per-user adaptive baselines
 */

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const CFG = {
  BUCKET_SLUG:  import.meta?.env?.COSMIC_BUCKET_SLUG,
  READ_KEY:     import.meta?.env?.COSMIC_READ_KEY,
  WRITE_KEY:    import.meta?.env?.COSMIC_WRITE_KEY,
  COSMIC_API:   'https://api.cosmicjs.com/v3',
  PIXEL_PATH:   '/api/tracker/pixel',   // your server-side pixel endpoint
  PROFILE_TYPE: 'nox-user-profiles',   // CosmicJS object type slug
  VEC_DIM:      16,                     // embedding dimension (expanded from 8)
  SAVE_DEBOUNCE: 8000,                  // ms between profile saves
  RERANK_AFTER:  2,                     // rerank after N slides viewed
  CATS: ['gpu','cpu','ram','ssd','case','psu','cooler','mobo','monitor','peripheral','kb','mouse','headset','fan','rgb'],
};

// ─── MATH HELPERS ──────────────────────────────────────────────────────────────
const cl  = (v) => Math.max(0, Math.min(1, v));
const dot = (a, b) => a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
const mag = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));
const cos = (a, b) => { const m = mag(a) * mag(b); return m ? dot(a, b) / m : 0; };
const catIdx = (c) => { const i = CFG.CATS.findIndex(x => (c||'').toLowerCase().includes(x)); return i < 0 ? 0.5 : (i + 1) / CFG.CATS.length; };
const priceNorm = (p) => cl(Math.log1p(parseFloat(p) || 0) / Math.log1p(5000));
const timeOfDayBucket = () => { const h = new Date().getHours(); return h < 6 ? 0 : h < 12 ? 0.25 : h < 18 ? 0.5 : h < 22 ? 0.75 : 1.0; };

// ─── FINGERPRINT / USER ID ─────────────────────────────────────────────────────
function getUserId() {
  let uid = localStorage.getItem('nox_uid');
  if (!uid) {
    // generate a stable fingerprint-ish ID
    const fp = [
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency,
      navigator.deviceMemory || 0,
    ].join('|');
    // hash it
    let h = 0;
    for (let i = 0; i < fp.length; i++) { h = (Math.imul(31, h) + fp.charCodeAt(i)) | 0; }
    uid = 'nox_' + Math.abs(h).toString(36) + '_' + Date.now().toString(36);
    localStorage.setItem('nox_uid', uid);
  }
  return uid;
}

// ─── COSMIC CLIENT (REST, no SDK needed in browser) ───────────────────────────
const Cosmic = {
  async getProfile(uid) {
    const q = encodeURIComponent(JSON.stringify({ type: CFG.PROFILE_TYPE, slug: uid }));
    const url = `${CFG.COSMIC_API}/buckets/${CFG.BUCKET_SLUG}/objects?query=${q}&props=id,slug,metadata&read_key=${CFG.READ_KEY}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.objects?.[0] || null;
  },

  async createProfile(uid, profile) {
    const url = `${CFG.COSMIC_API}/buckets/${CFG.BUCKET_SLUG}/objects`;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CFG.WRITE_KEY}` },
      body: JSON.stringify({
        title: `Nox User ${uid}`,
        slug: uid,
        type: CFG.PROFILE_TYPE,
        status: 'published',
        metadata: profile,
      }),
    }).then(r => r.json());
  },

  async updateProfile(objectId, profile) {
    const url = `${CFG.COSMIC_API}/buckets/${CFG.BUCKET_SLUG}/objects/${objectId}`;
    return fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CFG.WRITE_KEY}` },
      body: JSON.stringify({ metadata: profile }),
    }).then(r => r.json());
  },
};

// ─── CROSS-SITE PIXEL ─────────────────────────────────────────────────────────
// Drop <img src="/api/tracker/pixel?uid=X&ref=REFERRER&cats=INFERRED" /> on every page
// Server endpoint reads the request, logs referrer domain + UA, stores in CosmicJS
// This pulls inferred interest categories from wherever the user came from
async function firePixel(uid, extraData = {}) {
  const params = new URLSearchParams({
    uid,
    ref:  document.referrer,
    page: location.pathname,
    tod:  timeOfDayBucket(),
    ...extraData,
  });
  // beacon is fire-and-forget
  navigator.sendBeacon?.(CFG.PIXEL_PATH + '?' + params.toString()) ||
    fetch(CFG.PIXEL_PATH + '?' + params.toString(), { method: 'GET', keepalive: true }).catch(() => {});
}

// Infer interest categories from referrer URL
function inferCatsFromReferrer(ref) {
  if (!ref) return [];
  const r = ref.toLowerCase();
  return CFG.CATS.filter(c => r.includes(c));
}

// ─── PROFILE SHAPE ────────────────────────────────────────────────────────────
// uv: user embedding vector [dim 16]
// baseline: per-user rolling averages of watch time, scroll speed, session length
// tod_weights: time-of-day engagement patterns [4 buckets]
// seen: map of item_id -> view count
// interactions: total interaction count (controls learning rate)
// pixel_cats: category interests inferred from cross-site tracking
// last_updated: timestamp
function defaultProfile() {
  return {
    uv:            new Array(CFG.VEC_DIM).fill(0.5),
    baseline_watch: 4000,   // ms — expected watch time for this user
    baseline_scroll: 0.5,   // scroll velocity norm
    baseline_session: 1,    // avg items/session
    tod_weights:   [0.25, 0.25, 0.25, 0.25], // morning/noon/eve/night
    seen:          {},
    interactions:  0,
    pixel_cats:    [],
    last_updated:  Date.now(),
  };
}

// ─── LEARNING RATE ────────────────────────────────────────────────────────────
const lr = (n) => Math.max(0.005, 0.1 / Math.sqrt(1 + n * 0.05));

// ─── ITEM VECTOR BUILDER ──────────────────────────────────────────────────────
// Maps a Clickz item's metadata into the same 16-dim embedding space as the user
function itemVec(el) {
  const price   = priceNorm(el.dataset.price || '0');
  const cat     = catIdx(el.dataset.category || '');
  const age     = cl((Date.now() - parseInt(el.dataset.ts || Date.now())) / (1000 * 60 * 60 * 24 * 30)); // recency
  const likes   = cl(parseInt(el.dataset.likes || '0') / 500);
  const views   = cl(parseInt(el.dataset.views || '0') / 5000);
  const seller  = cl(parseInt(el.dataset.sellerScore || '50') / 100);
  // remaining dims initialized to 0.5 (latent features trained over time)
  return [price, cat, age, likes, views, seller, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
}

// ─── NOX TRACKER CORE ─────────────────────────────────────────────────────────
export const NoxTracker = (() => {
  let uid, profile, cosmicId;
  const itemVecs  = {};    // id -> vec
  let saveTimer   = null;
  let slidesViewed = 0;

  // Per-slide watch session tracking
  let watchStart  = null;
  let currentId   = null;
  let scrollY0    = 0;
  let scrollT0    = 0;

  // ── Load or create profile ────────────────────────────────────────────────
  async function loadProfile() {
    uid = getUserId();
    firePixel(uid, { cats: inferCatsFromReferrer(document.referrer).join(',') });

    try {
      const obj = await Cosmic.getProfile(uid);
      if (obj) {
        cosmicId = obj.id;
        profile  = { ...defaultProfile(), ...obj.metadata };
        // coerce uv back to array (Cosmic stores as string or array)
        if (typeof profile.uv === 'string') profile.uv = JSON.parse(profile.uv);
        if (!Array.isArray(profile.uv) || profile.uv.length !== CFG.VEC_DIM) profile.uv = new Array(CFG.VEC_DIM).fill(0.5);
      } else {
        profile  = defaultProfile();
        cosmicId = null;
      }
    } catch {
      profile  = defaultProfile();
      cosmicId = null;
    }

    // Merge any pixel_cats into baseline vector
    applyPixelCats();
    return profile;
  }

  // ── Apply cross-site inferred categories into vector ─────────────────────
  function applyPixelCats() {
    const cats = profile.pixel_cats || [];
    cats.forEach(c => {
      const i = CFG.CATS.indexOf(c);
      if (i >= 0) {
        // boost cat dimension proportionally — soft nudge
        profile.uv[1] = cl(profile.uv[1] * 0.95 + (i + 1) / CFG.CATS.length * 0.05);
      }
    });
  }

  // ── Persist profile to CosmicJS (debounced) ───────────────────────────────
  function schedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      profile.last_updated = Date.now();
      const payload = {
        ...profile,
        uv: JSON.stringify(profile.uv), // Cosmic stores as text field
      };
      try {
        if (cosmicId) {
          await Cosmic.updateProfile(cosmicId, payload);
        } else {
          const res = await Cosmic.createProfile(uid, payload);
          cosmicId = res?.object?.id || null;
        }
      } catch (e) {
        console.warn('[NoxTracker] Save failed', e);
      }
    }, CFG.SAVE_DEBOUNCE);
  }

  // ── Update user vector toward/away from item ──────────────────────────────
  function nudge(id, signal) {
    const iv = itemVecs[id];
    if (!iv) return;
    const rate = lr(profile.interactions);
    const err  = signal - cos(profile.uv, iv);
    profile.uv = profile.uv.map((v, i) => cl(v + rate * err * (iv[i] ?? 0)));
    profile.interactions++;
    schedSave();
  }

  // ── Per-user baseline update (exponential moving average) ─────────────────
  function updateBaseline(watchMs, scrollVel) {
    const alpha = 0.1;
    profile.baseline_watch  = profile.baseline_watch  * (1 - alpha) + watchMs   * alpha;
    profile.baseline_scroll = profile.baseline_scroll * (1 - alpha) + scrollVel * alpha;
  }

  // ── Score item for current user ───────────────────────────────────────────
  function score(id) {
    const iv = itemVecs[id];
    if (!iv) return 0;
    let s = cos(profile.uv, iv);

    // Recency boost (freshness)
    const age = parseFloat(iv[2]);
    s += (1 - age) * 0.05;

    // Return-view penalty (avoid showing same thing over and over)
    const seen = profile.seen[id] || 0;
    s -= seen * 0.08;

    // Time-of-day affinity — boost items that performed well at this hour
    const todBucket = Math.floor(timeOfDayBucket() * 4);
    s += (profile.tod_weights[todBucket] - 0.25) * 0.1;

    // Pixel cat boost — if item category matches cross-site inferred interest
    const itemCatSlug = CFG.CATS[Math.round(parseFloat(iv[1]) * CFG.CATS.length) - 1];
    if (itemCatSlug && profile.pixel_cats?.includes(itemCatSlug)) s += 0.07;

    return s;
  }

  // ── Rerank feed ───────────────────────────────────────────────────────────
  function rerank(feed) {
    const slides = Array.from(feed.querySelectorAll('.s'));
    // find currently visible slide
    const active = slides.find(s => {
      const r = s.getBoundingClientRect();
      return r.top >= 0 && r.top < innerHeight;
    });
    const pivot = active ? slides.indexOf(active) + 1 : 0;
    // only rerank slides after current
    slides.slice(pivot)
      .sort((a, b) => score(b.dataset.id) - score(a.dataset.id))
      .forEach(s => feed.appendChild(s));
  }

  // ── Register item ─────────────────────────────────────────────────────────
  function registerItem(el) {
    const id = el.dataset.id;
    if (!id || itemVecs[id]) return;
    itemVecs[id] = itemVec(el);
  }

  // ── Watch session start ───────────────────────────────────────────────────
  function onSlideEnter(id) {
    // commit previous slide's watch session
    if (currentId && watchStart) {
      const elapsed = Date.now() - watchStart;
      const scrollVel = scrollT0 > 0 ? Math.abs(scrollY0) / (Date.now() - scrollT0 + 1) : 0.5;

      // Deviation from per-user baseline = intent signal
      const watchRatio = elapsed / Math.max(profile.baseline_watch, 1000);
      const scrollDev  = cl(1 - scrollVel / Math.max(profile.baseline_scroll, 0.01));

      let sig = 0.5;
      if (watchRatio >= 1.5) sig = 0.9;       // watched way longer than their norm
      else if (watchRatio >= 0.9) sig = 0.75;
      else if (watchRatio >= 0.5) sig = 0.55;
      else if (watchRatio < 0.2) sig = 0.1;   // bailed fast even for them

      // Adjust for scroll hesitation — slow scroll approach = interest
      sig = cl(sig + scrollDev * 0.1);

      nudge(currentId, sig);
      updateBaseline(elapsed, scrollVel);

      // Log seen count
      profile.seen[currentId] = (profile.seen[currentId] || 0) + 1;

      // Update time-of-day weights
      const todBucket = Math.floor(timeOfDayBucket() * 4);
      profile.tod_weights = profile.tod_weights.map((w, i) =>
        i === todBucket ? cl(w * 0.9 + sig * 0.1) : w * 0.9 + 0.25 * 0.1
      );

      slidesViewed++;
      if (slidesViewed % CFG.RERANK_AFTER === 0) {
        rerank(document.getElementById('F'));
      }
    }

    currentId  = id;
    watchStart = Date.now();
    scrollY0   = window.scrollY;
    scrollT0   = Date.now();
  }

  // ── Track scroll velocity approaching a slide ─────────────────────────────
  function onScroll() {
    scrollY0 = window.scrollY;
    scrollT0 = Date.now();
  }

  // ── Explicit interaction signals ──────────────────────────────────────────
  function onLike(id)   { nudge(id, 0.92); schedSave(); }
  function onSave(id)   { nudge(id, 0.88); schedSave(); }
  function onBuy(id)    { nudge(id, 0.97); schedSave(); }
  function onShare(id)  { nudge(id, 0.85); schedSave(); }
  function onSkip(id)   { nudge(id, 0.08); schedSave(); } // rapid scroll-past

  // ── Ingest pixel data from server (call from your pixel endpoint response) ─
  // Your /api/tracker/pixel endpoint should collect cross-site referrer domains,
  // classify them into categories (e.g. newegg.com -> 'gpu,cpu,ram'),
  // then call this to merge into the user's profile.
  async function ingestPixelCategories(categories) {
    if (!Array.isArray(categories)) return;
    profile.pixel_cats = [...new Set([...(profile.pixel_cats || []), ...categories])];
    applyPixelCats();
    schedSave();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  async function init() {
    await loadProfile();

    const feed = document.getElementById('F');
    if (!feed) return;

    // Register all existing slides
    feed.querySelectorAll('.s').forEach(registerItem);

    // Watch for dynamically added slides
    new MutationObserver(ms => ms.forEach(m =>
      m.addedNodes.forEach(n => {
        if (!(n instanceof HTMLElement)) return;
        if (n.classList.contains('s')) registerItem(n);
        n.querySelectorAll('.s').forEach(registerItem);
      })
    )).observe(feed, { childList: true, subtree: true });

    // Hook into IntersectionObserver — fires when slide hits 70% visibility
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) onSlideEnter(e.target.dataset.id);
      });
    }, { threshold: 0.7 });
    feed.querySelectorAll('.s').forEach(s => obs.observe(s));

    // Scroll velocity tracking
    window.addEventListener('scroll', onScroll, { passive: true });

    // Expose interaction hooks globally for existing Clickz JS to call
    window.__nox = { onLike, onSave, onBuy, onShare, onSkip, ingestPixelCategories, score, rerank: () => rerank(feed) };

    console.log(`[NoxTracker] Loaded profile for ${uid} | vec dim: ${CFG.VEC_DIM} | interactions: ${profile.interactions}`);
  }

  return { init, onLike, onSave, onBuy, onShare, onSkip, score, ingestPixelCategories };
})();

// ─── AUTO INIT ────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NoxTracker.init());
  } else {
    NoxTracker.init();
  }
}

// ─── PIXEL ENDPOINT (paste this into your Astro API route: /api/tracker/pixel.ts) ────
/**
 * PASTE IN: src/pages/api/tracker/pixel.ts
 *
 * import type { APIRoute } from 'astro';
 * import { createBucketClient } from '@cosmicjs/sdk';
 *
 * const SITE_CAT_MAP: Record<string, string[]> = {
 *   'newegg.com':       ['gpu','cpu','ram','ssd','mobo','psu','case','cooler'],
 *   'reddit.com/r/buildapc': ['gpu','cpu','ram'],
 *   'microcenter.com':  ['gpu','cpu','mobo'],
 *   'bestbuy.com':      ['monitor','peripheral'],
 *   'amazon.com':       ['peripheral','rgb','fan'],
 *   'pcpartpicker.com': ['gpu','cpu','ram','ssd','mobo','psu','case','cooler'],
 *   'b&h':              ['monitor'],
 * };
 *
 * function inferCats(referrer: string): string[] {
 *   const r = (referrer || '').toLowerCase();
 *   for (const [domain, cats] of Object.entries(SITE_CAT_MAP)) {
 *     if (r.includes(domain)) return cats;
 *   }
 *   return [];
 * }
 *
 * export const GET: APIRoute = async ({ request }) => {
 *   const url   = new URL(request.url);
 *   const uid   = url.searchParams.get('uid') || '';
 *   const ref   = url.searchParams.get('ref') || request.headers.get('referer') || '';
 *   const cats  = inferCats(ref);
 *
 *   if (uid && cats.length) {
 *     const cosmic = createBucketClient({
 *       bucketSlug: import.meta.env.COSMIC_BUCKET_SLUG,
 *       readKey:    import.meta.env.COSMIC_READ_KEY,
 *       writeKey:   import.meta.env.COSMIC_WRITE_KEY,
 *     });
 *     try {
 *       const objs = await cosmic.objects.find({ type: 'nox-user-profiles', slug: uid })
 *         .props(['id','metadata']).limit(1);
 *       const obj  = objs?.objects?.[0];
 *       if (obj) {
 *         const existing = obj.metadata.pixel_cats || [];
 *         const merged   = [...new Set([...existing, ...cats])];
 *         await cosmic.objects.updateOne(obj.id, { metadata: { pixel_cats: merged } });
 *       }
 *     } catch {}
 *   }
 *
 *   // Return 1x1 transparent GIF
 *   return new Response(
 *     Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64'),
 *     { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' } }
 *   );
 * };
 */
