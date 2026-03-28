import type { APIRoute } from 'astro';

const API  = 'https://api.cosmicjs.com/v3';
const B    = import.meta.env.COSMIC_BUCKET_SLUG;
const RK   = import.meta.env.COSMIC_READ_KEY;
const WK   = import.meta.env.COSMIC_WRITE_KEY;
const PT   = 'nox-user-profiles';
const GIF  = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');

const ALL  = ['gpu','cpu','ram','ssd','case','psu','cooler','mobo','monitor','peripheral','kb','mouse','headset','fan','rgb'] as const;
const GPU  = ['gpu'], CPU = ['cpu'], MON = ['monitor'], PER = ['peripheral','rgb','fan'];
const CORE = ['gpu','cpu','ram','ssd','mobo','psu','case','cooler'];
const FULL = [...ALL];

const MAP: Record<string,string[]> = {
  // retailers
  'newegg.com':CORE, 'microcenter.com':CORE, 'bhphotovideo.com':[...MON,...GPU,...PER],
  'adorama.com':[...MON,...GPU,...PER], 'memoryexpress.com':CORE, 'canadacomputers.com':CORE,
  'amazon.com':['peripheral','rgb','fan','monitor','ram','ssd'], 'bestbuy.com':[...GPU,...CPU,'ram','ssd',...MON,...PER],
  'walmart.com':[...MON,...PER,'ram','ssd'], 'cdw.com':[...GPU,...CPU,'ram','ssd','mobo','psu'],
  'tigerdirect.com':[...CORE], 'costco.com':[...MON,...PER,'ram'],
  // used / resale
  'ebay.com':FULL, 'facebook.com/marketplace':FULL, 'marketplace.facebook.com':FULL,
  'craigslist.org':[...GPU,...CPU,'ram','ssd','case','mobo',...MON,...PER],
  'offerup.com':[...GPU,...CPU,'ram','ssd','mobo',...MON,...PER],
  'mercari.com':[...GPU,...CPU,'ram','ssd',...PER,'kb','mouse','headset'],
  'jawa.gg':FULL, 'swappa.com':[...GPU,...PER,...MON,'kb','mouse','headset'],
  'sellgpu.com':[...GPU,...CPU,'ram','ssd'], 'pcswaps.com':FULL,
  // communities
  'pcpartpicker.com':CORE,
  'reddit.com/r/buildapc':[...GPU,...CPU,'ram','ssd','mobo','case','cooler'],
  'reddit.com/r/hardwareswap':FULL, 'reddit.com/r/buildapcsales':[...CORE,...MON],
  'reddit.com/r/hardware':[...GPU,...CPU,'ram','ssd','mobo'],
  'reddit.com/r/nvidia':GPU, 'reddit.com/r/amd':[...GPU,...CPU],
  'reddit.com/r/intel':[...CPU,'mobo'], 'reddit.com/r/monitors':MON,
  'reddit.com/r/mechanicalkeyboards':['kb'], 'reddit.com/r/mousereview':['mouse'],
  'reddit.com/r/headphones':['headset'], 'reddit.com/r/sffpc':['case','mobo','psu','cooler'],
  'reddit.com/r/watercooling':['cooler','fan','rgb'], 'reddit.com/r/overclocking':[...GPU,...CPU,'ram','cooler'],
  // review sites
  'tomshardware.com':[...CORE,...MON,'psu'], 'gamersnexus.net':[...GPU,...CPU,'cooler','case','psu'],
  'techpowerup.com':[...GPU,...CPU,'ram','psu'], 'guru3d.com':[...GPU,...CPU,'ram','mobo'],
  'techspot.com':[...GPU,...CPU,'ram','ssd',...MON], 'rtings.com':[...MON,'headset',...PER],
  'linustechtips.com':[...GPU,...CPU,'ram','ssd','case','cooler'], 'tftcentral.co.uk':MON,
  // brands - gpu/cpu
  'nvidia.com':GPU, 'amd.com':[...GPU,...CPU], 'intel.com':[...CPU,'mobo'],
  'evga.com':[...GPU,'psu'],
  // brands - mobo/gpu partners
  'asus.com':['mobo',...GPU,...MON,...PER,'case','cooler'],
  'gigabyte.com':['mobo',...GPU,'case','cooler','ram'],
  'msi.com':['mobo',...GPU,...MON,'case','cooler'],
  'asrock.com':['mobo',...GPU],
  // brands - ram/storage
  'corsair.com':['ram','psu','case','cooler','kb','mouse','headset','fan','rgb'],
  'gskill.com':['ram'], 'kingston.com':['ram','ssd'],
  'westerndigital.com':['ssd'], 'seagate.com':['ssd'],
  'samsung.com/semiconductor':['ssd','ram'],
  // brands - psu/case/cooling
  'seasonic.com':['psu'], 'bequiet.com':['psu','case','cooler','fan'],
  'fractal-design.com':['case','cooler','fan'], 'nzxt.com':['case','cooler','fan','rgb','psu'],
  'lianli.com':['case','fan','rgb'], 'coolermaster.com':['case','cooler','fan','psu',...PER],
  'thermalright.com':['cooler','fan'], 'noctua.at':['cooler','fan'], 'arctic.de':['cooler','fan'],
  // brands - peripherals
  'logitech.com':['kb','mouse','headset',...PER], 'razer.com':['kb','mouse','headset',...PER,'rgb'],
  'steelseries.com':['kb','mouse','headset',...PER], 'hyperx.com':['ram','kb','mouse','headset'],
  'duckychannel.com.tw':['kb'], 'keychron.com':['kb'],
  'gloriousgaming.com':['mouse','kb'], 'zowie.benq.com':['mouse',...MON],
  // brands - monitors
  'lg.com':MON, 'dell.com':[...MON,...PER], 'benq.com':MON, 'acer.com':[...MON,...PER], 'viewsonic.com':MON,
};

function inferCats(ref: string): string[] {
  const r = (ref||'').toLowerCase();
  for (const [d,c] of Object.entries(MAP)) if (r.includes(d)) return c;
  return [];
}

const pixel = (): Response => new Response(GIF, {
  headers: { 'Content-Type':'image/gif', 'Cache-Control':'no-store,no-cache', 'Pragma':'no-cache' },
});

export const GET: APIRoute = async ({ request }) => {
  const p   = new URL(request.url).searchParams;
  const uid = p.get('uid') || '';
  const ref = p.get('ref') || request.headers.get('referer') || '';
  const cats = inferCats(ref);

  if (uid && cats.length) {
    try {
      const q   = encodeURIComponent(JSON.stringify({ type: PT, slug: uid }));
      const obj = await fetch(`${API}/buckets/${B}/objects?query=${q}&props=id,metadata&read_key=${RK}&limit=1`)
        .then(r => r.json()).then(d => d?.objects?.[0]);
      if (obj) {
        const merged = [...new Set([...(obj.metadata?.pixel_cats||[]), ...cats])];
        await fetch(`${API}/buckets/${B}/objects/${obj.id}`, {
          method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${WK}`},
          body: JSON.stringify({ metadata: { pixel_cats: merged } }),
        });
      }
    } catch(e) { console.warn('[pixel]', e); }
  }

  return pixel();
};

export const POST: APIRoute = GET;
                                     
