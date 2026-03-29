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
    itemVecs[id]=itemVec(el);
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
  }

  function onLike(id)  { profile.like_count =(profile.like_count ||0)+1; nudge(id,0.92); schedSave(); }
  function onSave(id)  { nudge(id,0.88); schedSave(); }
  function onBuy(id)   { profile.buy_count  =(profile.buy_count  ||0)+1; nudge(id,0.97); schedSave(); }
  function onShare(id) { profile.share_count=(profile.share_count||0)+1; nudge(id,0.85); schedSave(); }
  function onSkip(id)  { profile.skip_count =(profile.skip_count ||0)+1; nudge(id,0.08); schedSave(); }

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

    const dd = await collectDeviceDims();
    await loadProfile(dd);

    const feed=document.getElementById('F');
    if (!feed) return;

    feed.querySelectorAll('.s').forEach(registerItem);
    new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
      if (!(n instanceof HTMLElement)) return;
      if (n.classList.contains('s')) registerItem(n);
      n.querySelectorAll?.('.s').forEach(registerItem);
    }))).observe(feed,{childList:true,subtree:true});

    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{ if(e.isIntersecting) onSlideEnter(e.target.dataset.id); }),{threshold:0.7});
    feed.querySelectorAll('.s').forEach(s=>obs.observe(s));

    window.addEventListener('scroll',()=>{scrollY0=window.scrollY;scrollT0=Date.now();},{passive:true});

    window.__nox={onLike,onSave,onBuy,onShare,onSkip,ingestPixelCategories,score,rerank:()=>rerank(feed)};

    console.log(`[NoxTracker] v4 | uid:${uid} | dim:${CFG.VEC_DIM} | interactions:${profile.interactions} | sessions:${profile.session_count} | gpu:${dd.gpu_tier?.toFixed(2)} | ptr:${dd.pointer_type===1?'mouse':'touch'} | late_night:${profile.uv[107]?.toFixed(2)} | dark:${dd.prefers_dark} | idle_sessions:${profile.idle_sessions}`);
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
