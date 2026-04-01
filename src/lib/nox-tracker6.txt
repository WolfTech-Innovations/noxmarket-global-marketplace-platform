const CFG = {
  PIXEL_PATH:   '/api/tracker/pixel',
  PROFILE_PATH: '/api/tracker/profile',
  PROFILE_TYPE: 'nox-user-profiles',
  VEC_DIM:      1024,
  SAVE_DEBOUNCE:10000,
  RERANK_AFTER: 2,

  WEIGHTS: {
    cosine:         1.0,
    recency:        0.05,
    tod:            0.10,
    pixel_cat:      0.07,
    quality:        0.06,
    price_centroid: 0.08,
    novelty:        0.04,
    social_proof:   0.05,
    device_class:   0.03,
    biometric:      0.04,
    reengagement:   0.08,
    momentum:       0.03,
    tab_focus:      0.03,
    copy_signal:    0.02,
    idle_pattern:   0.02,
    resize_class:   0.01,
  },

  CATS: [
    'gpu','cpu','ram','ssd','case','psu','cooler','mobo','monitor','peripheral',
    'kb','mouse','headset','fan','rgb','networking','storage','capture','streaming',
    'vr','audio','lighting','cables','tools','thermal','display','laptop','tablet',
    'controller','microphone','webcam','ups',
  ],
  CONDITIONS: ['new','open-box','refurbished','used','for-parts'],

  PROBE_FONTS: [
    'Arial','Arial Black','Arial Narrow','Calibri','Cambria','Candara','Comic Sans MS',
    'Consolas','Constantia','Corbel','Courier New','Georgia','Impact','Lucida Console',
    'Lucida Sans Unicode','Microsoft Sans Serif','Palatino Linotype','Segoe UI','Tahoma',
    'Times New Roman','Trebuchet MS','Verdana','Wingdings','Helvetica','Monaco',
    'Menlo','SF Pro','SF Mono','Roboto','Ubuntu','Noto Sans','Liberation Sans',
    'DejaVu Sans','FreeSans','OpenSymbol','Andale Mono','Bookman Old Style',
    'Bradley Hand','Century Gothic','Copperplate','Didot','Futura','Geneva',
    'Gill Sans','Hoefler Text','Optima','Papyrus','Skia','Symbol','Zapf Dingbats',
    'Zapfino','American Typewriter','Baskerville','Chalkboard','Cochin','Herculanum',
    'Marker Felt','Noteworthy','Phosphate','Rockwell','Silom','Trattatello',
  ],
};

const cl    = (v) => Math.max(0, Math.min(1, v));
const dot   = (a, b) => a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
const mag   = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));
const cos   = (a, b) => { const m = mag(a) * mag(b); return m ? dot(a, b) / m : 0; };
const lerp  = (a, b, t) => a * (1 - t) + b * t;
const mean  = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
const vari  = (arr) => { if (arr.length < 2) return 0; const m = mean(arr); return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length; };

const catIdx      = (c) => { const i = CFG.CATS.findIndex(x => (c||'').toLowerCase().includes(x)); return i < 0 ? 0.5 : (i + 1) / CFG.CATS.length; };
const condIdx     = (c) => { const i = CFG.CONDITIONS.findIndex(x => (c||'').toLowerCase().includes(x)); return i < 0 ? 0.5 : i / (CFG.CONDITIONS.length - 1); };
const priceNorm   = (p) => cl(Math.log1p(parseFloat(p) || 0) / Math.log1p(5000));
const qualityNorm = (dl, ic) => cl((Math.min(dl, 500) / 500) * 0.6 + (Math.min(ic, 8) / 8) * 0.4);
const daysSince   = (ts) => cl((Date.now() - parseInt(ts || Date.now())) / (1000 * 60 * 60 * 24 * 365));
const timeOfDayBucket = () => { const h = new Date().getHours(); return h < 6 ? 0 : h < 12 ? 0.25 : h < 18 ? 0.5 : h < 22 ? 0.75 : 1.0; };

function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (Math.imul(h, 0x01000193)) >>> 0; }
  return h;
}
const hashNorm = (str) => hash32(str) / 0xFFFFFFFF;

function hasStatisticsConsent() {
  return !!(window.CookieConsent?.consent?.statistics);
}

async function getCanvasFingerprint() {
  try {
    const c = document.createElement('canvas');
    c.width = 240; c.height = 60;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60'; ctx.fillRect(0, 0, 60, 20);
    ctx.fillStyle = '#069'; ctx.font = '11pt Arial';
    ctx.fillText('NoxFP', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('NoxFP', 4, 17);
    ctx.beginPath(); ctx.arc(80, 30, 20, 0, Math.PI * 2);
    ctx.strokeStyle = '#c0f'; ctx.stroke();
    ctx.shadowBlur = 10; ctx.shadowColor = 'red';
    ctx.fillStyle = 'blue'; ctx.fillRect(120, 10, 40, 20);
    return hashNorm(c.toDataURL());
  } catch { return 0.5; }
}

async function getWebGLFingerprint() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return { score: 0.5, tier: 0.5, maxTexSize: 0.5, extCount: 0.5 };
    const dbg      = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
    const vendor   = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)   : '';
    const exts     = gl.getSupportedExtensions()?.join(',') || '';
    const rl = renderer.toLowerCase();
    const tier = rl.includes('nvidia') || rl.includes('radeon rx') ? 0.9
      : rl.includes('apple') ? 0.7 : rl.includes('intel') ? 0.4
      : rl.includes('adreno') ? 0.5 : rl.includes('mali') ? 0.3 : 0.5;
    const sp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const spScore = sp ? cl((sp.rangeMax || 0) / 127) : 0.5;
    return {
      score:      hashNorm(renderer + vendor + exts),
      tier,
      maxTexSize: cl(Math.log2(gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096) / 15),
      extCount:   cl(exts.split(',').length / 50),
      spScore,
      vendor:     hashNorm(vendor),
    };
  } catch { return { score: 0.5, tier: 0.5, maxTexSize: 0.5, extCount: 0.5, spScore: 0.5, vendor: 0.5 }; }
}

async function getAudioFingerprint() {
  try {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    const osc = ctx.createOscillator();
    osc.type = 'triangle'; osc.frequency.value = 1000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -50; comp.knee.value = 40;
    comp.ratio.value = 12; comp.attack.value = 0; comp.release.value = 0.25;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    osc.connect(comp); comp.connect(gain); gain.connect(ctx.destination); osc.start(0);
    const buf = await ctx.startRendering();
    const data = buf.getChannelData(0);
    let sum = 0, peak = 0;
    for (let i = 0; i < data.length; i++) { const a = Math.abs(data[i]); sum += a; if (a > peak) peak = a; }
    return { hash: cl(sum / data.length * 1000), peak: cl(peak * 100) };
  } catch { return { hash: 0.5, peak: 0.5 }; }
}

function getFontFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const testStr = 'mmmmmmmmmmlli';
    ctx.font = '72px monospace';
    const baseW = ctx.measureText(testStr).width;
    let bits = 0, idx = 0;
    for (const font of CFG.PROBE_FONTS) {
      ctx.font = `72px '${font}', monospace`;
      if (ctx.measureText(testStr).width !== baseW) bits |= (1 << (idx % 32));
      idx++;
    }
    return cl(bits / 0xFFFFFFFF);
  } catch { return 0.5; }
}

async function getBatteryFingerprint() {
  try {
    if (!navigator.getBattery) return { level: 0.5, charging: 0.5, chargingTime: 0.5, dischargingTime: 0.5 };
    const bat = await navigator.getBattery();
    return {
      level:           bat.level,
      charging:        bat.charging ? 1.0 : 0.0,
      chargingTime:    cl(1 - Math.min(bat.chargingTime || 3600, 3600) / 3600),
      dischargingTime: cl(Math.min(bat.dischargingTime || 0, 28800) / 28800),
    };
  } catch { return { level: 0.5, charging: 0.5, chargingTime: 0.5, dischargingTime: 0.5 }; }
}

function getConnectionFingerprint() {
  try {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return { type: 0.5, speed: 0.5, rtt: 0.5, saveData: 0 };
    const typeMap = { 'slow-2g':0.1,'2g':0.25,'3g':0.5,'4g':0.75,'5g':0.9,'wifi':0.85,'ethernet':1.0 };
    return {
      type:     typeMap[conn.effectiveType] ?? 0.5,
      speed:    cl((conn.downlink || 5) / 100),
      rtt:      cl(1 - (conn.rtt || 100) / 500),
      saveData: conn.saveData ? 1 : 0,
    };
  } catch { return { type: 0.5, speed: 0.5, rtt: 0.5, saveData: 0 }; }
}

async function getWebGPUFingerprint() {
  try {
    if (!navigator.gpu) return { tier: 0.5, score: 0.5 };
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { tier: 0.5, score: 0.5 };
    const info = adapter.info || {};
    const arch = (info.architecture || '').toLowerCase();
    const tier = arch.includes('rdna') || arch.includes('ampere') ? 0.95
      : arch.includes('turing') ? 0.85 : arch.includes('gcn') ? 0.6
      : arch.includes('apple') ? 0.75 : 0.5;
    const limits = adapter.limits || {};
    const maxBuf = cl(Math.log2((limits.maxBufferSize || 1) + 1) / 40);
    return { tier, score: hashNorm((info.vendor||'') + (info.device||'') + arch), maxBuf };
  } catch { return { tier: 0.5, score: 0.5, maxBuf: 0.5 }; }
}

function getPerformanceClass() {
  try {
    const entries = performance.getEntriesByType('navigation');
    if (!entries.length) return { perf: 0.5, dns: 0.5, tcp: 0.5, ttfb: 0.5 };
    const e = entries[0];
    return {
      perf: cl(1 - (e.loadEventEnd - e.startTime) / 10000),
      dns:  cl(1 - (e.domainLookupEnd - e.domainLookupStart) / 1000),
      tcp:  cl(1 - (e.connectEnd - e.connectStart) / 1000),
      ttfb: cl(1 - (e.responseStart - e.requestStart) / 3000),
    };
  } catch { return { perf: 0.5, dns: 0.5, tcp: 0.5, ttfb: 0.5 }; }
}

function getMediaCapabilities() {
  try {
    return {
      maxTouchPoints: cl(navigator.maxTouchPoints / 10),
      cookieEnabled:  navigator.cookieEnabled ? 1 : 0,
      pdfViewerEnabled: navigator.pdfViewerEnabled ? 1 : 0,
      languages:      cl(hashNorm((navigator.languages||[]).join(','))),
      platform:       hashNorm(navigator.platform||''),
      vendor:         hashNorm(navigator.vendor||''),
    };
  } catch { return { maxTouchPoints: 0.5, cookieEnabled: 0.5, pdfViewerEnabled: 0.5, languages: 0.5, platform: 0.5, vendor: 0.5 }; }
}

function getScreenFingerprint() {
  try {
    return {
      width:       cl(screen.width / 3840),
      height:      cl(screen.height / 2160),
      availWidth:  cl(screen.availWidth / 3840),
      availHeight: cl(screen.availHeight / 2160),
      colorDepth:  cl(screen.colorDepth / 32),
      pixelRatio:  cl((window.devicePixelRatio || 1) / 4),
      orientation: (screen.orientation?.type||'').includes('landscape') ? 1 : 0,
      taskbarSize: cl(Math.abs(screen.height - screen.availHeight) / 200),
    };
  } catch { return { width:0.5,height:0.5,availWidth:0.5,availHeight:0.5,colorDepth:0.5,pixelRatio:0.5,orientation:0.5,taskbarSize:0.5 }; }
}

async function collectDeviceDims() {
  const [webgl, audio, bat, gpu] = await Promise.all([
    getWebGLFingerprint(), getAudioFingerprint(),
    getBatteryFingerprint(), getWebGPUFingerprint(),
  ]);
  const canvas = await getCanvasFingerprint();
  const conn   = getConnectionFingerprint();
  const fonts  = getFontFingerprint();
  const perf   = getPerformanceClass();
  const media  = getMediaCapabilities();
  const scr    = getScreenFingerprint();

  return {
    canvas_hash:    canvas,
    webgl_score:    webgl.score,
    webgl_tier:     webgl.tier,
    webgl_tex:      webgl.maxTexSize,
    webgl_ext:      webgl.extCount,
    webgl_sp:       webgl.spScore,
    webgl_vendor:   webgl.vendor,
    audio_hash:     audio.hash,
    audio_peak:     audio.peak,
    font_profile:   fonts,
    battery_level:  bat.level,
    battery_charge: bat.charging,
    battery_ct:     bat.chargingTime,
    battery_dt:     bat.dischargingTime,
    conn_type:      conn.type,
    conn_speed:     conn.speed,
    conn_rtt:       conn.rtt,
    conn_save:      conn.saveData,
    gpu_tier:       gpu.tier,
    gpu_score:      gpu.score,
    gpu_maxbuf:     gpu.maxBuf,
    pointer_type:   window.matchMedia('(pointer: fine)').matches ? 1.0 : 0.0,
    hover_support:  window.matchMedia('(hover: hover)').matches ? 1.0 : 0.0,
    hdr_support:    window.matchMedia('(dynamic-range: high)').matches ? 1.0 : 0.0,
    prefers_dark:   window.matchMedia('(prefers-color-scheme: dark)').matches ? 1.0 : 0.0,
    prefers_reduced:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1.0 : 0.0,
    hw_concurrency: cl((navigator.hardwareConcurrency || 2) / 32),
    device_memory:  cl((navigator.deviceMemory || 2) / 32),
    screen_w:       scr.width,
    screen_h:       scr.height,
    screen_avail_w: scr.availWidth,
    screen_avail_h: scr.availHeight,
    screen_class:   scr.width < 0.2 ? 0.2 : scr.width < 0.27 ? 0.5 : scr.width < 0.5 ? 0.75 : 1.0,
    pixel_ratio:    scr.pixelRatio,
    color_depth:    scr.colorDepth,
    orientation:    scr.orientation,
    taskbar_size:   scr.taskbarSize,
    perf_class:     perf.perf,
    perf_dns:       perf.dns,
    perf_tcp:       perf.tcp,
    perf_ttfb:      perf.ttfb,
    webgpu_tier:    gpu.tier,
    touch_points:   media.maxTouchPoints,
    pdf_viewer:     media.pdfViewerEnabled,
    lang_hash:      media.languages,
    platform_hash:  media.platform,
    vendor_hash:    media.vendor,
    tz_offset:      cl((new Date().getTimezoneOffset() + 720) / 1440),
    tz_hash:        hashNorm(Intl.DateTimeFormat().resolvedOptions().timeZone||''),
    locale_hash:    hashNorm(navigator.language||''),
  };
}

const BioTracker = (() => {
  const mouseVels = [], mouseCurves = [], scrollAccels = [];
  const dwellPositions = [], keystrokeIKIs = [];
  const clickIntervals = [], touchPressures = [], touchAreas = [];
  const focusGaps = [], tabSwitches = [];
  let lmx=0, lmy=0, lmt=0, lsy=0, lst=0, lsv=0, lkt=0;
  let rageClicks=0, totalClicks=0, lct=0, lcx=0, lcy=0;
  let idleStart=0, totalIdleMs=0, idleCount=0;
  let lastFocusTime=Date.now(), focusBlurCount=0, visibilityChanges=0;
  let copyCount=0, pasteCount=0, contextMenuCount=0;
  let resizeCount=0, lastW=window.innerWidth, lastH=window.innerHeight;
  let wheelDeltaSum=0, wheelEvents=0;
  let selectionCount=0, lastSelectionLen=0;
  let mouseEnterCount=0, mouseLeaveCount=0;
  let longPressCount=0, lpTimer=null;

  function onMouseMove(e) {
    const t = Date.now();
    if (lmt && t-lmt > 0 && t-lmt < 500) {
      const dx=e.clientX-lmx, dy=e.clientY-lmy;
      const vel = Math.sqrt(dx*dx+dy*dy)/(t-lmt);
      mouseVels.push(vel); if (mouseVels.length>60) mouseVels.shift();
      if (mouseVels.length>2) {
        const prev = mouseVels[mouseVels.length-2];
        mouseCurves.push(cl(Math.abs(vel-prev)/(prev+0.001)));
        if (mouseCurves.length>40) mouseCurves.shift();
      }
    }
    if (idleStart && t-idleStart > 3000) { totalIdleMs += t-idleStart; idleCount++; }
    idleStart = t;
    lmx=e.clientX; lmy=e.clientY; lmt=t;
  }

  function onScroll() {
    const t=Date.now(), y=window.scrollY;
    if (lst && t-lst>0) {
      const vel=Math.abs(y-lsy)/(t-lst);
      scrollAccels.push(cl(Math.abs(vel-lsv)*10));
      if (scrollAccels.length>40) scrollAccels.shift();
      lsv=vel;
    }
    lsy=y; lst=t;
  }

  function onWheel(e) {
    wheelDeltaSum += Math.abs(e.deltaY); wheelEvents++;
  }

  function onKeydown(e) {
    const t=Date.now();
    if (lkt && t-lkt<2000) { keystrokeIKIs.push(t-lkt); if (keystrokeIKIs.length>50) keystrokeIKIs.shift(); }
    lkt=t;
    if (e.ctrlKey && e.key==='c') copyCount++;
    if (e.ctrlKey && e.key==='v') pasteCount++;
  }

  function onClick(e) {
    const t=Date.now(); totalClicks++;
    if (lct && t-lct<500) {
      const dx=e.clientX-lcx, dy=e.clientY-lcy;
      if (Math.sqrt(dx*dx+dy*dy)<20) rageClicks++;
    }
    if (lct) { clickIntervals.push(t-lct); if (clickIntervals.length>30) clickIntervals.shift(); }
    lct=t; lcx=e.clientX; lcy=e.clientY;
  }

  function onTouchStart(e) {
    if (!e.touches[0]) return;
    const t = e.touches[0];
    if (t.force !== undefined && t.force > 0) { touchPressures.push(cl(t.force)); if (touchPressures.length>30) touchPressures.shift(); }
    if (t.radiusX !== undefined) { touchAreas.push(cl((t.radiusX * t.radiusY * Math.PI) / 10000)); if (touchAreas.length>30) touchAreas.shift(); }
    if (lpTimer) clearTimeout(lpTimer);
    lpTimer = setTimeout(() => { longPressCount++; lpTimer=null; }, 600);
  }

  function onTouchEnd() { if (lpTimer) { clearTimeout(lpTimer); lpTimer=null; } }

  function onVisibilityChange() {
    visibilityChanges++;
    if (document.hidden) {
      lastFocusTime = Date.now();
    } else {
      if (lastFocusTime) { focusGaps.push(Date.now()-lastFocusTime); if (focusGaps.length>20) focusGaps.shift(); }
    }
  }

  function onFocus()    { focusBlurCount++; tabSwitches.push(Date.now()); if (tabSwitches.length>20) tabSwitches.shift(); }
  function onBlur()     { focusBlurCount++; }
  function onCopy()     { copyCount++; }
  function onPaste()    { pasteCount++; }
  function onContextMenu() { contextMenuCount++; }

  function onResize() {
    const dw = Math.abs(window.innerWidth-lastW), dh = Math.abs(window.innerHeight-lastH);
    if (dw > 10 || dh > 10) { resizeCount++; lastW=window.innerWidth; lastH=window.innerHeight; }
  }

  function onSelectionChange() {
    const sel = window.getSelection()?.toString() || '';
    if (sel.length > 3 && sel.length !== lastSelectionLen) { selectionCount++; lastSelectionLen=sel.length; }
  }

  function onMouseEnter() { mouseEnterCount++; }
  function onMouseLeave() { mouseLeaveCount++; }

  function attach() {
    window.addEventListener('mousemove',       onMouseMove,        { passive:true });
    window.addEventListener('scroll',          onScroll,           { passive:true });
    window.addEventListener('wheel',           onWheel,            { passive:true });
    window.addEventListener('keydown',         onKeydown,          { passive:true });
    window.addEventListener('click',           onClick,            { passive:true });
    window.addEventListener('touchstart',      onTouchStart,       { passive:true });
    window.addEventListener('touchend',        onTouchEnd,         { passive:true });
    window.addEventListener('focus',           onFocus,            { passive:true });
    window.addEventListener('blur',            onBlur,             { passive:true });
    window.addEventListener('copy',            onCopy,             { passive:true });
    window.addEventListener('paste',           onPaste,            { passive:true });
    window.addEventListener('contextmenu',     onContextMenu,      { passive:true });
    window.addEventListener('resize',          onResize,           { passive:true });
    document.addEventListener('visibilitychange', onVisibilityChange, { passive:true });
    document.addEventListener('selectionchange',  onSelectionChange,  { passive:true });
    document.addEventListener('mouseenter',    onMouseEnter,       { passive:true });
    document.addEventListener('mouseleave',    onMouseLeave,       { passive:true });
  }

  function recordDwellPosition() {
    const pct = cl(window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1));
    dwellPositions.push(pct); if (dwellPositions.length>30) dwellPositions.shift();
  }

  function getDims() {
    const avgFocusGap   = mean(focusGaps);
    const tabSwitchRate = cl(tabSwitches.length / Math.max((Date.now() - (tabSwitches[0]||Date.now())) / 60000, 1) / 10);
    const wheelIntensity = cl(wheelEvents > 0 ? wheelDeltaSum / wheelEvents / 5000 : 0.5);
    const touchPressureMean = mean(touchPressures.length ? touchPressures : [0.5]);
    const touchAreaMean     = mean(touchAreas.length     ? touchAreas     : [0.5]);
    return {
      mouse_speed_mean:   cl(mean(mouseVels)*2),
      mouse_speed_var:    cl(vari(mouseVels)*4),
      mouse_curve_mean:   cl(mean(mouseCurves)),
      scroll_accel_mean:  cl(mean(scrollAccels)),
      scroll_accel_var:   cl(vari(scrollAccels)*4),
      keystroke_mean:     cl(mean(keystrokeIKIs)/500),
      keystroke_var:      cl(vari(keystrokeIKIs)/50000),
      dwell_pos_mean:     cl(mean(dwellPositions)),
      dwell_pos_var:      cl(vari(dwellPositions)*4),
      rage_click_ratio:   cl(totalClicks>0 ? rageClicks/totalClicks*10 : 0),
      click_interval_mean:cl(mean(clickIntervals)/2000),
      click_interval_var: cl(vari(clickIntervals)/1000000),
      idle_ratio:         cl(totalIdleMs / Math.max(Date.now()-lmt, 1)),
      idle_count:         cl(idleCount / 20),
      focus_blur_rate:    cl(focusBlurCount / 20),
      visibility_changes: cl(visibilityChanges / 10),
      avg_focus_gap:      cl(avgFocusGap / 60000),
      tab_switch_rate:    tabSwitchRate,
      copy_rate:          cl(copyCount / 10),
      paste_rate:         cl(pasteCount / 5),
      context_menu_rate:  cl(contextMenuCount / 5),
      resize_count:       cl(resizeCount / 10),
      wheel_intensity:    wheelIntensity,
      selection_rate:     cl(selectionCount / 20),
      touch_pressure:     touchPressureMean,
      touch_area:         touchAreaMean,
      long_press_rate:    cl(longPressCount / 10),
      mouse_enter_rate:   cl(mouseEnterCount / 30),
      mouse_leave_rate:   cl(mouseLeaveCount / 30),
    };
  }

  return { attach, recordDwellPosition, getDims };
})();

// ─── MICRO-GESTURE TRACKER ────────────────────────────────────────────────────
// Tracks sub-second mouse/touch behavior: tremor, hesitation, dead-zones,
// hover-before-click, cursor path complexity, overshoot patterns.
const MicroGestureTracker = (() => {
  // Raw sample buffers
  const hoverDurations   = [];   // ms hovering before each click
  const overShootDeltas  = [];   // how far cursor overshoots target before click
  const deadZoneEvents   = [];   // periods where cursor doesn't move >2px for >200ms
  const tremorSamples    = [];   // micro-jitter magnitude while "still"
  const pathComplexity   = [];   // direction-change count per movement segment
  const clickPrecision   = [];   // distance from center of clicked element
  const touchSplitDeltas = [];   // multi-finger split/pinch gesture magnitudes
  const gestureVelocityProfile = []; // velocity curve shape (accel phase ratio)
  const microPauseCount  = [];   // sub-300ms pauses mid-gesture
  const cursorReturnAngles = []; // angle of return-to-element after leaving

  let hoverStart = 0, hoverTarget = null;
  let prevMoveTime = 0, prevMoveX = 0, prevMoveY = 0;
  let stillStart = 0, stillX = 0, stillY = 0, inDeadZone = false;
  let segmentDirs = [], lastDir = null;
  let gesturePoints = [];
  let touchStart1 = null, touchStart2 = null;
  let lastLeaveEl = null, lastLeaveTime = 0, lastLeaveX = 0, lastLeaveY = 0;

  function angleBetween(x1,y1,x2,y2) {
    return Math.atan2(y2-y1, x2-x1);
  }
  function dirBucket(dx, dy) {
    const a = Math.atan2(dy, dx);
    return Math.round(a / (Math.PI / 4));
  }

  function onMouseMove(e) {
    const t = Date.now();
    const x = e.clientX, y = e.clientY;
    const dx = x - prevMoveX, dy = y - prevMoveY;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Dead-zone / tremor detection
    if (dist < 2) {
      if (!inDeadZone) { stillStart = t; stillX = x; stillY = y; inDeadZone = true; }
      else if (t - stillStart > 200) {
        // measure tremor while "still"
        const td = Math.sqrt((x-stillX)**2 + (y-stillY)**2);
        tremorSamples.push(cl(td / 10));
        if (tremorSamples.length > 80) tremorSamples.shift();
      }
    } else {
      if (inDeadZone && t - stillStart > 200) {
        deadZoneEvents.push(t - stillStart);
        if (deadZoneEvents.length > 40) deadZoneEvents.shift();
      }
      inDeadZone = false;

      // Direction-change complexity
      const dir = dirBucket(dx, dy);
      if (lastDir !== null && dir !== lastDir) {
        segmentDirs.push(1);
      }
      lastDir = dir;

      // Gesture velocity profile
      if (t - prevMoveTime > 0 && t - prevMoveTime < 200) {
        const vel = dist / (t - prevMoveTime);
        gesturePoints.push(vel);
        if (gesturePoints.length > 20) {
          // measure how front-loaded the acceleration is
          const half = Math.floor(gesturePoints.length / 2);
          const firstHalf = mean(gesturePoints.slice(0, half));
          const secondHalf = mean(gesturePoints.slice(half));
          const ratio = cl(firstHalf / (firstHalf + secondHalf + 0.001));
          gestureVelocityProfile.push(ratio);
          if (gestureVelocityProfile.length > 50) gestureVelocityProfile.shift();
          gesturePoints = [];
          segmentDirs = [];
        }
      }
    }

    prevMoveTime = t; prevMoveX = x; prevMoveY = y;

    // Return-to-element tracking
    if (lastLeaveEl && t - lastLeaveTime < 3000) {
      const angle = angleBetween(lastLeaveX, lastLeaveY, x, y);
      cursorReturnAngles.push(cl((angle + Math.PI) / (2 * Math.PI)));
      if (cursorReturnAngles.length > 30) cursorReturnAngles.shift();
      lastLeaveEl = null;
    }
  }

  function onMouseOver(e) {
    if (e.target && e.target.dataset?.id) {
      hoverStart = Date.now();
      hoverTarget = e.target.dataset.id;
    }
  }

  function onMouseOut(e) {
    if (e.target && e.target.dataset?.id) {
      lastLeaveEl = e.target;
      lastLeaveTime = Date.now();
      lastLeaveX = e.clientX;
      lastLeaveY = e.clientY;
    }
  }

  function onClick(e) {
    const t = Date.now();
    // Hover duration before click
    if (hoverStart && hoverTarget) {
      const dur = t - hoverStart;
      if (dur > 0 && dur < 30000) {
        hoverDurations.push(cl(Math.log1p(dur) / Math.log1p(30000)));
        if (hoverDurations.length > 50) hoverDurations.shift();
      }
      hoverStart = 0; hoverTarget = null;
    }

    // Click precision (distance from element center)
    if (e.target && e.target.getBoundingClientRect) {
      const r = e.target.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const d = Math.sqrt((e.clientX-cx)**2 + (e.clientY-cy)**2);
      const maxD = Math.sqrt((r.width/2)**2 + (r.height/2)**2);
      clickPrecision.push(cl(1 - d / (maxD + 0.001)));
      if (clickPrecision.length > 50) clickPrecision.shift();
    }

    // Overshoot: how far were we from the element just before settling?
    if (overShootDeltas.length < 50) {
      overShootDeltas.push(cl(Math.abs(prevMoveX - e.clientX) / (window.innerWidth + 1)));
    }
    if (overShootDeltas.length > 50) overShootDeltas.shift();

    // Path complexity for this gesture
    if (segmentDirs.length > 0) {
      pathComplexity.push(cl(segmentDirs.length / 20));
      if (pathComplexity.length > 40) pathComplexity.shift();
    }
  }

  function onTouchStart(e) {
    if (e.touches.length >= 2) {
      touchStart1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchStart2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
    }
  }

  function onTouchMove(e) {
    if (e.touches.length >= 2 && touchStart1 && touchStart2) {
      const d1 = Math.sqrt((e.touches[0].clientX-touchStart1.x)**2 + (e.touches[0].clientY-touchStart1.y)**2);
      const d2 = Math.sqrt((e.touches[1].clientX-touchStart2.x)**2 + (e.touches[1].clientY-touchStart2.y)**2);
      touchSplitDeltas.push(cl((d1+d2)/200));
      if (touchSplitDeltas.length > 30) touchSplitDeltas.shift();
    }
  }

  function onTouchEnd() { touchStart1 = null; touchStart2 = null; }

  function attach() {
    window.addEventListener('mousemove',   onMouseMove, { passive: true });
    window.addEventListener('mouseover',   onMouseOver, { passive: true });
    window.addEventListener('mouseout',    onMouseOut,  { passive: true });
    window.addEventListener('click',       onClick,     { passive: true });
    window.addEventListener('touchstart',  onTouchStart,{ passive: true });
    window.addEventListener('touchmove',   onTouchMove, { passive: true });
    window.addEventListener('touchend',    onTouchEnd,  { passive: true });
  }

  function getDims() {
    return {
      hover_dur_mean:        cl(mean(hoverDurations.length ? hoverDurations : [0.5])),
      hover_dur_var:         cl(vari(hoverDurations.length > 2 ? hoverDurations : [0.5, 0.5]) * 4),
      overshoot_mean:        cl(mean(overShootDeltas.length ? overShootDeltas : [0.5])),
      dead_zone_mean:        cl(mean(deadZoneEvents.map(d => d/5000).slice(-30))),
      dead_zone_count:       cl(deadZoneEvents.length / 40),
      tremor_mean:           cl(mean(tremorSamples.length ? tremorSamples : [0.5])),
      tremor_var:            cl(vari(tremorSamples.length > 2 ? tremorSamples : [0.5, 0.5]) * 4),
      path_complexity_mean:  cl(mean(pathComplexity.length ? pathComplexity : [0.5])),
      click_precision_mean:  cl(mean(clickPrecision.length ? clickPrecision : [0.5])),
      click_precision_var:   cl(vari(clickPrecision.length > 2 ? clickPrecision : [0.5, 0.5]) * 4),
      touch_split_mean:      cl(mean(touchSplitDeltas.length ? touchSplitDeltas : [0.5])),
      gesture_vel_profile:   cl(mean(gestureVelocityProfile.length ? gestureVelocityProfile : [0.5])),
      cursor_return_angle:   cl(mean(cursorReturnAngles.length ? cursorReturnAngles : [0.5])),
      micro_pause_density:   cl(deadZoneEvents.filter(d => d < 300).length / 20),
    };
  }

  return { attach, getDims };
})();


// ─── READING BEHAVIOR TRACKER ─────────────────────────────────────────────────
// Estimates reading speed, detects scan vs. deep-read, re-read events,
// paragraph skip patterns, and title-vs-body engagement ratio.
const ReadingBehaviorTracker = (() => {
  const readingSpeeds    = [];  // chars/sec inferred from scroll pace over text
  const reReadEvents     = [];  // times user scrolled back up into seen content
  const scanSessions     = [];  // 0=deep read, 1=scan (high scroll speed)
  const paraEngagement   = [];  // per-paragraph estimated engagement (0–1)
  const titleViewTimes   = [];  // ms spent with title visible
  const bodyViewRatios   = [];  // ratio of body text viewed vs total

  let lastScrollY   = 0, lastScrollT = 0;
  let totalCharsEstimated = 0, totalReadMs = 0;
  let scrollBackCount = 0, totalScrollEvents = 0;
  let maxScrollReached = 0;
  let titleVisStart = 0, titleVisible = false;
  let iO = null;

  // Rough chars-per-pixel constant for typical body text at 16px
  const CHARS_PER_PX = 0.12;
  const SCAN_THRESHOLD = 3.0; // px/ms = fast scan

  function onScroll() {
    const t = Date.now(), y = window.scrollY;
    totalScrollEvents++;

    if (lastScrollT && t - lastScrollT > 0 && t - lastScrollT < 1000) {
      const dy = y - lastScrollY;
      const dt = t - lastScrollT;
      const vel = Math.abs(dy) / dt; // px/ms

      if (dy < 0 && lastScrollY > 0) {
        // Scrolling back up — re-read event
        scrollBackCount++;
        reReadEvents.push({ depth: cl(lastScrollY / Math.max(document.body.scrollHeight, 1)), ts: t });
        if (reReadEvents.length > 30) reReadEvents.shift();
      }

      if (vel > 0 && vel < SCAN_THRESHOLD && dy > 0) {
        // Slow downward scroll — reading
        const charsThisSlice = Math.abs(dy) * CHARS_PER_PX;
        totalCharsEstimated += charsThisSlice;
        totalReadMs += dt;
        const speed = charsThisSlice / (dt / 1000);
        readingSpeeds.push(cl(speed / 30)); // 30 chars/sec = engaged read
        if (readingSpeeds.length > 60) readingSpeeds.shift();

        // Paragraph engagement proxy: depth of slowest scroll zones
        paraEngagement.push(cl(1 - vel / SCAN_THRESHOLD));
        if (paraEngagement.length > 80) paraEngagement.shift();
      } else if (vel >= SCAN_THRESHOLD && dy > 0) {
        scanSessions.push(1);
        if (scanSessions.length > 40) scanSessions.shift();
      } else if (dy > 0) {
        scanSessions.push(0);
        if (scanSessions.length > 40) scanSessions.shift();
      }
    }

    if (y > maxScrollReached) maxScrollReached = y;
    lastScrollY = y; lastScrollT = t;
  }

  function observeTitleElement() {
    const titleEl = document.querySelector('h1, .title, [data-title]');
    if (!titleEl || iO) return;
    iO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !titleVisible) {
          titleVisible = true; titleVisStart = Date.now();
        } else if (!e.isIntersecting && titleVisible) {
          titleVisible = false;
          const dur = Date.now() - titleVisStart;
          if (dur > 100 && dur < 60000) {
            titleViewTimes.push(cl(Math.log1p(dur) / Math.log1p(60000)));
            if (titleViewTimes.length > 30) titleViewTimes.shift();
          }
        }
      });
    }, { threshold: 0.5 });
    iO.observe(titleEl);
  }

  function attach() {
    window.addEventListener('scroll', onScroll, { passive: true });
    // Defer title observation until DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeTitleElement);
    } else {
      observeTitleElement();
    }
  }

  function getDims() {
    const bodyScrollH = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const depthRatio  = cl(maxScrollReached / bodyScrollH);
    const reReadRatio = totalScrollEvents > 0 ? cl(scrollBackCount / totalScrollEvents * 5) : 0.5;
    const scanRatio   = scanSessions.length > 0
      ? cl(scanSessions.filter(s=>s===1).length / scanSessions.length)
      : 0.5;
    const avgReadSpeed    = cl(mean(readingSpeeds.length ? readingSpeeds : [0.5]));
    const readSpeedVar    = cl(vari(readingSpeeds.length > 2 ? readingSpeeds : [0.5, 0.5]) * 4);
    const paraEngMean     = cl(mean(paraEngagement.length ? paraEngagement : [0.5]));
    const titleViewMean   = cl(mean(titleViewTimes.length ? titleViewTimes : [0.5]));
    const reReadDepthMean = cl(mean(reReadEvents.map(r=>r.depth).slice(-20)));
    const reReadRecency   = reReadEvents.length > 0
      ? cl(1 - (Date.now() - reReadEvents[reReadEvents.length-1].ts) / 120000)
      : 0;

    return {
      read_speed_mean:    avgReadSpeed,
      read_speed_var:     readSpeedVar,
      scroll_depth_ratio: depthRatio,
      re_read_ratio:      reReadRatio,
      scan_ratio:         scanRatio,
      para_eng_mean:      paraEngMean,
      title_view_mean:    titleViewMean,
      re_read_depth:      reReadDepthMean,
      re_read_recency:    reReadRecency,
      body_view_ratio:    depthRatio, // proxy
    };
  }

  return { attach, getDims };
})();


// ─── ATTENTION HEATMAP TRACKER ────────────────────────────────────────────────
// Tracks viewport dwell by vertical zone, return-to-top events, above-fold
// obsession, below-fold discovery rate, and scroll rhythm periodicity.
const AttentionHeatmapTracker = (() => {
  const ZONES = 10; // divide page into 10 vertical zones
  const zoneDwell  = new Array(ZONES).fill(0);   // ms per zone
  const zoneVisits = new Array(ZONES).fill(0);   // visit count per zone
  let lastZone     = -1, lastZoneStart = 0;
  let returnToTopCount = 0, lastScrollY2 = 0;
  let foldBreachCount  = 0, hasBroachedFold = false;
  let scrollPeriods    = [];  // timestamps of scroll direction reversals
  let lastDir2         = 0;  // -1 up, 1 down
  const scrollRhythm   = [];  // inter-reversal intervals (ms)
  const zoneTransitionMatrix = new Array(ZONES * ZONES).fill(0); // zone→zone transitions

  function currentZone() {
    const bodyH = Math.max(document.body.scrollHeight, window.innerHeight);
    const pct   = window.scrollY / bodyH;
    return Math.min(Math.floor(pct * ZONES), ZONES - 1);
  }

  function onScroll() {
    const t = Date.now(), y = window.scrollY;
    const zone = currentZone();

    // Zone dwell
    if (lastZone >= 0 && lastZoneStart > 0) {
      zoneDwell[lastZone]  += t - lastZoneStart;
    }
    if (zone !== lastZone) {
      if (lastZone >= 0 && zone >= 0) {
        const idx = lastZone * ZONES + zone;
        zoneTransitionMatrix[idx] = Math.min(zoneTransitionMatrix[idx] + 1, 255);
      }
      zoneVisits[zone]++;
      lastZone = zone; lastZoneStart = t;
    }

    // Return to top
    if (lastScrollY2 > 200 && y < 50) {
      returnToTopCount++;
    }

    // Fold breach
    if (!hasBroachedFold && y > window.innerHeight) {
      foldBreachCount++; hasBroachedFold = true;
    }
    if (y < 10) hasBroachedFold = false;

    // Scroll rhythm
    const dir = y > lastScrollY2 ? 1 : y < lastScrollY2 ? -1 : 0;
    if (dir !== 0 && dir !== lastDir2) {
      const now = Date.now();
      if (scrollPeriods.length > 0) {
        const interval = now - scrollPeriods[scrollPeriods.length-1];
        if (interval > 50 && interval < 10000) {
          scrollRhythm.push(cl(interval / 5000));
          if (scrollRhythm.length > 60) scrollRhythm.shift();
        }
      }
      scrollPeriods.push(now);
      if (scrollPeriods.length > 60) scrollPeriods.shift();
    }
    if (dir !== 0) lastDir2 = dir;
    lastScrollY2 = y;
  }

  function attach() {
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function getDims() {
    const totalDwell = Math.max(zoneDwell.reduce((a,b)=>a+b,0), 1);
    const normDwell  = zoneDwell.map(d => cl(d / totalDwell));
    // Top-heavy vs bottom-heavy attention
    const topHalf    = mean(normDwell.slice(0, ZONES/2));
    const bottomHalf = mean(normDwell.slice(ZONES/2));
    const aboveFoldObsession = cl(topHalf / (topHalf + bottomHalf + 0.001));
    // Zone entropy (how evenly is attention distributed?)
    const zoneProbs  = normDwell.map(d => d / (normDwell.reduce((a,b)=>a+b,0)+1e-9));
    const zoneEntropy = cl(-zoneProbs.reduce((s,p)=>s+(p>0?p*Math.log2(p+1e-9):0),0) / Math.log2(ZONES));
    // Transition entropy (how predictable is navigation?)
    const totalTrans = Math.max(zoneTransitionMatrix.reduce((a,b)=>a+b,0), 1);
    const transProbs = zoneTransitionMatrix.map(v => v / totalTrans);
    const transEntropy = cl(-transProbs.reduce((s,p)=>s+(p>0?p*Math.log2(p+1e-9):0),0) / Math.log2(ZONES*ZONES));

    return {
      zone_entropy:         zoneEntropy,
      above_fold_obsession: aboveFoldObsession,
      return_to_top_rate:   cl(returnToTopCount / 20),
      fold_breach_rate:     cl(foldBreachCount / 5),
      scroll_rhythm_mean:   cl(mean(scrollRhythm.length ? scrollRhythm : [0.5])),
      scroll_rhythm_var:    cl(vari(scrollRhythm.length > 2 ? scrollRhythm : [0.5, 0.5]) * 4),
      trans_entropy:        transEntropy,
      zone_0_dwell:         normDwell[0] ?? 0.5,
      zone_1_dwell:         normDwell[1] ?? 0.5,
      zone_2_dwell:         normDwell[2] ?? 0.5,
      zone_3_dwell:         normDwell[3] ?? 0.5,
      zone_4_dwell:         normDwell[4] ?? 0.5,
      zone_5_dwell:         normDwell[5] ?? 0.5,
      zone_6_dwell:         normDwell[6] ?? 0.5,
      zone_7_dwell:         normDwell[7] ?? 0.5,
      zone_8_dwell:         normDwell[8] ?? 0.5,
      zone_9_dwell:         normDwell[9] ?? 0.5,
    };
  }

  return { attach, getDims };
})();


// ─── SESSION RHYTHM TRACKER ───────────────────────────────────────────────────
// Models burst vs. browse sessions, inter-session gap decay, session momentum,
// visit streak, time-since-last-skip-streak, and engagement velocity trends.
const SessionRhythmTracker = (() => {
  const SESSION_KEY   = 'nox_session_log';
  const MAX_SESSIONS  = 50;

  let sessions = [];

  function loadSessions() {
    try { sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'); } catch { sessions = []; }
  }

  function saveSessions() {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.slice(-MAX_SESSIONS))); } catch {}
  }

  // Call once at session start
  function recordSessionStart(interactionCount, skipRatio) {
    const now = Date.now();
    const prev = sessions[sessions.length - 1];
    const gapMs = prev ? now - prev.end : null;
    sessions.push({ start: now, end: now, interactions: interactionCount, skipRatio, gapMs });
    if (sessions.length > MAX_SESSIONS) sessions.shift();
    saveSessions();
  }

  function updateSessionEnd(interactionCount, skipRatio) {
    if (sessions.length > 0) {
      sessions[sessions.length-1].end = Date.now();
      sessions[sessions.length-1].interactions = interactionCount;
      sessions[sessions.length-1].skipRatio = skipRatio;
    }
    saveSessions();
  }

  function attach() { loadSessions(); }

  function getDims() {
    if (sessions.length === 0) return {
      burst_score: 0.5, browse_score: 0.5, session_gap_mean: 0.5, session_gap_var: 0.5,
      streak_length: 0, engagement_velocity: 0.5, skip_streak_recency: 0.5,
      session_len_mean: 0.5, session_len_var: 0.5, return_rate: 0.5,
      daily_session_density: 0.5, weekly_session_density: 0.5,
    };

    const gaps    = sessions.map(s=>s.gapMs).filter(Boolean);
    const lengths = sessions.map(s=>(s.end-s.start));
    const interactions = sessions.map(s=>s.interactions||0);
    const skipRatios   = sessions.map(s=>s.skipRatio||0);

    // Burst: many sessions with short gaps
    const shortGaps  = gaps.filter(g=>g<15*60*1000).length;
    const burstScore = cl(shortGaps / Math.max(gaps.length, 1));
    // Browse: long sessions with high interaction counts
    const browseScore = cl(mean(interactions) / 30);
    // Engagement velocity: is engagement trending up over last 5 sessions?
    const recent5 = interactions.slice(-5);
    const velScore = recent5.length >= 2
      ? cl(0.5 + (recent5[recent5.length-1] - recent5[0]) / 20)
      : 0.5;
    // Skip streak recency
    const lastHighSkip = skipRatios.map((r,i)=>({r,i})).filter(x=>x.r>0.5).slice(-1)[0];
    const skipStreakRecency = lastHighSkip
      ? cl(1 - (sessions.length - 1 - lastHighSkip.i) / MAX_SESSIONS)
      : 0;
    // Visit streak (consecutive days)
    const dayKeys = sessions.map(s => new Date(s.start).toDateString());
    const uniqueDays = [...new Set(dayKeys)];
    let streak = 1;
    for (let i = uniqueDays.length-1; i > 0; i--) {
      const d1 = new Date(uniqueDays[i]), d2 = new Date(uniqueDays[i-1]);
      if ((d1-d2) <= 86400000*1.5) streak++; else break;
    }
    // Daily/weekly density
    const now = Date.now();
    const dailyCount   = sessions.filter(s=>now-s.start<86400000).length;
    const weeklyCount  = sessions.filter(s=>now-s.start<86400000*7).length;

    return {
      burst_score:            burstScore,
      browse_score:           browseScore,
      session_gap_mean:       cl(mean(gaps.map(g=>g/3600000))),
      session_gap_var:        cl(vari(gaps.map(g=>g/3600000).slice(-20))*4),
      streak_length:          cl(streak / 30),
      engagement_velocity:    velScore,
      skip_streak_recency:    skipStreakRecency,
      session_len_mean:       cl(mean(lengths.map(l=>l/1800000))),
      session_len_var:        cl(vari(lengths.map(l=>l/1800000).slice(-20))*4),
      return_rate:            cl(sessions.length / MAX_SESSIONS),
      daily_session_density:  cl(dailyCount / 10),
      weekly_session_density: cl(weeklyCount / 30),
    };
  }

  return { attach, getDims, recordSessionStart, updateSessionEnd };
})();


// ─── EARLY ENGAGEMENT PREDICTOR ───────────────────────────────────────────────
// Reads the first 500ms of behavior after a new slide enters view to predict
// whether the user will engage or skip, feeding a per-item early-exit flag.
const EarlyEngagementPredictor = (() => {
  const windowMs  = 500;
  const history   = []; // { itemId, earlySignals[], groundTruth }

  let currentItem   = null;
  let startTime     = 0;
  let earlyClicks   = 0;
  let earlyScrollDy = 0;
  let earlyMouseMov = 0;
  let earlyTouches  = 0;
  let listening     = false;
  let resolveTimer  = null;

  function onClick()      { if (listening) earlyClicks++; }
  function onScroll()     { if (listening) earlyScrollDy += Math.abs(window.scrollY - (earlyScrollDy || window.scrollY)); }
  function onMouseMove(e) { if (listening) earlyMouseMov += Math.hypot(e.movementX||0, e.movementY||0); }
  function onTouchStart() { if (listening) earlyTouches++; }

  function attach() {
    window.addEventListener('click',      onClick,      { passive: true });
    window.addEventListener('scroll',     onScroll,     { passive: true });
    window.addEventListener('mousemove',  onMouseMove,  { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
  }

  function startObserving(itemId) {
    if (resolveTimer) { clearTimeout(resolveTimer); resolveTimer = null; }
    currentItem = itemId; startTime = Date.now();
    earlyClicks = 0; earlyScrollDy = 0; earlyMouseMov = 0; earlyTouches = 0;
    listening = true;
    resolveTimer = setTimeout(() => { listening = false; }, windowMs);
  }

  // Called when item result is known (engaged vs skipped)
  function recordOutcome(itemId, engaged) {
    const rec = history.find(h=>h.itemId===itemId);
    if (rec) { rec.groundTruth = engaged ? 1 : 0; }
    if (history.length > 200) history.shift();
  }

  function getEarlySignals() {
    return {
      clicks:   cl(earlyClicks / 3),
      scrollDy: cl(earlyScrollDy / 300),
      mouseMov: cl(earlyMouseMov / 500),
      touches:  cl(earlyTouches / 5),
    };
  }

  // Simple logistic regression over recent history
  function predictEngagement(signals) {
    const labeled = history.filter(h=>h.groundTruth !== undefined);
    if (labeled.length < 10) return 0.5;
    // Feature vector: [clicks, scrollDy, mouseMov, touches, 1]
    const feat = h => [h.earlySignals.clicks, h.earlySignals.scrollDy, h.earlySignals.mouseMov, h.earlySignals.touches, 1];
    // Quick correlation: dot product of signal with mean positive - mean negative
    const pos = labeled.filter(h=>h.groundTruth===1).map(feat);
    const neg = labeled.filter(h=>h.groundTruth===0).map(feat);
    if (!pos.length || !neg.length) return 0.5;
    const meanPos = [0,1,2,3,4].map(i=>mean(pos.map(f=>f[i])));
    const meanNeg = [0,1,2,3,4].map(i=>mean(neg.map(f=>f[i])));
    const sv      = [signals.clicks, signals.scrollDy, signals.mouseMov, signals.touches, 1];
    const scoreP  = dot(sv, meanPos), scoreN = dot(sv, meanNeg);
    return cl(scoreP / (scoreP + scoreN + 0.001));
  }

  function getDims() {
    return {
      early_predict_accuracy: cl(
        history.filter(h=>h.groundTruth!==undefined).reduce((acc,h,_,arr)=>{
          const p = predictEngagement(h.earlySignals);
          return acc + (Math.round(p)===h.groundTruth ? 1/arr.length : 0);
        }, 0)
      ),
      early_click_rate:  cl(mean(history.map(h=>h.earlySignals?.clicks||0))),
      early_scroll_rate: cl(mean(history.map(h=>h.earlySignals?.scrollDy||0))),
      early_mouse_rate:  cl(mean(history.map(h=>h.earlySignals?.mouseMov||0))),
    };
  }

  return { attach, startObserving, recordOutcome, getEarlySignals, predictEngagement, getDims };
})();


// ─── CONTENT AFFINITY TENSOR ──────────────────────────────────────────────────
// Builds per-keyword, per-price-tier, and per-condition preference tensors
// from explicit interactions, cross-referencing with dwell time signals.
const ContentAffinityTensor = (() => {
  // Keyword affinity: hashed keyword → running EMA score
  const kwAffinities  = {};
  // Price tier affinity: 8 buckets (log-scaled $0–$5000)
  const priceTiers    = new Array(8).fill(0.5);
  // Condition affinity
  const condAffinities = new Array(5).fill(0.5);
  // Category pair affinity (cross-category discovery tendency)
  const catCrossAffinity = new Array(32 * 32).fill(0.5);
  // Seller score preference
  const sellerPrefSamples = [];
  // Image count preference
  const imgCountPrefSamples = [];
  // Description length preference
  const descLenPrefSamples = [];
  // Price spread preference (do they like consistent prices or bargain hunting?)
  const priceSpreads = [];

  const KW_LR = 0.08;

  function kwHash(word) {
    return 'kw_' + (hash32(word.toLowerCase()) % 512);
  }

  function ingestItem(el, signal) {
    // Keywords from title
    const title  = (el.dataset.title || el.querySelector?.('[data-title]')?.textContent || '').toLowerCase();
    const words  = title.match(/\b\w{4,}\b/g) || [];
    words.forEach(w => {
      const k = kwHash(w);
      kwAffinities[k] = cl(lerp(kwAffinities[k] ?? 0.5, signal, KW_LR));
    });

    // Price tier
    const price    = parseFloat(el.dataset.price || 0);
    const tierIdx  = Math.min(Math.floor(Math.log1p(price) / Math.log1p(5000) * 8), 7);
    priceTiers[tierIdx] = cl(lerp(priceTiers[tierIdx], signal, 0.06));

    // Condition
    const condI = CFG.CONDITIONS.findIndex(c=>(el.dataset.condition||'').toLowerCase().includes(c));
    if (condI >= 0) condAffinities[condI] = cl(lerp(condAffinities[condI], signal, 0.06));

    // Seller score
    const sellerScore = parseFloat(el.dataset.sellerScore || 50) / 100;
    if (signal > 0.6) sellerPrefSamples.push(sellerScore);
    if (sellerPrefSamples.length > 40) sellerPrefSamples.shift();

    // Image count
    const imgCount = parseInt(el.dataset.imgCount || 0);
    if (signal > 0.6) imgCountPrefSamples.push(cl(imgCount / 8));
    if (imgCountPrefSamples.length > 40) imgCountPrefSamples.shift();

    // Description length
    const descLen = parseInt(el.dataset.descLen || 0);
    if (signal > 0.6) descLenPrefSamples.push(cl(descLen / 500));
    if (descLenPrefSamples.length > 40) descLenPrefSamples.shift();

    // Price spread (variance in engaged prices)
    if (signal > 0.55) {
      priceSpreads.push(priceNorm(price));
      if (priceSpreads.length > 40) priceSpreads.shift();
    }
  }

  function ingestCatCross(catA, catB, signal) {
    if (catA < 0 || catB < 0 || catA >= 32 || catB >= 32) return;
    const idx = catA * 32 + catB;
    catCrossAffinity[idx] = cl(lerp(catCrossAffinity[idx], signal, 0.05));
  }

  function getDims() {
    // Summarize keyword space into 16 aggregate dims via random projection
    const kwVals = Object.values(kwAffinities);
    const kwProjections = new Array(16).fill(0).map((_,i) => {
      const subset = kwVals.filter((_,j) => j % 16 === i);
      return cl(mean(subset.length ? subset : [0.5]));
    });
    // Cat cross affinity summary
    const catCrossEntropy = (() => {
      const total = Math.max(catCrossAffinity.reduce((a,b)=>a+b,0), 1);
      const probs = catCrossAffinity.map(v=>v/total);
      return cl(-probs.reduce((s,p)=>s+(p>1e-9?p*Math.log2(p+1e-9):0),0) / Math.log2(32*32));
    })();

    return {
      price_tier_0:       priceTiers[0],
      price_tier_1:       priceTiers[1],
      price_tier_2:       priceTiers[2],
      price_tier_3:       priceTiers[3],
      price_tier_4:       priceTiers[4],
      price_tier_5:       priceTiers[5],
      price_tier_6:       priceTiers[6],
      price_tier_7:       priceTiers[7],
      cond_new_affinity:  condAffinities[0],
      cond_open_affinity: condAffinities[1],
      cond_refurb_aff:    condAffinities[2],
      cond_used_affinity: condAffinities[3],
      cond_parts_affinity:condAffinities[4],
      seller_pref_mean:   cl(mean(sellerPrefSamples.length ? sellerPrefSamples : [0.5])),
      img_count_pref:     cl(mean(imgCountPrefSamples.length ? imgCountPrefSamples : [0.5])),
      desc_len_pref:      cl(mean(descLenPrefSamples.length ? descLenPrefSamples : [0.5])),
      price_spread_pref:  cl(vari(priceSpreads.length > 2 ? priceSpreads : [0.5,0.5]) * 4),
      cat_cross_entropy:  catCrossEntropy,
      kw_proj_0:          kwProjections[0],
      kw_proj_1:          kwProjections[1],
      kw_proj_2:          kwProjections[2],
      kw_proj_3:          kwProjections[3],
      kw_proj_4:          kwProjections[4],
      kw_proj_5:          kwProjections[5],
      kw_proj_6:          kwProjections[6],
      kw_proj_7:          kwProjections[7],
      kw_proj_8:          kwProjections[8],
      kw_proj_9:          kwProjections[9],
      kw_proj_10:         kwProjections[10],
      kw_proj_11:         kwProjections[11],
      kw_proj_12:         kwProjections[12],
      kw_proj_13:         kwProjections[13],
      kw_proj_14:         kwProjections[14],
      kw_proj_15:         kwProjections[15],
    };
  }

  return { ingestItem, ingestCatCross, getDims };
})();


// ─── ENVIRONMENTAL SIGNAL TRACKER ────────────────────────────────────────────
// Estimates ambient conditions: network jitter, thermal throttle (via rAF),
// memory pressure, ambient light (media query), and page visibility patterns.
const EnvironmentalTracker = (() => {
  const rafDeltas       = [];  // requestAnimationFrame intervals (ms)
  const networkJitters  = [];  // ping variance via fetch timing
  const memPressure     = [];  // performance.memory samples
  let darkModeChanges   = 0;
  let reducedMotionChanges = 0;
  let lastRafTime       = 0;
  let rafHandle         = null;
  let pingTimer         = null;
  let ambientLightScore = 0.5; // 0=dark, 1=bright (inferred from dark mode)
  const fpsHistory      = [];  // smoothed FPS samples
  const longTaskDurations = []; // PerformanceObserver long tasks

  function rafLoop(t) {
    if (lastRafTime > 0) {
      const dt = t - lastRafTime;
      rafDeltas.push(dt);
      if (rafDeltas.length > 120) rafDeltas.shift();
      // FPS
      const fps = 1000 / Math.max(dt, 1);
      fpsHistory.push(cl(fps / 120));
      if (fpsHistory.length > 60) fpsHistory.shift();
    }
    lastRafTime = t;
    rafHandle = requestAnimationFrame(rafLoop);
  }

  async function pingNetwork() {
    try {
      const t0 = performance.now();
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      const rtt = performance.now() - t0;
      networkJitters.push(cl(rtt / 2000));
      if (networkJitters.length > 20) networkJitters.shift();
    } catch {}
    pingTimer = setTimeout(pingNetwork, 15000);
  }

  function onDarkModeChange() { darkModeChanges++; ambientLightScore = window.matchMedia('(prefers-color-scheme: dark)').matches ? 0.2 : 0.8; }
  function onReducedMotionChange() { reducedMotionChanges++; }

  function observeLongTasks() {
    try {
      const po = new PerformanceObserver(list => {
        list.getEntries().forEach(e => {
          longTaskDurations.push(cl(e.duration / 1000));
          if (longTaskDurations.length > 30) longTaskDurations.shift();
        });
      });
      po.observe({ entryTypes: ['longtask'] });
    } catch {}
  }

  function sampleMemory() {
    try {
      if (performance.memory) {
        const used  = performance.memory.usedJSHeapSize;
        const total = performance.memory.jsHeapSizeLimit;
        memPressure.push(cl(used / total));
        if (memPressure.length > 20) memPressure.shift();
      }
    } catch {}
  }

  function attach() {
    rafHandle = requestAnimationFrame(rafLoop);
    pingNetwork();
    observeLongTasks();
    setInterval(sampleMemory, 10000);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onDarkModeChange);
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', onReducedMotionChange);
  }

  function getDims() {
    const rafMean  = cl(mean(rafDeltas.map(d=>d/16.67).slice(-60)));    // 60fps = 16.67ms baseline
    const rafVar   = cl(vari(rafDeltas.slice(-60).map(d=>d/16.67))*4);
    const fpsMean  = cl(mean(fpsHistory.length ? fpsHistory : [0.5]));
    const fpsVar   = cl(vari(fpsHistory.length > 2 ? fpsHistory : [0.5,0.5])*4);
    // Thermal throttle: high raf variance at low fps
    const thermalScore = cl(rafVar * (1 - fpsMean));
    const netJitterMean = cl(mean(networkJitters.length ? networkJitters : [0.5]));
    const netJitterVar  = cl(vari(networkJitters.length > 2 ? networkJitters : [0.5,0.5])*4);
    const memPressureMean = cl(mean(memPressure.length ? memPressure : [0.5]));
    const longTaskMean    = cl(mean(longTaskDurations.length ? longTaskDurations : [0]));

    return {
      raf_delta_mean:     rafMean,
      raf_delta_var:      rafVar,
      fps_mean:           fpsMean,
      fps_var:            fpsVar,
      thermal_score:      thermalScore,
      net_jitter_mean:    netJitterMean,
      net_jitter_var:     netJitterVar,
      mem_pressure_mean:  memPressureMean,
      dark_mode_changes:  cl(darkModeChanges / 5),
      reduced_motion_chg: cl(reducedMotionChanges / 3),
      ambient_light:      ambientLightScore,
      long_task_mean:     longTaskMean,
      long_task_count:    cl(longTaskDurations.length / 30),
    };
  }

  return { attach, getDims };
})();


// ─── TEMPORAL PREFERENCE MODEL ────────────────────────────────────────────────
// Enriches existing temporal dims with: payday cycle detection (end-of-month
// spending spike), holiday proximity affinity, month-of-year seasonality,
// and circadian engagement curve reconstruction.
const TemporalPreferenceModel = (() => {
  const hourlySig    = new Array(24).fill(0.5); // engagement signal by hour
  const dailySig     = new Array(7).fill(0.5);  // by day of week
  const monthlySig   = new Array(12).fill(0.5); // by month
  const domSig       = new Array(31).fill(0.5); // by day of month (payday detection)
  let initialized    = false;

  // US public holidays as [month(0-based), day] pairs
  const HOLIDAYS = [
    [0,1],[0,15],[1,19],[5,19],[7,4],[9,14],[11,11],[11,26],[11,25],
  ];

  function daysUntilHoliday() {
    const now = new Date();
    let minDays = Infinity;
    HOLIDAYS.forEach(([m,d]) => {
      const hDate = new Date(now.getFullYear(), m, d);
      if (hDate < now) hDate.setFullYear(now.getFullYear()+1);
      const diff = (hDate - now) / 86400000;
      if (diff < minDays) minDays = diff;
    });
    return cl(1 - Math.min(minDays, 30) / 30);
  }

  function attach() { initialized = true; }

  function recordSignal(signal) {
    const now = new Date();
    const h   = now.getHours(), dow = now.getDay(), m = now.getMonth(), dom = now.getDate() - 1;
    hourlySig[h]  = cl(lerp(hourlySig[h],  signal, 0.06));
    dailySig[dow]  = cl(lerp(dailySig[dow],  signal, 0.06));
    monthlySig[m]  = cl(lerp(monthlySig[m],  signal, 0.03));
    domSig[dom]    = cl(lerp(domSig[dom],    signal, 0.04));
  }

  function getPaydayCycleScore() {
    // Spikes around dom 1, 15, 30 indicate payday spending pattern
    const payDays = [0, 14, 29]; // 0-indexed
    const payDayMean = mean(payDays.map(d=>domSig[d]));
    const otherMean  = mean(domSig.filter((_,i)=>!payDays.includes(i)));
    return cl(0.5 + (payDayMean - otherMean) * 2);
  }

  function getCircadianPeakHour() {
    const peak = hourlySig.indexOf(Math.max(...hourlySig));
    return cl(peak / 23);
  }

  function getDims() {
    // Circadian curve: 4-bin compression (night/morning/afternoon/evening)
    const night   = mean(hourlySig.slice(22).concat(hourlySig.slice(0,6)));
    const morning = mean(hourlySig.slice(6, 12));
    const afternoon = mean(hourlySig.slice(12, 18));
    const evening = mean(hourlySig.slice(18, 22));
    const totalCirc = night + morning + afternoon + evening + 0.001;

    return {
      circadian_night:    cl(night / totalCirc),
      circadian_morning:  cl(morning / totalCirc),
      circadian_afternoon:cl(afternoon / totalCirc),
      circadian_evening:  cl(evening / totalCirc),
      circadian_peak_hour:getCircadianPeakHour(),
      payday_cycle_score: getPaydayCycleScore(),
      holiday_proximity:  daysUntilHoliday(),
      month_jan:  monthlySig[0],  month_feb: monthlySig[1],
      month_mar:  monthlySig[2],  month_apr: monthlySig[3],
      month_may:  monthlySig[4],  month_jun: monthlySig[5],
      month_jul:  monthlySig[6],  month_aug: monthlySig[7],
      month_sep:  monthlySig[8],  month_oct: monthlySig[9],
      month_nov:  monthlySig[10], month_dec: monthlySig[11],
      dom_early_month:  mean(domSig.slice(0,10)),
      dom_mid_month:    mean(domSig.slice(10,20)),
      dom_late_month:   mean(domSig.slice(20,31)),
    };
  }

  return { attach, recordSignal, getDims };
})();


// ─── ANTI-CHURN SIGNAL TRACKER ───────────────────────────────────────────────
// Tracks return-session depth, re-engagement after skip streaks, and
// loyalty indicators to weight content that brought users back.
const AntiChurnTracker = (() => {
  const STORAGE_KEY = 'nox_churn_log';
  const MAX_RECORDS = 100;

  let churnLog = [];
  let sessionStartInteractions = 0;
  let consecutiveSkipStreak    = 0;
  let maxSkipStreak            = 0;
  let postSkipEngagements      = 0;
  let returnDepthHistory       = [];
  let churnRiskHistory         = [];

  function load() {
    try { churnLog = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { churnLog=[]; }
    returnDepthHistory = churnLog.map(r=>r.returnDepth||0.5).slice(-30);
    churnRiskHistory   = churnLog.map(r=>r.churnRisk||0.5).slice(-30);
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(churnLog.slice(-MAX_RECORDS))); } catch {}
  }

  function attach() { load(); }

  function onSignal(signal) {
    if (signal < 0.25) {
      consecutiveSkipStreak++;
      if (consecutiveSkipStreak > maxSkipStreak) maxSkipStreak = consecutiveSkipStreak;
    } else {
      if (consecutiveSkipStreak > 3) postSkipEngagements++;
      consecutiveSkipStreak = 0;
    }
  }

  function recordSessionEnd(totalInteractions, totalLikes, totalSkips) {
    const returnDepth  = cl(totalInteractions / 30);
    const skipRatio    = cl(totalSkips / Math.max(totalInteractions,1));
    const likeRatio    = cl(totalLikes / Math.max(totalInteractions,1));
    const churnRisk    = cl(skipRatio * 0.6 + (1-likeRatio) * 0.4);
    returnDepthHistory.push(returnDepth);
    churnRiskHistory.push(churnRisk);
    if (returnDepthHistory.length > 30) returnDepthHistory.shift();
    if (churnRiskHistory.length > 30)   churnRiskHistory.shift();
    churnLog.push({ returnDepth, churnRisk, ts: Date.now(), maxSkipStreak, postSkipEngagements });
    if (churnLog.length > MAX_RECORDS) churnLog.shift();
    save();
  }

  function getDims() {
    const recentChurnMean = cl(mean(churnRiskHistory.slice(-5)));
    const churnTrend      = churnRiskHistory.length >= 4
      ? cl(0.5 + (churnRiskHistory[churnRiskHistory.length-1] - churnRiskHistory[0]) / 2)
      : 0.5;
    const returnDepthMean  = cl(mean(returnDepthHistory.length ? returnDepthHistory : [0.5]));
    const skipStreakSeverity = cl(maxSkipStreak / 20);
    const reEngagementRate   = postSkipEngagements > 0
      ? cl(postSkipEngagements / Math.max(maxSkipStreak, 1))
      : 0.5;

    return {
      churn_risk_mean:      recentChurnMean,
      churn_trend:          churnTrend,
      return_depth_mean:    returnDepthMean,
      skip_streak_severity: skipStreakSeverity,
      re_engagement_rate:   reEngagementRate,
      consecutive_skips:    cl(consecutiveSkipStreak / 10),
      loyalty_score:        cl(returnDepthMean * (1 - recentChurnMean)),
    };
  }

  return { attach, onSignal, recordSessionEnd, getDims };
})();


// ─── SOCIAL CONTEXT TRACKER ───────────────────────────────────────────────────
// Tracks referral chain signals, share→land patterns, viral entry detection,
// and estimated social proof sensitivity.
const SocialContextTracker = (() => {
  const STORAGE_KEY  = 'nox_social_log';
  let socialLog      = [];
  let viralEntries   = 0;
  let directEntries  = 0;
  let searchEntries  = 0;
  let shareEvents    = 0;

  // Known referral patterns
  const SOCIAL_REFS   = ['facebook','twitter','reddit','discord','tiktok','instagram','youtube','twitch','linkedin','t.co','x.com'];
  const SEARCH_REFS   = ['google','bing','duckduckgo','yahoo','baidu','search'];
  const VIRAL_PARAMS  = ['ref','source','utm_source','via','shared'];

  function classifyReferrer(ref) {
    if (!ref) return 'direct';
    const r = ref.toLowerCase();
    if (SOCIAL_REFS.some(s=>r.includes(s))) return 'social';
    if (SEARCH_REFS.some(s=>r.includes(s))) return 'search';
    return 'other';
  }

  function hasViralParam() {
    const params = new URLSearchParams(location.search);
    return VIRAL_PARAMS.some(p=>params.has(p));
  }

  function attach() {
    try { socialLog = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { socialLog=[]; }
    const refType = classifyReferrer(document.referrer);
    const isViral = hasViralParam();
    if (isViral || refType==='social') viralEntries++;
    else if (refType==='direct') directEntries++;
    else if (refType==='search') searchEntries++;

    socialLog.push({ refType, isViral, ts: Date.now() });
    if (socialLog.length > 100) socialLog.shift();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(socialLog)); } catch {}
  }

  function recordShare() { shareEvents++; }

  function getDims() {
    const total = Math.max(viralEntries + directEntries + searchEntries, 1);
    const viralRatio  = cl(viralEntries  / total);
    const directRatio = cl(directEntries / total);
    const searchRatio = cl(searchEntries / total);
    // Viral chain depth: how many sessions were viral in sequence?
    const recent20 = socialLog.slice(-20);
    let viralStreak = 0;
    for (let i = recent20.length-1; i >= 0; i--) {
      if (recent20[i].isViral || recent20[i].refType==='social') viralStreak++;
      else break;
    }
    const socialRecency = socialLog.length > 0
      ? cl(1 - (Date.now()-socialLog[socialLog.length-1].ts) / (7*86400000))
      : 0;

    return {
      viral_ratio:      viralRatio,
      direct_ratio:     directRatio,
      search_ratio:     searchRatio,
      viral_streak:     cl(viralStreak / 10),
      social_recency:   socialRecency,
      share_rate:       cl(shareEvents / 10),
      ref_entropy:      cl(-(viralRatio*Math.log2(viralRatio+1e-9)+directRatio*Math.log2(directRatio+1e-9)+searchRatio*Math.log2(searchRatio+1e-9)) / Math.log2(3)),
    };
  }

  return { attach, recordShare, getDims };
})();


// ─── PRICE SENSITIVITY MODEL ──────────────────────────────────────────────────
// Fits a per-user price sensitivity curve: do they prefer budget, mid-range,
// or premium? Tracks price anchoring, discount sensitivity, and spend velocity.
const PriceSensitivityModel = (() => {
  const engagedPrices  = []; // raw prices of engaged items
  const skippedPrices  = []; // raw prices of skipped items
  const priceSequences = []; // time-ordered engaged prices (spend velocity)
  let maxEngagedPrice  = 0;
  let totalEngaged     = 0;

  function attach() {}

  function recordInteraction(rawPrice, signal) {
    const p = parseFloat(rawPrice) || 0;
    if (signal > 0.55) {
      engagedPrices.push(p);
      if (p > maxEngagedPrice) maxEngagedPrice = p;
      priceSequences.push({ p, t: Date.now() });
      totalEngaged++;
    } else if (signal < 0.35) {
      skippedPrices.push(p);
    }
    if (engagedPrices.length > 60)  engagedPrices.shift();
    if (skippedPrices.length > 60)  skippedPrices.shift();
    if (priceSequences.length > 60) priceSequences.shift();
  }

  function getDims() {
    const engMean  = mean(engagedPrices.length ? engagedPrices : [0]);
    const engVar   = vari(engagedPrices.length > 2 ? engagedPrices : [0,0]);
    const skipMean = mean(skippedPrices.length ? skippedPrices : [0]);
    // Price sensitivity: how different are engaged vs skipped prices?
    const priceSensitivity = cl(Math.abs(engMean - skipMean) / (Math.max(engMean, skipMean, 1)));
    // Budget preference: engaged mean vs overall range
    const budgetPref = cl(1 - Math.log1p(engMean) / Math.log1p(5000));
    // Premium preference
    const premiumPref = cl(maxEngagedPrice > 0 ? Math.log1p(maxEngagedPrice) / Math.log1p(5000) : 0);
    // Spend velocity: average price per session
    const recentSeq = priceSequences.slice(-10);
    const spendVel  = cl(mean(recentSeq.map(r=>r.p)) / 500);
    // Price anchoring: std dev within session (do they anchor to a price level?)
    const sessionPrices = recentSeq.map(r=>r.p);
    const anchoringScore = cl(1 - vari(sessionPrices.length>2?sessionPrices:[0,0]) / (engMean**2+1));
    // Bargain hunting: skip expensive, engage cheap within same category
    const bargainScore = cl(skipMean > engMean ? (skipMean-engMean)/(skipMean+1) : 0);

    return {
      price_sensitivity:   priceSensitivity,
      budget_pref:         budgetPref,
      premium_pref:        premiumPref,
      engaged_price_mean:  cl(Math.log1p(engMean) / Math.log1p(5000)),
      engaged_price_var:   cl(Math.log1p(engVar+1) / Math.log1p(25000000)),
      spend_velocity:      spendVel,
      anchoring_score:     anchoringScore,
      bargain_score:       bargainScore,
    };
  }

  return { attach, recordInteraction, getDims };
})();


// ─── VIDEO-SPECIFIC ENGAGEMENT TRACKER ───────────────────────────────────────
// Since Clickz is a video feed, this tracks video-specific signals:
// autoplay-vs-click rate, replay events, mute/unmute patterns, fullscreen,
// scrub behavior, thumbnail hover-to-play latency, and subtitle usage.
const VideoEngagementTracker = (() => {
  const playLatencies    = [];  // ms from slide enter to first play
  const replayEvents     = [];  // { itemId, ts }
  const scrubEvents      = [];  // { itemId, scrubPct }
  const muteChanges      = [];  // timestamps
  const fullscreenEvents = [];
  let   autoPlayCount    = 0;
  let   clickPlayCount   = 0;
  let   thumbnailHoverTimes = [];
  let   subtitleOnCount  = 0;
  let   subtitleOffCount = 0;
  let   pauseCount       = 0;
  let   bufferEvents     = 0;
  let   videoErrors      = 0;
  const completionRates  = []; // fraction of video watched
  const qualityChanges   = []; // bitrate/quality switch events

  function attach() {
    // Attach to video elements dynamically added to the feed
    const observer = new MutationObserver(muts => {
      muts.forEach(m => {
        m.addedNodes.forEach(n => {
          if (!(n instanceof HTMLElement)) return;
          const vids = n.tagName === 'VIDEO' ? [n] : Array.from(n.querySelectorAll('video'));
          vids.forEach(attachToVideo);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('video').forEach(attachToVideo);
  }

  function attachToVideo(vid) {
    if (vid._noxTracked) return;
    vid._noxTracked = true;
    const slideEl = vid.closest?.('[data-id]');
    const itemId  = slideEl?.dataset?.id;
    let   watchedTime = 0, lastCurrentTime = 0, playStart = 0;

    vid.addEventListener('play', () => {
      playStart = Date.now();
      if (playStart - (vid._slideEnterTime||playStart) < 2000) autoPlayCount++;
      else clickPlayCount++;
    });

    vid.addEventListener('pause', () => { pauseCount++; });
    vid.addEventListener('error', () => { videoErrors++; });
    vid.addEventListener('waiting', () => { bufferEvents++; });

    vid.addEventListener('timeupdate', () => {
      if (vid.currentTime > lastCurrentTime) watchedTime += vid.currentTime - lastCurrentTime;
      lastCurrentTime = vid.currentTime;
    });

    vid.addEventListener('ended', () => {
      const duration = vid.duration || 1;
      completionRates.push(cl(watchedTime / duration));
      if (completionRates.length > 50) completionRates.shift();
    });

    vid.addEventListener('seeking', () => {
      scrubEvents.push({ itemId, scrubPct: cl(vid.currentTime / (vid.duration||1)) });
      if (scrubEvents.length > 50) scrubEvents.shift();
    });

    vid.addEventListener('volumechange', () => {
      muteChanges.push({ muted: vid.muted, ts: Date.now() });
      if (muteChanges.length > 30) muteChanges.shift();
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement === vid) fullscreenEvents.push(Date.now());
    });

    // Track text tracks (subtitles)
    Array.from(vid.textTracks).forEach(tt => {
      tt.addEventListener('cuechange', () => {
        if (tt.mode === 'showing') subtitleOnCount++;
        else subtitleOffCount++;
      });
    });
  }

  function recordSlideEnter(vid) {
    if (vid) vid._slideEnterTime = Date.now();
  }

  function getDims() {
    const avgCompletion   = cl(mean(completionRates.length ? completionRates : [0.5]));
    const completionVar   = cl(vari(completionRates.length > 2 ? completionRates : [0.5,0.5]) * 4);
    const autoPlayRatio   = cl(autoPlayCount / (autoPlayCount + clickPlayCount + 1));
    const replayRate      = cl(replayEvents.length / 30);
    const scrubRate       = cl(scrubEvents.length / 30);
    const muteRate        = cl(muteChanges.filter(m=>m.muted).length / (muteChanges.length||1));
    const fullscreenRate  = cl(fullscreenEvents.length / 10);
    const subtitlePref    = cl(subtitleOnCount / (subtitleOnCount + subtitleOffCount + 1));
    const pauseRate       = cl(pauseCount / 20);
    const bufferTolerance = cl(1 - bufferEvents / 10);
    const avgScrubPos     = cl(mean(scrubEvents.map(s=>s.scrubPct).slice(-20)));

    return {
      video_completion_mean: avgCompletion,
      video_completion_var:  completionVar,
      auto_play_ratio:       autoPlayRatio,
      replay_rate:           replayRate,
      scrub_rate:            scrubRate,
      scrub_pos_mean:        avgScrubPos,
      mute_rate:             muteRate,
      fullscreen_rate:       fullscreenRate,
      subtitle_pref:         subtitlePref,
      pause_rate:            pauseRate,
      buffer_tolerance:      bufferTolerance,
      video_error_rate:      cl(videoErrors / 5),
    };
  }

  return { attach, recordSlideEnter, getDims };
})();


// ─── INTERACTION SEQUENCER ────────────────────────────────────────────────────
// Models the n-gram sequence of user actions to detect patterns like
// "like → buy" or "skip → skip → engage" that predict future behavior.
const InteractionSequencer = (() => {
  const MAX_SEQ   = 100;
  const NGRAM_N   = 3;
  // Action encoding: 0=skip, 1=brief, 2=watch, 3=like, 4=save, 5=buy, 6=share
  const sequence  = [];
  const ngramCounts = {}; // "0,1,2" → count
  let   totalNgrams = 0;

  function encode(action) {
    return { skip:0, brief:1, watch:2, like:3, save:4, buy:5, share:6 }[action] ?? 2;
  }

  function push(action) {
    sequence.push(encode(action));
    if (sequence.length > MAX_SEQ) sequence.shift();
    if (sequence.length >= NGRAM_N) {
      const key = sequence.slice(-NGRAM_N).join(',');
      ngramCounts[key] = (ngramCounts[key]||0) + 1;
      totalNgrams++;
    }
  }

  function attach() {}

  // Predict next action given last N-1 actions
  function predictNext(lastActions) {
    const prefix = lastActions.map(encode).join(',');
    let bestScore = 0, bestAction = 2;
    for (let a = 0; a <= 6; a++) {
      const key   = prefix + ',' + a;
      const score = (ngramCounts[key]||0) / (totalNgrams||1);
      if (score > bestScore) { bestScore = score; bestAction = a; }
    }
    return { action: bestAction, confidence: cl(bestScore * 100) };
  }

  function getDims() {
    // Sequence statistics
    const skipRate    = cl(sequence.filter(a=>a===0).length / (sequence.length||1));
    const buyRate     = cl(sequence.filter(a=>a===5).length / (sequence.length||1));
    const likeRate    = cl(sequence.filter(a=>a===3).length / (sequence.length||1));
    const saveRate    = cl(sequence.filter(a=>a===4).length / (sequence.length||1));
    const shareRate   = cl(sequence.filter(a=>a===6).length / (sequence.length||1));
    // Streak of recent engagement (non-skip)
    let engStreak = 0;
    for (let i = sequence.length-1; i >= 0; i--) {
      if (sequence[i] > 0) engStreak++; else break;
    }
    // N-gram diversity (how many unique patterns?)
    const uniqueNgrams = Object.keys(ngramCounts).length;
    const ngramEntropy = (() => {
      const total = totalNgrams || 1;
      return cl(-Object.values(ngramCounts).reduce((s,c)=>{
        const p = c/total; return s + p*Math.log2(p+1e-9);
      },0) / Math.log2(Math.max(uniqueNgrams,2)));
    })();
    // Momentum: did last 5 interactions trend up?
    const last5 = sequence.slice(-5);
    const seqMomentum = last5.length >= 2
      ? cl(0.5 + (last5[last5.length-1] - last5[0]) / 6)
      : 0.5;

    return {
      seq_skip_rate:    skipRate,
      seq_buy_rate:     buyRate,
      seq_like_rate:    likeRate,
      seq_save_rate:    saveRate,
      seq_share_rate:   shareRate,
      seq_eng_streak:   cl(engStreak / 10),
      seq_ngram_entropy:ngramEntropy,
      seq_momentum:     seqMomentum,
      seq_length:       cl(sequence.length / MAX_SEQ),
      next_buy_prob:    predictNext(sequence.slice(-2).map(a=>Object.keys({skip:0,brief:1,watch:2,like:3,save:4,buy:5,share:6}).find(k=>({skip:0,brief:1,watch:2,like:3,save:4,buy:5,share:6})[k]===a)||'watch')).confidence,
    };
  }

  return { attach, push, predictNext, getDims };
})();


// ─── SEARCH & NAVIGATION INTENT TRACKER ──────────────────────────────────────
// Tracks in-page search queries (if any search input exists), filter usage,
// sort preference, and navigation patterns between categories.
const SearchIntentTracker = (() => {
  const searches       = [];  // { query hash, ts, results }
  const filterUsage    = {};  // filter key → use count
  const sortPrefs      = {};  // sort option → use count
  const categoryNavs   = [];  // category visited sequence
  let   searchCount    = 0;
  let   filterCount    = 0;
  let   sortCount      = 0;

  function attach() {
    // Observe search inputs
    document.querySelectorAll('input[type="search"], input[name*="search"], input[placeholder*="search" i]').forEach(attachToInput);
    const mo = new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (!(n instanceof HTMLElement)) return;
        n.querySelectorAll?.('input[type="search"], input[name*="search"]').forEach(attachToInput);
      }));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // Observe filter/sort changes
    document.addEventListener('change', onFormChange, { passive: true });
    // Track URL changes (SPA navigation)
    const origPushState = history.pushState.bind(history);
    history.pushState = (...args) => { origPushState(...args); onNavigation(); };
    window.addEventListener('popstate', onNavigation);
  }

  function attachToInput(el) {
    if (el._noxTracked) return;
    el._noxTracked = true;
    let debounceT = null;
    el.addEventListener('input', () => {
      clearTimeout(debounceT);
      debounceT = setTimeout(() => {
        if (!el.value || el.value.length < 2) return;
        searchCount++;
        searches.push({ q: hashNorm(el.value.toLowerCase()), ts: Date.now() });
        if (searches.length > 50) searches.shift();
      }, 600);
    });
  }

  function onFormChange(e) {
    const el = e.target;
    if (!el || !el.name) return;
    if (el.name.toLowerCase().includes('sort')) {
      sortPrefs[el.value] = (sortPrefs[el.value]||0) + 1;
      sortCount++;
    } else if (el.name.toLowerCase().includes('filter') || el.name.toLowerCase().includes('condition') || el.name.toLowerCase().includes('category')) {
      filterUsage[el.value] = (filterUsage[el.value]||0) + 1;
      filterCount++;
    }
  }

  function onNavigation() {
    const path = location.pathname;
    const catMatch = path.match(/\/(gpu|cpu|ram|ssd|case|psu|cooler|mobo|monitor|peripheral|kb|mouse|headset)/i);
    if (catMatch) {
      categoryNavs.push({ cat: catMatch[1].toLowerCase(), ts: Date.now() });
      if (categoryNavs.length > 30) categoryNavs.shift();
    }
  }

  function getDims() {
    const searchRate = cl(searchCount / 20);
    const filterRate = cl(filterCount / 10);
    const sortRate   = cl(sortCount / 10);
    // Most used sort option
    const sortEntries = Object.entries(sortPrefs);
    const topSort     = sortEntries.sort((a,b)=>b[1]-a[1])[0];
    const priceSort   = (topSort && topSort[0].includes('price')) ? 1 : 0;
    const newSort     = (topSort && topSort[0].includes('new')) ? 1 : 0;
    // Category navigation breadth
    const uniqueCats  = new Set(categoryNavs.map(n=>n.cat)).size;
    const catBreadth  = cl(uniqueCats / CFG.CATS.length);
    // Search recency
    const searchRecency = searches.length > 0
      ? cl(1 - (Date.now()-searches[searches.length-1].ts) / 3600000)
      : 0;
    // Filter diversity
    const filterEntropy = (() => {
      const vals = Object.values(filterUsage);
      const total = Math.max(vals.reduce((a,b)=>a+b,0), 1);
      const probs = vals.map(v=>v/total);
      return cl(-probs.reduce((s,p)=>s+(p>0?p*Math.log2(p+1e-9):0),0)/Math.log2(Math.max(vals.length,2)));
    })();

    return {
      search_rate:       searchRate,
      filter_rate:       filterRate,
      sort_rate:         sortRate,
      price_sort_pref:   priceSort,
      new_sort_pref:     newSort,
      cat_breadth:       catBreadth,
      search_recency:    searchRecency,
      filter_entropy:    filterEntropy,
      cat_nav_count:     cl(categoryNavs.length / 30),
    };
  }

  return { attach, getDims };
})();


// ─── NETWORK QUALITY & RETRY TRACKER ─────────────────────────────────────────
// Tracks failed fetches, retry patterns, and slow-load correlations with
// engagement drops to weight content recommendations by network tolerance.
const NetworkQualityTracker = (() => {
  let failedFetches    = 0;
  let successFetches   = 0;
  let slowLoads        = 0; // > 3s
  let retries          = 0;
  const loadTimes      = [];
  const failureWindows = []; // { ts, type }
  let   originalFetch  = null;

  function attach() {
    originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const t0 = Date.now();
      try {
        const res = await originalFetch.apply(this, args);
        const dt  = Date.now() - t0;
        loadTimes.push(cl(dt / 10000));
        if (loadTimes.length > 50) loadTimes.shift();
        if (dt > 3000) slowLoads++;
        successFetches++;
        return res;
      } catch(err) {
        failedFetches++;
        failureWindows.push({ ts: Date.now(), type: err.name });
        if (failureWindows.length > 20) failureWindows.shift();
        throw err;
      }
    };
  }

  function getDims() {
    const successRate = cl(successFetches / (successFetches + failedFetches + 1));
    const slowRate    = cl(slowLoads / (successFetches + 1));
    const loadMean    = cl(mean(loadTimes.length ? loadTimes : [0.5]));
    const loadVar     = cl(vari(loadTimes.length > 2 ? loadTimes : [0.5,0.5]) * 4);
    // Failure burst: many failures in short window
    const recentFails = failureWindows.filter(f=>Date.now()-f.ts < 60000).length;
    const failBurst   = cl(recentFails / 5);

    return {
      fetch_success_rate: successRate,
      fetch_slow_rate:    slowRate,
      fetch_load_mean:    loadMean,
      fetch_load_var:     loadVar,
      fail_burst:         failBurst,
      retry_rate:         cl(retries / 10),
      total_fetches:      cl(Math.log1p(successFetches + failedFetches) / Math.log1p(1000)),
    };
  }

  return { attach, getDims };
})();


// ─── PERIPHERAL & HARDWARE PROFILE ENRICHER ──────────────────────────────────
// Goes deeper on hardware signals: gamepad detection, WebMIDI presence,
// USB device hints, print media detection, XR/VR headset hints, speech API.
const HardwareEnricher = (() => {
  let hasGamepad     = false;
  let hasXR          = false;
  let hasMIDI        = false;
  let hasSpeech      = false;
  let hasBluetooth   = false;
  let hasUSB         = false;
  let hasPrint       = false;
  let hasNotifPerm   = 0.5;
  let hasShareAPI    = false;
  let hasContactsPicker = false;
  let hasFileSystem  = false;
  let hasWakeLock    = false;
  let hasBarcode     = false;
  let hasEyeDropper  = false;
  let hasWebRTC      = false;
  let hasWebCodecs   = false;
  let logicalCores   = 0;
  let deviceMemGB    = 0;
  let screenGamut    = 0.5;
  let colorGamut     = 0.5;

  async function attach() {
    hasGamepad     = 'getGamepads' in navigator;
    hasXR          = 'xr' in navigator;
    hasMIDI        = 'requestMIDIAccess' in navigator;
    hasSpeech      = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    hasBluetooth   = 'bluetooth' in navigator;
    hasUSB         = 'usb' in navigator;
    hasShareAPI    = 'share' in navigator;
    hasContactsPicker = 'contacts' in navigator;
    hasFileSystem  = 'showOpenFilePicker' in window;
    hasWakeLock    = 'wakeLock' in navigator;
    hasBarcode     = 'BarcodeDetector' in window;
    hasEyeDropper  = 'EyeDropper' in window;
    hasWebRTC      = 'RTCPeerConnection' in window;
    hasWebCodecs   = 'VideoEncoder' in window;
    logicalCores   = navigator.hardwareConcurrency || 0;
    deviceMemGB    = navigator.deviceMemory || 0;
    hasPrint       = window.matchMedia('print').matches;
    screenGamut    = window.matchMedia('(color-gamut: p3)').matches ? 0.8
      : window.matchMedia('(color-gamut: rec2020)').matches ? 1.0 : 0.5;
    colorGamut     = window.matchMedia('(color-gamut: srgb)').matches ? 0.3 : screenGamut;
    try {
      const perm = await navigator.permissions?.query({ name:'notifications' });
      hasNotifPerm = perm?.state === 'granted' ? 1 : perm?.state === 'denied' ? 0 : 0.5;
    } catch {}

    // Gamepad connection
    window.addEventListener('gamepadconnected', () => { hasGamepad = true; });
  }

  function getDims() {
    return {
      has_gamepad:     hasGamepad ? 1 : 0,
      has_xr:          hasXR      ? 1 : 0,
      has_midi:        hasMIDI    ? 1 : 0,
      has_speech:      hasSpeech  ? 1 : 0,
      has_bluetooth:   hasBluetooth ? 1 : 0,
      has_usb:         hasUSB     ? 1 : 0,
      has_share_api:   hasShareAPI ? 1 : 0,
      has_contacts:    hasContactsPicker ? 1 : 0,
      has_filesystem:  hasFileSystem ? 1 : 0,
      has_wakelock:    hasWakeLock ? 1 : 0,
      has_barcode:     hasBarcode  ? 1 : 0,
      has_eye_dropper: hasEyeDropper ? 1 : 0,
      has_webrtc:      hasWebRTC   ? 1 : 0,
      has_webcodecs:   hasWebCodecs ? 1 : 0,
      logical_cores:   cl(logicalCores / 32),
      device_mem_gb:   cl(deviceMemGB / 32),
      screen_gamut:    screenGamut,
      color_gamut:     colorGamut,
      notif_perm:      hasNotifPerm,
    };
  }

  return { attach, getDims };
})();


// ─── VIEWPORT & DISPLAY BEHAVIOR ─────────────────────────────────────────────
// Tracks window resize patterns, PiP usage, DevTools detection (width jitter),
// multi-monitor hints, and zoom level estimation.
const ViewportBehaviorTracker = (() => {
  const resizeHistory   = [];
  let   devToolsOpen    = false;
  let   devToolsChanges = 0;
  let   pipActive       = false;
  let   pipCount        = 0;
  let   zoomEstimates   = [];
  let   prevWidth       = window.innerWidth;
  let   multiMonitor    = false;
  const aspectRatioHistory = [];

  function estimateZoom() {
    // window.devicePixelRatio changes with zoom in some browsers
    return cl(window.devicePixelRatio / 3);
  }

  function checkDevTools() {
    // Common detection: threshold on inner vs outer window size
    const threshold = 160;
    const widthDiff  = window.outerWidth  - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const open = widthDiff > threshold || heightDiff > threshold;
    if (open !== devToolsOpen) { devToolsChanges++; devToolsOpen = open; }
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    resizeHistory.push({ w, h, t: Date.now() });
    if (resizeHistory.length > 40) resizeHistory.shift();
    // Multi-monitor hint: very wide resize events
    if (w > 2560) multiMonitor = true;
    // Aspect ratio
    aspectRatioHistory.push(cl(w / Math.max(h, 1) / 3));
    if (aspectRatioHistory.length > 20) aspectRatioHistory.shift();
    // Zoom
    zoomEstimates.push(estimateZoom());
    if (zoomEstimates.length > 20) zoomEstimates.shift();
    prevWidth = w;
    checkDevTools();
  }

  function attach() {
    window.addEventListener('resize', onResize, { passive: true });
    // PiP detection
    document.addEventListener('enterpictureinpicture', () => { pipActive=true; pipCount++; });
    document.addEventListener('leavepictureinpicture', () => { pipActive=false; });
    // Initial checks
    zoomEstimates.push(estimateZoom());
    aspectRatioHistory.push(cl(window.innerWidth / Math.max(window.innerHeight,1) / 3));
    checkDevTools();
  }

  function getDims() {
    const resizeFreq = cl(resizeHistory.length / 40);
    const resizeVar  = (() => {
      const widths = resizeHistory.map(r=>r.w/window.screen.width);
      return cl(vari(widths.length>2?widths:[0.5,0.5])*4);
    })();
    const aspectMean  = cl(mean(aspectRatioHistory.length ? aspectRatioHistory : [0.5]));
    const zoomMean    = cl(mean(zoomEstimates.length ? zoomEstimates : [0.5]));

    return {
      resize_freq:       resizeFreq,
      resize_var:        resizeVar,
      devtools_open:     devToolsOpen ? 1 : 0,
      devtools_changes:  cl(devToolsChanges / 5),
      pip_rate:          cl(pipCount / 5),
      pip_active:        pipActive ? 1 : 0,
      zoom_mean:         zoomMean,
      aspect_ratio_mean: aspectMean,
      multi_monitor:     multiMonitor ? 1 : 0,
    };
  }

  return { attach, getDims };
})();


// ─── CLIPBOARD & SHARE INTENT TRACKER ────────────────────────────────────────
// Goes deeper on clipboard: what types of content are copied, paste frequency,
// URL vs text copy patterns, and share API usage.
const ClipboardShareTracker = (() => {
  let   urlCopies   = 0;
  let   textCopies  = 0;
  let   imageCopies = 0;
  let   pasteCount  = 0;
  let   shareCount  = 0;
  let   shareSuccess = 0;
  const copyIntervals = [];
  let   lastCopyTime  = 0;

  function attach() {
    document.addEventListener('copy', async () => {
      const t = Date.now();
      if (lastCopyTime) {
        copyIntervals.push(cl((t-lastCopyTime)/60000));
        if (copyIntervals.length > 20) copyIntervals.shift();
      }
      lastCopyTime = t;
      try {
        const text = window.getSelection()?.toString() || '';
        if (text.startsWith('http')) urlCopies++;
        else if (text.length > 0) textCopies++;
        else imageCopies++;
      } catch { textCopies++; }
    });
    document.addEventListener('paste', () => { pasteCount++; });

    // Intercept share button clicks
    document.addEventListener('click', e => {
      if (e.target?.closest?.('[data-action="share"]')) {
        shareCount++;
        if (navigator.share) {
          navigator.share({}).then(()=>shareSuccess++).catch(()=>{});
        }
      }
    });
  }

  function getDims() {
    const totalCopies = urlCopies + textCopies + imageCopies;
    return {
      url_copy_ratio:    cl(urlCopies  / (totalCopies||1)),
      text_copy_ratio:   cl(textCopies / (totalCopies||1)),
      image_copy_ratio:  cl(imageCopies / (totalCopies||1)),
      paste_rate:        cl(pasteCount / 10),
      share_rate:        cl(shareCount / 5),
      share_success_rate:cl(shareSuccess / (shareCount||1)),
      copy_interval_mean:cl(mean(copyIntervals.length ? copyIntervals : [0.5])),
      copy_interval_var: cl(vari(copyIntervals.length>2?copyIntervals:[0.5,0.5])*4),
    };
  }

  return { attach, getDims };
})();


// ─── COGNITIVE LOAD ESTIMATOR ─────────────────────────────────────────────────
// Estimates cognitive load from: decision time per item, hesitation patterns,
// back-navigation frequency, filter toggle frequency, and dwell variance.
// High cognitive load → simplify recommendations (fewer categories, lower price variance)
const CognitiveLoadEstimator = (() => {
  const decisionTimes  = [];  // ms from slide enter to first action
  const hesitationGaps = [];  // pauses between hover and action
  let   backNavCount   = 0;
  let   filterToggleCount = 0;
  let   itemEnterTime  = 0;
  const revisitRatios  = [];  // how often seen items re-appear in top results

  function attach() {
    // Back navigation via popstate
    window.addEventListener('popstate', () => { backNavCount++; });
    // Filter toggles
    document.addEventListener('change', e => {
      if (e.target?.name?.toLowerCase().includes('filter')) filterToggleCount++;
    });
  }

  function onItemEnter(id) { itemEnterTime = Date.now(); }

  function onItemAction(id) {
    if (itemEnterTime) {
      const dt = Date.now() - itemEnterTime;
      if (dt > 100 && dt < 30000) {
        decisionTimes.push(cl(Math.log1p(dt) / Math.log1p(30000)));
        if (decisionTimes.length > 40) decisionTimes.shift();
      }
      itemEnterTime = 0;
    }
  }

  function recordHesitation(ms) {
    if (ms > 200 && ms < 15000) {
      hesitationGaps.push(cl(Math.log1p(ms) / Math.log1p(15000)));
      if (hesitationGaps.length > 30) hesitationGaps.shift();
    }
  }

  function getDims() {
    const decisionMean  = cl(mean(decisionTimes.length ? decisionTimes : [0.5]));
    const decisionVar   = cl(vari(decisionTimes.length>2?decisionTimes:[0.5,0.5])*4);
    const hesitationMean = cl(mean(hesitationGaps.length ? hesitationGaps : [0.5]));
    const backNavRate   = cl(backNavCount / 10);
    const filterTogRate = cl(filterToggleCount / 10);
    // Composite cognitive load score (high = overwhelmed)
    const loadScore = cl(decisionMean * 0.3 + decisionVar * 0.2 + hesitationMean * 0.3 + backNavRate * 0.1 + filterTogRate * 0.1);

    return {
      decision_time_mean:  decisionMean,
      decision_time_var:   decisionVar,
      hesitation_mean:     hesitationMean,
      back_nav_rate:       backNavRate,
      filter_toggle_rate:  filterTogRate,
      cognitive_load:      loadScore,
      cog_load_inverse:    cl(1 - loadScore),
    };
  }

  return { attach, onItemEnter, onItemAction, recordHesitation, getDims };
})();


// ─── EXTENDED ITEM VECTOR ENRICHER ───────────────────────────────────────────
// Adds more item-level dimensions extracted from data attributes, used
// to populate the currently-empty upper dims of item vectors.
function itemVecExtended(el, baseVec) {
  const v = [...baseVec];

  // Seller tier (0=unverified, 1=verified, 2=top-rated)
  const sellerTier   = parseInt(el.dataset.sellerTier  || '0');
  v[24] = cl(sellerTier / 2);

  // Return policy (0=none, 1=14d, 2=30d, 3=60d+)
  const returnPolicy = parseInt(el.dataset.returnPolicy || '0');
  v[25] = cl(returnPolicy / 3);

  // Shipping speed (0=economy, 1=standard, 2=express, 3=same-day)
  const shippingSpeed = parseInt(el.dataset.shippingSpeed || '1');
  v[26] = cl(shippingSpeed / 3);

  // Brand affinity (hash of brand name → 0–1)
  v[27] = hashNorm(el.dataset.brand || '');

  // Age of listing in hours (fresh vs stale)
  const listedHoursAgo = (Date.now() - parseInt(el.dataset.ts||Date.now())) / 3600000;
  v[28] = cl(1 - Math.log1p(listedHoursAgo) / Math.log1p(8760)); // log decay over 1yr

  // Number of watchers (social validation signal)
  v[29] = cl(parseInt(el.dataset.watchers||'0') / 100);

  // Has video (Clickz: whether listing has attached video)
  v[30] = el.dataset.hasVideo === 'true' ? 1 : 0;

  // Has 3D model / AR view
  v[31] = el.dataset.has3d === 'true' ? 1 : 0;

  // Discount percentage (0–100%)
  const discountPct = parseFloat(el.dataset.discountPct || '0');
  v[160 + 4] = cl(discountPct / 100); // v[164]

  // Original price (MSRP) vs asking (deal detection)
  const msrp    = parseFloat(el.dataset.msrp   || el.dataset.price || '0');
  const asking  = parseFloat(el.dataset.price  || '0');
  v[165] = msrp > 0 ? cl(1 - asking / msrp) : 0.5; // deal score

  // Category depth (is it a niche sub-category?)
  const catDepth = parseInt(el.dataset.catDepth || '1');
  v[166] = cl(catDepth / 4);

  // Quantity available (scarcity signal)
  const qty = parseInt(el.dataset.qty || '999');
  v[167] = cl(1 - Math.min(qty, 100) / 100); // higher = scarcer

  // Verified authenticity (cert/COA)
  v[168] = el.dataset.verified === 'true' ? 1 : 0;

  // Bundle indicator
  v[169] = el.dataset.isBundle === 'true' ? 1 : 0;

  // Estimated specs match score (if data-spec-score set by server)
  v[170] = cl(parseFloat(el.dataset.specScore || '0.5'));

  // Seller country hash
  v[171] = hashNorm(el.dataset.sellerCountry || 'us');

  // Sub-category hash
  v[172] = hashNorm(el.dataset.subCategory || '');

  // Has warranty
  v[173] = el.dataset.hasWarranty === 'true' ? 1 : 0;

  // Listing engagement ratio (server-side CTR of this listing)
  v[174] = cl(parseFloat(el.dataset.ctr || '0.5'));

  // Part compatibility score (0–1, computed server-side)
  v[175] = cl(parseFloat(el.dataset.compatScore || '0.5'));

  return v;
}


// ─── EXTENDED SCORING DIMENSIONS ─────────────────────────────────────────────
// Additional scoring terms that reference the new tracker dimensions.
// These are ADDITIVE to the base score function.
function extendedScore(id, iv, profile, w) {
  let s = 0;

  // ── Video-specific signals ────────────────────────────────────────────────
  const vidDims = VideoEngagementTracker.getDims();
  // Boost video items if user is a high-completion viewer
  if (iv[30] > 0.5 && vidDims.video_completion_mean > 0.65) s += 0.02;
  // Suppress muted-preference items for users who unmute a lot
  if (iv[30] > 0.5 && vidDims.mute_rate < 0.3) s += 0.01;
  // Boost fullscreen-capable items for fullscreen users
  if (vidDims.fullscreen_rate > 0.5) s += 0.015;
  // Replay users prefer novel, high-quality content
  if (vidDims.replay_rate > 0.3 && iv[13] > 0.7) s += 0.02;

  // ── Price sensitivity ─────────────────────────────────────────────────────
  const priceDims = PriceSensitivityModel.getDims();
  // Bargain hunter: boost items where deal_score > 0.3
  if (priceDims.bargain_score > 0.5 && iv[165] > 0.3) s += 0.025;
  // Premium user: boost expensive/high-quality items
  if (priceDims.premium_pref > 0.7 && iv[0] > 0.6) s += 0.02;
  // Budget user: suppress expensive items
  if (priceDims.budget_pref > 0.7 && iv[0] > 0.5) s -= 0.015;
  // Price anchoring: prefer items near user's established price centroid
  const engMean = priceDims.engaged_price_mean;
  s -= Math.abs(iv[0] - engMean) * priceDims.anchoring_score * 0.03;

  // ── Content affinity tensor ────────────────────────────────────────────────
  const affDims = ContentAffinityTensor.getDims();
  // Price tier match
  const tierIdx = Math.min(Math.floor(iv[0] * 8), 7);
  s += (affDims[`price_tier_${tierIdx}`] - 0.5) * 0.02;
  // Condition affinity
  const condI = Math.round(iv[14] * (CFG.CONDITIONS.length-1));
  const condKey = `cond_${['new','open','refurb','used','parts'][condI]}_affinity`;
  if (affDims[condKey] !== undefined) s += (affDims[condKey] - 0.5) * 0.015;
  // Seller score preference
  if (iv[4] > 0 && affDims.seller_pref_mean > 0.6 && iv[4] > affDims.seller_pref_mean - 0.1) s += 0.01;
  // Image count preference
  if (affDims.img_count_pref > 0.6 && iv[13] > 0.6) s += 0.01;
  // Deal score for bargain-affinity users
  if (affDims.price_spread_pref > 0.5 && iv[165] > 0.4) s += 0.015;
  // Scarcity boost for high-engagement users
  if (iv[167] > 0.7 && profile.buy_count > 2) s += 0.02;
  // Bundle preference
  if (iv[169] > 0.5 && profile.buy_count > 3) s += 0.01;
  // Discount sensitivity
  if (iv[164] > 0.2 && priceDims.bargain_score > 0.4) s += iv[164] * 0.02;
  // Verified seller boost (trust signal)
  s += iv[168] * 0.01;
  // Warranty preference
  if (iv[173] > 0.5 && profile.uv[28] > 0.5) s += 0.01;
  // Compatibility boost
  s += (iv[175] - 0.5) * 0.015;
  // Listing CTR boost (proven engagement)
  s += (iv[174] - 0.5) * 0.02;

  // ── Micro-gesture signals ─────────────────────────────────────────────────
  const microDims = MicroGestureTracker.getDims();
  // Precise clickers prefer compact, high-info listings
  if (microDims.click_precision_mean > 0.7 && iv[13] > 0.6) s += 0.01;
  // Hesitant users (high hover duration) → boost familiar categories
  if (microDims.hover_dur_mean > 0.5) {
    const familiarity = profile.cat_history?.filter(c=>c===iv[1]).length / Math.max(profile.cat_history?.length,1);
    s += cl(familiarity) * 0.015;
  }
  // Tremor-heavy users → deprioritize low-res thumbnail items
  if (microDims.tremor_mean > 0.5 && iv[30] < 0.5) s -= 0.005;

  // ── Reading behavior ──────────────────────────────────────────────────────
  const readDims = ReadingBehaviorTracker.getDims();
  // Deep readers prefer longer descriptions
  if (readDims.scan_ratio < 0.3 && iv[13] > 0.5) s += 0.015;
  // Scanners prefer visual/image-heavy listings
  if (readDims.scan_ratio > 0.6 && iv[30] > 0.5) s += 0.01;
  // High scroll depth users → boost content further down in listing
  if (readDims.scroll_depth_ratio > 0.7 && iv[25] > 0.5) s += 0.01;

  // ── Attention heatmap ─────────────────────────────────────────────────────
  const attnDims = AttentionHeatmapTracker.getDims();
  // Above-fold obsessives → boost eye-catching listings (high likes/views)
  if (attnDims.above_fold_obsession > 0.7 && iv[3] > 0.6) s += 0.01;
  // Explorers (low above-fold, high entropy) → boost novelty
  if (attnDims.zone_entropy > 0.7 && (profile.seen[id]||0) === 0) s += 0.015;

  // ── Session rhythm ─────────────────────────────────────────────────────────
  const sessionDims = SessionRhythmTracker.getDims();
  // Burst users → boost trending/time-sensitive (fresh) items
  if (sessionDims.burst_score > 0.6 && iv[2] > 0.7) s += 0.015;
  // Browse users → boost information-rich listings
  if (sessionDims.browse_score > 0.6 && iv[13] > 0.6) s += 0.01;
  // Streak users → reward loyalty with personalized boosts
  if (sessionDims.streak_length > 0.3) s += sessionDims.streak_length * 0.02;
  // High engagement velocity → ride the wave, boost items from momentum categories
  if (sessionDims.engagement_velocity > 0.6) {
    const topCat = profile.cat_history?.slice(-3);
    if (topCat?.includes(String(iv[1]))) s += 0.015;
  }

  // ── Social context ─────────────────────────────────────────────────────────
  const socialDims = SocialContextTracker.getDims();
  // Viral users → boost trending, high-social-proof items
  if (socialDims.viral_ratio > 0.5 && iv[3] > 0.6) s += 0.02;
  // Search-driven users → boost exact-match, high-relevance items
  if (socialDims.search_ratio > 0.5 && iv[13] > 0.6) s += 0.01;
  // Direct users → more exploratory, boost novelty
  if (socialDims.direct_ratio > 0.7 && (profile.seen[id]||0)===0) s += 0.01;

  // ── Anti-churn signals ────────────────────────────────────────────────────
  const churnDims = AntiChurnTracker.getDims();
  // High churn risk → serve highest-quality, lowest-friction content
  if (churnDims.churn_risk_mean > 0.6) {
    s += (iv[13] - 0.5) * 0.04;   // boost quality
    s -= (iv[0] - 0.5) * 0.02;    // slightly suppress very expensive items
  }
  // Post-skip-streak re-engagement → serve familiar comfort-zone items
  if (churnDims.skip_streak_severity > 0.5 && churnDims.re_engagement_rate > 0.3) {
    const catFamiliarity = profile.cat_history?.filter(c=>c===String(iv[1])).length || 0;
    s += cl(catFamiliarity / 10) * 0.025;
  }
  // Loyal users → reward with personalized premium
  if (churnDims.loyalty_score > 0.7) s += 0.02;

  // ── Temporal preference ────────────────────────────────────────────────────
  const tempDims = TemporalPreferenceModel.getDims();
  // Payday cycle boost: if near payday, boost premium items
  if (tempDims.payday_cycle_score > 0.6 && iv[0] > 0.5) s += 0.02;
  // Holiday proximity → boost gift-able, high-social-proof items
  if (tempDims.holiday_proximity > 0.7 && iv[3] > 0.5) s += 0.015;
  // Month affinity
  const monthKey = `month_${['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][new Date().getMonth()]}`;
  s += (tempDims[monthKey] - 0.5) * 0.01;

  // ── Cognitive load ────────────────────────────────────────────────────────
  const cogDims = CognitiveLoadEstimator.getDims();
  // High cognitive load → reduce category diversity in recommendations
  if (cogDims.cognitive_load > 0.6) {
    const catI = Math.round(iv[1] * CFG.CATS.length) - 1;
    const isTopCat = profile.cat_history?.slice(-5).includes(String(catI));
    if (!isTopCat) s -= 0.02; // suppress unfamiliar categories when overwhelmed
  }
  // Low cognitive load → explore freely
  if (cogDims.cog_load_inverse > 0.7 && (profile.seen[id]||0)===0) s += 0.01;

  // ── Interaction sequence ───────────────────────────────────────────────────
  const seqDims = InteractionSequencer.getDims();
  // High buy-rate sequence → boost purchasable items (condition: new/open-box)
  if (seqDims.seq_buy_rate > 0.3 && iv[14] < 0.3) s += 0.02; // new/open
  // Save-heavy user → boost wishlisted categories
  if (seqDims.seq_save_rate > 0.3 && iv[4] > 0.5) s += 0.015;
  // Momentum streak → keep serving same vibe
  if (seqDims.seq_momentum > 0.6 && seqDims.seq_eng_streak > 0.4) s += 0.015;

  // ── Environmental adaptation ───────────────────────────────────────────────
  const envDims = EnvironmentalTracker.getDims();
  // Throttled device → suppress video items (high completion requirement)
  if (envDims.thermal_score > 0.6 && iv[30] > 0.5) s -= 0.02;
  // High memory pressure → prefer lighter listings (fewer images)
  if (envDims.mem_pressure_mean > 0.7 && iv[13] > 0.8) s -= 0.01; // high img count = heavier
  // Slow network → prefer listings that load fast (fewer images, no video)
  if (envDims.net_jitter_mean > 0.6) {
    if (iv[30] > 0.5) s -= 0.02; // video
  }

  // ── Hardware profile ───────────────────────────────────────────────────────
  const hwDims = HardwareEnricher.getDims();
  // Gamers (has gamepad) → boost gaming peripherals
  if (hwDims.has_gamepad > 0.5) {
    const catSlug = CFG.CATS[Math.round(iv[1]*CFG.CATS.length)-1];
    if (['gpu','kb','mouse','headset','controller','monitor'].includes(catSlug)) s += 0.025;
  }
  // XR users → boost VR content
  if (hwDims.has_xr > 0.5) {
    const catSlug = CFG.CATS[Math.round(iv[1]*CFG.CATS.length)-1];
    if (catSlug === 'vr') s += 0.04;
  }
  // High-color-gamut display → boost monitor recommendations
  if (hwDims.screen_gamut > 0.7) {
    const catSlug = CFG.CATS[Math.round(iv[1]*CFG.CATS.length)-1];
    if (catSlug === 'monitor' || catSlug === 'display') s += 0.02;
  }
  // Premium device (high device memory) → boost premium items
  if (hwDims.device_mem_gb > 0.75 && iv[0] > 0.5) s += 0.01;

  // ── Viewport behavior ──────────────────────────────────────────────────────
  const vportDims = ViewportBehaviorTracker.getDims();
  // DevTools open → developer user, boost CPU/mobo/networking
  if (vportDims.devtools_open > 0.5) {
    const catSlug = CFG.CATS[Math.round(iv[1]*CFG.CATS.length)-1];
    if (['cpu','mobo','networking','ram','ssd'].includes(catSlug)) s += 0.02;
  }
  // Mobile-aspect users
  if (vportDims.aspect_ratio_mean < 0.3 && iv[30] > 0.5) s += 0.015; // prefer video on mobile

  // ── Search intent ─────────────────────────────────────────────────────────
  const searchDims = SearchIntentTracker.getDims();
  // Heavy searchers prefer exactly what they searched for → relevance boost via cat match
  if (searchDims.search_rate > 0.4 && searchDims.search_recency > 0.5) s += 0.01;
  // Filter-heavy users → boost items matching their most-used filters
  if (searchDims.filter_rate > 0.3) {
    // Condition filter preference already captured in condAffinities
    s += (searchDims.filter_entropy - 0.5) * 0.01;
  }
  // Price sort preference → boost deals
  if (searchDims.price_sort_pref > 0.5 && iv[165] > 0.3) s += 0.01;
  // New-sort preference → boost fresh listings
  if (searchDims.new_sort_pref > 0.5 && iv[2] > 0.7) s += 0.01;

  // ── Clipboard & share ──────────────────────────────────────────────────────
  const clipDims = ClipboardShareTracker.getDims();
  // URL copyists are researchers → boost information-rich listings
  if (clipDims.url_copy_ratio > 0.5 && iv[13] > 0.6) s += 0.01;
  // Share-happy users → boost high-social-proof (viral potential) items
  if (clipDims.share_rate > 0.3 && iv[3] > 0.5) s += 0.015;

  // ── Network quality adaptation ─────────────────────────────────────────────
  const netDims = NetworkQualityTracker.getDims();
  // Poor network → boost listings that don't require heavy media
  if (netDims.fetch_slow_rate > 0.5 && iv[30] > 0.5) s -= 0.02;
  // High fetch success rate → full recommendations, no suppression needed
  if (netDims.fetch_success_rate < 0.6) s -= (1-netDims.fetch_success_rate) * 0.01;

  // ── Early engagement prediction ───────────────────────────────────────────
  const earlyDims = EarlyEngagementPredictor.getDims();
  // If predictor is accurate, trust it more for scoring
  if (earlyDims.early_predict_accuracy > 0.65) s += (earlyDims.early_predict_accuracy - 0.5) * 0.02;

  // ── Seller listing quality ────────────────────────────────────────────────
  // Return policy boost (buyer protection)
  s += (iv[25] - 0.5) * 0.01;
  // Shipping speed boost
  s += (iv[26] - 0.5) * 0.01;
  // Freshness (recently listed)
  s += (iv[28] - 0.5) * 0.015;
  // Watcher count social proof
  s += (iv[29] - 0.5) * 0.01;

  return cl(s);
}

async function getUserId(dd) {
  let uid = localStorage.getItem('nox_uid');
  if (!uid) {
    const fp = [
      navigator.language, screen.width, screen.height, screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency, navigator.deviceMemory||0,
      (dd.canvas_hash||0.5).toFixed(6), (dd.audio_hash||0.5).toFixed(6),
      (dd.webgl_score||0.5).toFixed(6), (dd.webgl_sp||0.5).toFixed(6),
      (dd.font_profile||0.5).toFixed(6), navigator.platform||'',
      (navigator.languages||[]).join(','),
    ].join('|');
    let h = 0;
    for (let i=0; i<fp.length; i++) h = (Math.imul(31,h) + fp.charCodeAt(i)) | 0;
    uid = 'nox3_' + Math.abs(h).toString(36) + '_' + Date.now().toString(36);
    localStorage.setItem('nox_uid', uid);
  }
  return uid;
}

function wipeLocalState() {
  ['nox_uid','nox_session_start','nox_last_visit','nox_visit_count','nox_weights']
    .forEach(k => localStorage.removeItem(k));
}

const Cosmic = {
  async getProfile(uid) {
    try {
      const r = await fetch(`${CFG.PROFILE_PATH}?uid=${encodeURIComponent(uid)}`);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  },
  async createProfile(uid, profile) {
    try {
      const r = await fetch(CFG.PROFILE_PATH, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid, profile }),
      });
      return r.json();
    } catch { return null; }
  },
  async updateProfile(id, profile) {
    try {
      const r = await fetch(CFG.PROFILE_PATH, {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id, profile }),
      });
      return r.json();
    } catch { return null; }
  },
  async deleteProfile(id) {
    try {
      const r = await fetch(CFG.PROFILE_PATH, {
        method:'DELETE',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id }),
      });
      return r.json();
    } catch { return null; }
  },
};

function firePixel(uid, extraData={}) {
  const p = new URLSearchParams({ uid, ref:document.referrer, page:location.pathname, tod:timeOfDayBucket(), ...extraData });
  navigator.sendBeacon?.(CFG.PIXEL_PATH+'?'+p) ||
    fetch(CFG.PIXEL_PATH+'?'+p, { method:'GET', keepalive:true }).catch(()=>{});
}
function inferCatsFromReferrer(ref) {
  if (!ref) return [];
  const r = ref.toLowerCase();
  return CFG.CATS.filter(c => r.includes(c));
}

const AdaptiveWeights = (() => {
  let w = { ...CFG.WEIGHTS };
  const hits = Object.fromEntries(Object.keys(CFG.WEIGHTS).map(k=>[k,{h:0,m:0}]));
  const LR=0.02, MIN_W=0.01, MAX_W=2.0;

  function load() {
    try { w = { ...CFG.WEIGHTS, ...JSON.parse(localStorage.getItem('nox_weights')||'{}') }; } catch {}
  }
  function save() {
    try { localStorage.setItem('nox_weights', JSON.stringify(w)); } catch {}
  }
  function feedback(signal, features) {
    const engaged = signal > 0.5;
    for (const [feat, contrib] of Object.entries(features)) {
      if (!(feat in hits)) continue;
      ((engaged && contrib>0)||(!engaged && contrib<0)) ? hits[feat].h++ : hits[feat].m++;
      const total = hits[feat].h + hits[feat].m;
      if (total > 20) {
        const hr = hits[feat].h / total;
        w[feat] = Math.max(MIN_W, Math.min(MAX_W, lerp(w[feat], w[feat]*(0.9+hr*0.2), LR)));
        hits[feat] = {h:0,m:0};
        save();
      }
    }
  }
  function get() { return w; }
  return { load, feedback, get };
})();

function defaultProfile() {
  return {
    uv:                   new Array(CFG.VEC_DIM).fill(0.5),
    baseline_watch:       4000,
    baseline_scroll:      0.5,
    baseline_session:     1,
    tod_weights:          [0.25, 0.25, 0.25, 0.25],
    weekday_weights:      new Array(7).fill(1/7),
    seen:                 {},
    interactions:         0,
    pixel_cats:           [],
    dwell_history:        [],
    like_count:0, watch_count:0, skip_count:0, share_count:0, buy_count:0,
    session_count:        parseInt(localStorage.getItem('nox_visit_count')||'1'),
    last_visit_ts:        parseInt(localStorage.getItem('nox_last_visit')||String(Date.now())),
    interest_snapshot:    new Array(CFG.VEC_DIM).fill(0.5),
    session_interactions: 0,
    price_clicks:         [],
    cat_history:          [],
    cat_cooccurrence:     new Array(CFG.CATS.length * CFG.CATS.length).fill(0),
    device_dims:          {},
    bio_dims:             {},
    last_updated:         Date.now(),
    consent_version:      3,
    copy_events:          0,
    tab_switch_count:     0,
    context_menu_count:   0,
    long_press_count:     0,
    selection_count:      0,
    page_history:         [],
    entry_sources:        [],
    viewport_history:     [],
    idle_sessions:        0,
    // Extended tracker snapshots (written on save)
    micro_gesture_dims:   {},
    reading_dims:         {},
    attn_heatmap_dims:    {},
    session_rhythm_dims:  {},
    env_dims:             {},
    temporal_dims:        {},
    churn_dims:           {},
    social_dims:          {},
    price_sens_dims:      {},
    video_eng_dims:       {},
    seq_dims:             {},
    hw_dims:              {},
    viewport_dims:        {},
    clipboard_dims:       {},
    cog_dims:             {},
    net_dims:             {},
  };
}

const lrCore   = (n) => Math.max(0.003, 0.12  / Math.sqrt(1 + n*0.04));
const lrDevice = (n) => Math.max(0.001, 0.04  / Math.sqrt(1 + n*0.02));
const lrLatent = (n) => Math.max(0.001, 0.018 / Math.sqrt(1 + n*0.01));
function dimRate(i, n) {
  if (i<32)  return lrCore(n);
  if (i<192) return lrDevice(n);
  return lrLatent(n);
}

function itemVec(el) {
  const price    = priceNorm(el.dataset.price||'0');
  const cat      = catIdx(el.dataset.category||'');
  const fresh    = 1 - daysSince(el.dataset.ts);
  const likes    = cl(parseInt(el.dataset.likes||'0')/500);
  const views    = cl(parseInt(el.dataset.views||'0')/5000);
  const seller   = cl(parseInt(el.dataset.sellerScore||'50')/100);
  const quality  = qualityNorm(parseInt(el.dataset.descLen||'0'), parseInt(el.dataset.imgCount||'0'));
  const condition = condIdx(el.dataset.condition||'');
  const social   = cl(likes*0.6 + views*0.4);

  const v = new Array(CFG.VEC_DIM).fill(0.5);
  v[0]=price;  v[1]=cat;    v[2]=fresh;   v[3]=social;  v[4]=seller;
  v[5]=0.5;    v[6]=0.5;    v[7]=0.5;     v[8]=0.5;     v[9]=0.5;
  v[10]=price; v[11]=likes; v[12]=0.5;    v[13]=quality; v[14]=condition; v[15]=0.5;
  v[16]=views; v[17]=fresh; v[18]=social; v[19]=quality;
  v[20]=price; v[21]=cat;   v[22]=condition; v[23]=seller;
  v[160] = price < 0.15 ? 1 : 0;
  v[161] = price>=0.15 && price<0.4  ? 1 : 0;
  v[162] = price>=0.4  && price<0.65 ? 1 : 0;
  v[163] = price>=0.65 ? 1 : 0;
  return v;
}

export const NoxTracker = (() => {
  let uid, profile, cosmicId;
  const itemVecs = {};
  let saveTimer=null, slidesViewed=0, initialized=false;
  let watchStart=null, currentId=null, scrollY0=0, scrollT0=0;
  let lastFeatureContribs={};

  async function loadProfile(dd) {
    uid = await getUserId(dd);

    const visitCount = parseInt(localStorage.getItem('nox_visit_count')||'0') + 1;
    const lastVisit  = parseInt(localStorage.getItem('nox_last_visit')||'0');
    localStorage.setItem('nox_last_visit',  String(Date.now()));
    localStorage.setItem('nox_visit_count', String(visitCount));

    firePixel(uid, { cats: inferCatsFromReferrer(document.referrer).join(',') });

    try {
      const obj = await Cosmic.getProfile(uid);
      if (obj) {
        cosmicId = obj.id;
        profile  = { ...defaultProfile(), ...obj.metadata };
        for (const key of ['uv','interest_snapshot']) {
          if (typeof profile[key]==='string') profile[key]=JSON.parse(profile[key]);
          if (!Array.isArray(profile[key])||profile[key].length!==CFG.VEC_DIM)
            profile[key] = Array.from({length:CFG.VEC_DIM},(_,i)=>Array.isArray(profile[key])?(profile[key][i]??0.5):0.5);
        }
        for (const key of ['dwell_history','price_clicks','cat_history','cat_cooccurrence','page_history','entry_sources','viewport_history']) {
          if (typeof profile[key]==='string') try{profile[key]=JSON.parse(profile[key]);}catch{profile[key]=[];}
          if (!Array.isArray(profile[key])) profile[key]=[];
        }
      } else {
        profile=defaultProfile(); cosmicId=null;
      }
    } catch { profile=defaultProfile(); cosmicId=null; }

    profile.session_count        = visitCount;
    profile.last_visit_ts        = lastVisit||Date.now();
    profile.session_interactions = 0;
    profile.interest_snapshot    = [...profile.uv];

    profile.page_history = [...(profile.page_history||[]).slice(-49), location.pathname];
    profile.entry_sources = [...(profile.entry_sources||[]).slice(-19), {
      ref: document.referrer ? hashNorm(document.referrer).toFixed(4) : '0',
      ts:  Date.now(),
      tod: timeOfDayBucket(),
    }];
    profile.viewport_history = [...(profile.viewport_history||[]).slice(-19), {
      w: window.innerWidth, h: window.innerHeight, r: window.devicePixelRatio||1,
    }];

    applyDeviceDims(dd);
    applyPixelCats();
    updateDerivedDims();
    return profile;
  }

  function applyDeviceDims(dd) {
    if (!dd) return;
    profile.device_dims = dd;
    const fields = [
      'canvas_hash','webgl_score','webgl_tier','webgl_tex','webgl_ext',
      'audio_hash','font_profile','battery_level','battery_charge',
      'conn_type','conn_speed','conn_rtt','gpu_tier','gpu_score',
      'pointer_type','hw_concurrency','device_memory','screen_class',
      'pixel_ratio','color_depth','perf_class','webgpu_tier',
    ];
    fields.forEach((f,i) => { if (dd[f]!==undefined) profile.uv[32+i]=cl(dd[f]); });
    profile.uv[54] = dd.audio_peak     ?? 0.5;
    profile.uv[55] = dd.webgl_sp       ?? 0.5;
    profile.uv[56] = dd.webgl_vendor   ?? 0.5;
    profile.uv[57] = dd.battery_ct     ?? 0.5;
    profile.uv[58] = dd.battery_dt     ?? 0.5;
    profile.uv[59] = dd.conn_save      ?? 0;
    profile.uv[60] = dd.hover_support  ?? 0.5;
    profile.uv[61] = dd.hdr_support    ?? 0;
    profile.uv[62] = dd.prefers_dark   ?? 0.5;
    profile.uv[63] = dd.prefers_reduced?? 0;
  }

  function applyBioDims() {
    const bio = BioTracker.getDims();
    profile.bio_dims = bio;
    const fields = [
      'mouse_speed_mean','mouse_speed_var','mouse_curve_mean',
      'scroll_accel_mean','scroll_accel_var','keystroke_mean','keystroke_var',
      'dwell_pos_mean','dwell_pos_var','rage_click_ratio',
      'click_interval_mean','click_interval_var','idle_ratio','idle_count',
      'focus_blur_rate','visibility_changes','avg_focus_gap','tab_switch_rate',
      'copy_rate','paste_rate','context_menu_rate','resize_count',
      'wheel_intensity','selection_rate','touch_pressure','touch_area',
      'long_press_rate','mouse_enter_rate','mouse_leave_rate',
    ];
    fields.forEach((f,i) => { if (bio[f]!==undefined) profile.uv[64+i]=cl(lerp(profile.uv[64+i]??0.5,bio[f],0.15)); });

    profile.copy_events       = (profile.copy_events||0)       + (bio.copy_rate > 0.1 ? 1 : 0);
    profile.tab_switch_count  = (profile.tab_switch_count||0)  + (bio.tab_switch_rate > 0.1 ? 1 : 0);
    profile.context_menu_count= (profile.context_menu_count||0)+ (bio.context_menu_rate > 0.1 ? 1 : 0);
    profile.long_press_count  = (profile.long_press_count||0)  + (bio.long_press_rate > 0.1 ? 1 : 0);
    profile.selection_count   = (profile.selection_count||0)   + (bio.selection_rate > 0.1 ? 1 : 0);
    if (bio.idle_ratio > 0.5) profile.idle_sessions = (profile.idle_sessions||0) + 1;
  }

  function applyTemporalDims() {
    const wd = new Date().getDay(), h = new Date().getHours();
    profile.uv[96+wd] = cl(profile.uv[96+wd]*0.9 + 0.1);
    const todD = h<6?0:h<12?1:h<18?2:h<22?3:0;
    profile.uv[103+todD] = cl(profile.uv[103+todD]*0.9 + 0.1);
    profile.uv[107] = cl(lerp(profile.uv[107]??0.5, (h>=22||h<4)?1:0, 0.05));
    profile.uv[108] = cl(lerp(profile.uv[108]??0.5, (wd===0||wd===6)?1:0, 0.05));
    const monthBucket = cl(new Date().getMonth() / 11);
    profile.uv[109] = cl(lerp(profile.uv[109]??0.5, monthBucket, 0.02));
    const dayOfMonth = cl(new Date().getDate() / 31);
    profile.uv[110] = cl(lerp(profile.uv[110]??0.5, dayOfMonth, 0.02));
  }

  function updateCatCooccurrence(catA, catB) {
    if (catA<0||catB<0||catA===catB) return;
    const idx = catA*CFG.CATS.length+catB;
    if (idx<profile.cat_cooccurrence.length)
      profile.cat_cooccurrence[idx] = cl((profile.cat_cooccurrence[idx]||0)*0.95+0.05);
    for (let dim=0; dim<32; dim++) {
      let proj=0;
      for (let i=0; i<CFG.CATS.length; i++) {
        const j=(i*7+dim*3)%CFG.CATS.length;
        proj += (profile.cat_cooccurrence[i*CFG.CATS.length+j]||0);
      }
      profile.uv[128+dim] = cl(proj/CFG.CATS.length);
    }
  }

  function applyPixelCats() {
    (profile.pixel_cats||[]).forEach(c => {
      const i = CFG.CATS.indexOf(c);
      if (i>=0) {
        profile.uv[1]  = cl(profile.uv[1] *0.95 + (i+1)/CFG.CATS.length*0.05);
        profile.uv[5]  = cl(profile.uv[5] *0.92 + (i+1)/CFG.CATS.length*0.08);
        profile.uv[12] = cl(profile.uv[12]*0.97 + 0.03);
      }
    });
  }

  function updateDerivedDims() {
    const total = Math.max(profile.interactions,1);
    profile.uv[24] = cl(vari((profile.dwell_history||[]).map(d=>d/10000)));
    profile.uv[25] = cl((profile.like_count||0) / Math.max(profile.watch_count||1,1));
    profile.uv[26] = cl((profile.skip_count||0) / total);
    profile.uv[27] = cl((profile.share_count||0) / total*5);
    profile.uv[28] = cl((profile.buy_count||0)   / total*10);
    profile.uv[29] = cl((Date.now()-(profile.last_visit_ts||Date.now()))/(1000*60*60*24*30));
    if (Array.isArray(profile.interest_snapshot)) profile.uv[30]=cl(cos(profile.uv,profile.interest_snapshot));
    const sessionAvg = total/Math.max(profile.session_count||1,1);
    profile.uv[31] = cl((profile.session_interactions||0)/Math.max(sessionAvg,1));

    const ch=profile.cat_history||[];
    if (ch.length>4) {
      const freq={}; ch.forEach(c=>freq[c]=(freq[c]||0)+1);
      const probs=Object.values(freq).map(f=>f/ch.length);
      profile.uv[12]=cl(-probs.reduce((s,p)=>s+p*Math.log2(p+1e-9),0)/Math.log2(CFG.CATS.length));
    }
    profile.uv[10] = cl(vari(profile.price_clicks||[])*4);

    profile.uv[111] = cl((profile.copy_events||0) / 20);
    profile.uv[112] = cl((profile.tab_switch_count||0) / 30);
    profile.uv[113] = cl((profile.idle_sessions||0) / 10);
    profile.uv[114] = cl((profile.selection_count||0) / 20);
    profile.uv[115] = cl((profile.long_press_count||0) / 10);
    profile.uv[116] = cl((profile.page_history||[]).length / 50);
    const uniquePages = new Set(profile.page_history||[]).size;
    profile.uv[117] = cl(uniquePages / 20);

    applyBioDims();
    applyTemporalDims();

    // ── Apply new extended tracker dims into latent user vector space ─────────
    // Slots 160–175 reserved for itemVecExtended; user dims start at 200

    const applyDimsAt = (dims, startIdx) => {
      Object.values(dims).forEach((v, i) => {
        const idx = startIdx + i;
        if (idx < CFG.VEC_DIM && typeof v === 'number') {
          profile.uv[idx] = cl(lerp(profile.uv[idx] ?? 0.5, v, 0.12));
        }
      });
    };

    applyDimsAt(MicroGestureTracker.getDims(),      200); // 14 dims → 200–213
    applyDimsAt(ReadingBehaviorTracker.getDims(),   220); // 10 dims → 220–229
    applyDimsAt(AttentionHeatmapTracker.getDims(),  240); // 20 dims → 240–259
    applyDimsAt(SessionRhythmTracker.getDims(),     270); // 12 dims → 270–281
    applyDimsAt(EarlyEngagementPredictor.getDims(), 290); // 4  dims → 290–293
    applyDimsAt(ContentAffinityTensor.getDims(),    300); // 36 dims → 300–335
    applyDimsAt(EnvironmentalTracker.getDims(),     350); // 13 dims → 350–362
    applyDimsAt(TemporalPreferenceModel.getDims(),  370); // 23 dims → 370–392
    applyDimsAt(AntiChurnTracker.getDims(),         400); // 7  dims → 400–406
    applyDimsAt(SocialContextTracker.getDims(),     420); // 7  dims → 420–426
    applyDimsAt(PriceSensitivityModel.getDims(),    440); // 8  dims → 440–447
    applyDimsAt(VideoEngagementTracker.getDims(),   460); // 12 dims → 460–471
    applyDimsAt(InteractionSequencer.getDims(),     490); // 10 dims → 490–499
    applyDimsAt(SearchIntentTracker.getDims(),      510); // 9  dims → 510–518
    applyDimsAt(HardwareEnricher.getDims(),         530); // 19 dims → 530–548
    applyDimsAt(ViewportBehaviorTracker.getDims(),  560); // 9  dims → 560–568
    applyDimsAt(ClipboardShareTracker.getDims(),    580); // 8  dims → 580–587
    applyDimsAt(CognitiveLoadEstimator.getDims(),   600); // 7  dims → 600–606
    applyDimsAt(NetworkQualityTracker.getDims(),    620); // 7  dims → 620–626
  }

  function schedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      updateDerivedDims();
      profile.last_updated = Date.now();
      const r3 = (v) => Math.round(v * 1000) / 1000;
      const payload = {
        uv:              JSON.stringify(profile.uv.map(r3)),
        baseline_watch:  profile.baseline_watch,
        baseline_scroll: profile.baseline_scroll,
        baseline_session:profile.baseline_session||1,
        tod_weights:     JSON.stringify(profile.tod_weights),
        seen:            JSON.stringify(profile.seen),
        interactions:    profile.interactions,
        pixel_cats:      JSON.stringify(profile.pixel_cats||[]),
        last_updated:    profile.last_updated,
      };
      try {
        if (cosmicId) { await Cosmic.updateProfile(cosmicId, payload); }
        else { const res=await Cosmic.createProfile(uid,payload); cosmicId=res?.object?.id||null; }
      } catch(e) { console.warn('[NoxTracker] Save failed',e); }
    }, CFG.SAVE_DEBOUNCE);
  }

  function nudge(id, signal) {
    const iv=itemVecs[id]; if (!iv) return;
    const n=profile.interactions, err=signal-cos(profile.uv,iv);
    profile.uv = profile.uv.map((v,i) => cl(v + dimRate(i,n)*err*(iv[i]??0)));
    profile.interactions++;
    profile.session_interactions=(profile.session_interactions||0)+1;

    const catI = Math.round(iv[1]*CFG.CATS.length)-1;
    if (catI>=0) {
      const prev=profile.cat_history?.slice(-1)[0];
      const prevCI = prev!==undefined ? Math.round(prev*CFG.CATS.length)-1 : -1;
      profile.cat_history=[...(profile.cat_history||[]).slice(-19), iv[1]];
      updateCatCooccurrence(prevCI, catI);
    }
    schedSave();
  }

  function updateBaseline(watchMs, scrollVel) {
    profile.baseline_watch  = lerp(profile.baseline_watch, watchMs, 0.1);
    profile.baseline_scroll = lerp(profile.baseline_scroll, scrollVel, 0.1);
    profile.dwell_history   = [...(profile.dwell_history||[]).slice(-19), watchMs];
    profile.watch_count     = (profile.watch_count||0)+1;
  }

  function score(id) {
    const iv=itemVecs[id]; if (!iv) return 0;
    const w=AdaptiveWeights.get(), contribs={};

    let s=cos(profile.uv,iv)*w.cosine; contribs.cosine=cos(profile.uv,iv);

    const fc=iv[2]*w.recency; s+=fc; contribs.recency=fc;

    const rc=-((profile.seen[id]||0)*0.08*(1-(profile.uv[9]||0.5)*0.5))*w.reengagement;
    s+=rc; contribs.reengagement=rc;

    const tc=((profile.tod_weights[Math.floor(timeOfDayBucket()*4)]||0.25)-0.25)*w.tod;
    s+=tc; contribs.tod=tc;

    const catSlug=CFG.CATS[Math.round(iv[1]*CFG.CATS.length)-1];
    const pc=(catSlug&&profile.pixel_cats?.includes(catSlug))?w.pixel_cat:0;
    s+=pc; contribs.pixel_cat=pc;

    const qc=(iv[13]-0.5)*(profile.uv[13]||0.5)*w.quality;
    s+=qc; contribs.quality=qc;

    let pcc=0;
    if ((profile.price_clicks||[]).length>2) {
      pcc=-Math.abs(iv[0]-mean(profile.price_clicks))*(profile.uv[10]||0.5)*w.price_centroid;
    }
    s+=pcc; contribs.price_centroid=pcc;

    const nc=(profile.seen[id]||0)===0 ? (profile.uv[11]||0.5)*w.novelty : 0;
    s+=nc; contribs.novelty=nc;

    const spc=iv[3]*(profile.uv[3]||0.5)*w.social_proof; s+=spc; contribs.social_proof=spc;

    const dcc=(iv[14]-0.5)*(profile.uv[49]||0.5)*w.device_class; s+=dcc; contribs.device_class=dcc;

    const jitter=(profile.uv[64]||0.5), rage=(profile.uv[73]||0.5);
    const bc=(jitter>0.6||rage>0.5) ? (1-iv[0])*w.biometric : 0;
    s+=bc; contribs.biometric=bc;

    const mc=(profile.uv[31]||0.5)>0.7 ? (Math.random()-0.5)*w.momentum : 0;
    s+=mc; contribs.momentum=mc;

    const tabFocus = profile.uv[77]||0.5;
    const tfc = (tabFocus > 0.6 ? -0.02 : 0.01) * w.tab_focus;
    s+=tfc; contribs.tab_focus=tfc;

    const copySignal = profile.uv[82]||0.5;
    const csc = copySignal * 0.03 * w.copy_signal;
    s+=csc; contribs.copy_signal=csc;

    const idlePattern = profile.uv[76]||0.5;
    const ipc = idlePattern > 0.6 ? -0.015 * w.idle_pattern : 0;
    s+=ipc; contribs.idle_pattern=ipc;

    s+=((profile.weekday_weights?.[new Date().getDay()]||1/7)-1/7)*0.05;

    if (profile.uv[107]>0.6 && catSlug==='gpu') s+=0.04;
    if (profile.uv[62]>0.7) s+=0.01;
    if (profile.uv[113]>0.5) s-=0.02;

    lastFeatureContribs=contribs;

    // Extended scoring from all new trackers
    s += extendedScore(id, iv, profile, w);

    return s;
  }

  function rerank(feed) {
    const slides=Array.from(feed.querySelectorAll('.s'));
    const active=slides.find(s=>{ const r=s.getBoundingClientRect(); return r.top>=0&&r.top<innerHeight; });
    const pivot=active?slides.indexOf(active)+1:0;
    slides.slice(pivot).sort((a,b)=>score(b.dataset.id)-score(a.dataset.id)).forEach(s=>feed.appendChild(s));
  }

  function registerItem(el) {
    const id=el.dataset.id;
    if (!id||itemVecs[id]) return;
    itemVecs[id]=itemVecExtended(el, itemVec(el));
  }

  function onSlideEnter(id) {
    if (currentId&&watchStart) {
      const elapsed=Date.now()-watchStart;
      const scrollVel=scrollT0>0?Math.abs(scrollY0)/(Date.now()-scrollT0+1):0.5;
      const watchRatio=elapsed/Math.max(profile.baseline_watch,1000);
      const scrollDev=cl(1-scrollVel/Math.max(profile.baseline_scroll,0.01));

      let sig=0.5;
      if (watchRatio>=1.5) sig=0.9;
      else if (watchRatio>=0.9) sig=0.75;
      else if (watchRatio>=0.5) sig=0.55;
      else if (watchRatio<0.2) sig=0.1;
      sig=cl(sig+scrollDev*0.1);

      AdaptiveWeights.feedback(sig, lastFeatureContribs);
      nudge(currentId, sig);
      updateBaseline(elapsed, scrollVel);
      BioTracker.recordDwellPosition();
      AttentionHeatmapTracker.getDims(); // triggers zone dwell update

      // Feed signal into all new trackers
      const ivCurrent = itemVecs[currentId];
      if (ivCurrent) {
        ContentAffinityTensor.ingestItem(
          document.querySelector(`[data-id="${currentId}"]`) || { dataset: {} },
          sig
        );
        PriceSensitivityModel.recordInteraction(
          document.querySelector(`[data-id="${currentId}"]`)?.dataset?.price || '0',
          sig
        );
        const catI   = Math.round(ivCurrent[1]*CFG.CATS.length)-1;
        const prevCat = profile.cat_history?.slice(-1)[0];
        const prevCI  = prevCat !== undefined ? Math.round(parseFloat(prevCat)*CFG.CATS.length)-1 : -1;
        ContentAffinityTensor.ingestCatCross(prevCI, catI, sig);
      }
      AntiChurnTracker.onSignal(sig);
      TemporalPreferenceModel.recordSignal(sig);
      EarlyEngagementPredictor.recordOutcome(currentId, sig > 0.5);
      CognitiveLoadEstimator.onItemAction(currentId);
      SessionRhythmTracker.updateSessionEnd(profile.session_interactions||0, (profile.skip_count||0)/(Math.max(profile.interactions,1)));

      // Interaction sequence
      const seqAction = sig > 0.75 ? 'like' : sig > 0.55 ? 'watch' : sig >= 0.2 ? 'brief' : 'skip';
      InteractionSequencer.push(seqAction);

      if (watchRatio<0.2) profile.skip_count=(profile.skip_count||0)+1;

      const iv=itemVecs[currentId];
      if (iv&&sig>0.55) profile.price_clicks=[...(profile.price_clicks||[]).slice(-9), iv[0]];

      profile.seen[currentId]=(profile.seen[currentId]||0)+1;

      const tod=Math.floor(timeOfDayBucket()*4);
      profile.tod_weights=profile.tod_weights.map((w,i)=>i===tod?cl(w*0.9+sig*0.1):w*0.9+0.25*0.1);
      if (!profile.weekday_weights) profile.weekday_weights=new Array(7).fill(1/7);
      const wd=new Date().getDay();
      profile.weekday_weights=profile.weekday_weights.map((w,i)=>i===wd?cl(w*0.9+sig*0.1):w*0.95+(1/7)*0.05);

      slidesViewed++;
      if (slidesViewed%CFG.RERANK_AFTER===0) rerank(document.getElementById('F'));
    }
    currentId=id; watchStart=Date.now(); scrollY0=window.scrollY; scrollT0=Date.now();
    EarlyEngagementPredictor.startObserving(id);
    CognitiveLoadEstimator.onItemEnter(id);
  }

  function onLike(id)  {
    profile.like_count=(profile.like_count||0)+1;
    nudge(id,0.92);
    InteractionSequencer.push('like');
    AntiChurnTracker.onSignal(0.92);
    TemporalPreferenceModel.recordSignal(0.92);
    schedSave();
  }
  function onSave(id)  {
    nudge(id,0.88);
    InteractionSequencer.push('save');
    AntiChurnTracker.onSignal(0.88);
    schedSave();
  }
  function onBuy(id)   {
    profile.buy_count=(profile.buy_count||0)+1;
    nudge(id,0.97);
    InteractionSequencer.push('buy');
    AntiChurnTracker.onSignal(0.97);
    TemporalPreferenceModel.recordSignal(0.97);
    const rawPrice = document.querySelector(`[data-id="${id}"]`)?.dataset?.price;
    if (rawPrice) PriceSensitivityModel.recordInteraction(rawPrice, 0.97);
    schedSave();
  }
  function onShare(id) {
    profile.share_count=(profile.share_count||0)+1;
    nudge(id,0.85);
    InteractionSequencer.push('share');
    SocialContextTracker.recordShare();
    ClipboardShareTracker.getDims(); // flush share state
    schedSave();
  }
  function onSkip(id)  {
    profile.skip_count=(profile.skip_count||0)+1;
    nudge(id,0.08);
    InteractionSequencer.push('skip');
    AntiChurnTracker.onSignal(0.08);
    const rawPrice = document.querySelector(`[data-id="${id}"]`)?.dataset?.price;
    if (rawPrice) PriceSensitivityModel.recordInteraction(rawPrice, 0.08);
    schedSave();
  }

  async function ingestPixelCategories(cats) {
    if (!Array.isArray(cats)) return;
    profile.pixel_cats=[...new Set([...(profile.pixel_cats||[]),...cats])];
    applyPixelCats(); schedSave();
  }

  async function init() {
    if (initialized) return;
    if (!hasStatisticsConsent()) return;
    initialized=true;

    AdaptiveWeights.load();
    BioTracker.attach();

    // Attach all new trackers
    MicroGestureTracker.attach();
    ReadingBehaviorTracker.attach();
    AttentionHeatmapTracker.attach();
    SessionRhythmTracker.attach();
    EarlyEngagementPredictor.attach();
    EnvironmentalTracker.attach();
    TemporalPreferenceModel.attach();
    AntiChurnTracker.attach();
    SocialContextTracker.attach();
    PriceSensitivityModel.attach();
    VideoEngagementTracker.attach();
    InteractionSequencer.attach();
    SearchIntentTracker.attach();
    CognitiveLoadEstimator.attach();
    NetworkQualityTracker.attach();
    ViewportBehaviorTracker.attach();
    ClipboardShareTracker.attach();
    await HardwareEnricher.attach();

    const dd = await collectDeviceDims();
    await loadProfile(dd);

    // Record session start for rhythm tracking
    SessionRhythmTracker.recordSessionStart(
      profile.session_interactions||0,
      (profile.skip_count||0)/Math.max(profile.interactions||1,1)
    );

    const feed=document.getElementById('F');
    if (!feed) return;

    feed.querySelectorAll('.s').forEach(registerItem);
    new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
      if (!(n instanceof HTMLElement)) return;
      if (n.classList.contains('s')) { registerItem(n); }
      n.querySelectorAll?.('.s').forEach(registerItem);
    }))).observe(feed,{childList:true,subtree:true});

    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{
      if(e.isIntersecting) {
        onSlideEnter(e.target.dataset.id);
        // Notify video tracker of slide enter
        const vid = e.target.querySelector('video');
        if (vid) VideoEngagementTracker.recordSlideEnter(vid);
      }
    }),{threshold:0.7});
    feed.querySelectorAll('.s').forEach(s=>obs.observe(s));

    window.addEventListener('scroll',()=>{scrollY0=window.scrollY;scrollT0=Date.now();},{passive:true});

    window.__nox={
      onLike,onSave,onBuy,onShare,onSkip,
      ingestPixelCategories,score,
      rerank:()=>rerank(feed),
      // Debug/inspect APIs
      getProfile: ()=>profile,
      getTrackerDims: () => ({
        micro:      MicroGestureTracker.getDims(),
        reading:    ReadingBehaviorTracker.getDims(),
        attn:       AttentionHeatmapTracker.getDims(),
        session:    SessionRhythmTracker.getDims(),
        early:      EarlyEngagementPredictor.getDims(),
        affinity:   ContentAffinityTensor.getDims(),
        env:        EnvironmentalTracker.getDims(),
        temporal:   TemporalPreferenceModel.getDims(),
        churn:      AntiChurnTracker.getDims(),
        social:     SocialContextTracker.getDims(),
        price:      PriceSensitivityModel.getDims(),
        video:      VideoEngagementTracker.getDims(),
        seq:        InteractionSequencer.getDims(),
        search:     SearchIntentTracker.getDims(),
        hw:         HardwareEnricher.getDims(),
        viewport:   ViewportBehaviorTracker.getDims(),
        clipboard:  ClipboardShareTracker.getDims(),
        cog:        CognitiveLoadEstimator.getDims(),
        net:        NetworkQualityTracker.getDims(),
      }),
      predictNext: (actions) => InteractionSequencer.predictNext(actions),
    };

    const hwDims = HardwareEnricher.getDims();
    const vidDims = VideoEngagementTracker.getDims();
    console.log(
      `[NoxTracker] v6 | uid:${uid} | dim:${CFG.VEC_DIM} | interactions:${profile.interactions}` +
      ` | sessions:${profile.session_count} | gpu:${dd.gpu_tier?.toFixed(2)}` +
      ` | ptr:${dd.pointer_type===1?'mouse':'touch'} | late_night:${profile.uv[107]?.toFixed(2)}` +
      ` | dark:${dd.prefers_dark} | idle_sessions:${profile.idle_sessions}` +
      ` | trackers:19 | active_dims:${CFG.VEC_DIM}` +
      ` | gamepad:${hwDims.has_gamepad} | xr:${hwDims.has_xr}` +
      ` | vid_completion:${vidDims.video_completion_mean?.toFixed(2)}` +
      ` | churn_risk:${AntiChurnTracker.getDims().churn_risk_mean?.toFixed(2)}`
    );
  }

  async function onConsentWithdrawn() {
    if (cosmicId) { try { await Cosmic.deleteProfile(cosmicId); } catch {} }
    wipeLocalState();
    initialized=false; uid=null; profile=null; cosmicId=null;
    console.log('[NoxTracker] Consent withdrawn — profile deleted.');
  }

  return { init, onLike, onSave, onBuy, onShare, onSkip, score, ingestPixelCategories, onConsentWithdrawn };
})();

if (typeof window !== 'undefined') {
  window.addEventListener('CookiebotOnAccept', () => {
    if (window.CookieConsent?.consent?.statistics) NoxTracker.init();
  });
  window.addEventListener('CookiebotOnDecline', () => NoxTracker.onConsentWithdrawn());
  if (window.CookieConsent?.consent?.statistics) NoxTracker.init();
}
