// theme toggle, now playing, github graph, hover video, dotted mountains.
// plain ES2020, no modules; every feature fails quietly so the static page always reads.

const LASTFM_KEY = '2c7b6f90d4275722bb83d722e459ae3f'; // TODO: read-only last.fm api key; empty hides the line
const LASTFM_USER = 'christuphor';
const GITHUB_USER = 'christufur';

const SCRIPT_URL = document.currentScript ? document.currentScript.src : location.href; // only readable while the script first runs
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDay = () => root.dataset.theme
  ? root.dataset.theme === 'day'
  : matchMedia('(prefers-color-scheme: light)').matches;

// ---------- theme ----------
// the button shows the theme you switch to; the whole page crossfades when the browser can
const themeBtn = document.getElementById('theme');
function themeLabel() { if (themeBtn) themeBtn.textContent = isDay() ? 'night' : 'day'; }
if (themeBtn) {
  themeLabel();
  themeBtn.hidden = false;
  themeBtn.addEventListener('click', () => {
    const next = isDay() ? 'night' : 'day';
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
      themeLabel();
      window.dispatchEvent(new Event('themechange')); // the mountains rebuild on this
    };
    if (document.startViewTransition && !reduced) document.startViewTransition(apply);
    else apply();
  });
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  themeLabel();
  window.dispatchEvent(new Event('themechange'));
});

// ---------- now playing (last.fm) ----------
// any failure hides the line; the visitor never sees an error
const np = document.getElementById('nowplaying');
async function refreshNowPlaying() {
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_KEY}&format=json&limit=1`,
      { signal: AbortSignal.timeout(3000) });
    const t = (await res.json()).recenttracks.track[0];
    const live = t['@attr'] && t['@attr'].nowplaying === 'true';
    const a = document.createElement('a');
    a.href = t.url;
    a.textContent = `${t.name} · ${t.artist['#text']}`;
    const lead = document.createElement('span');
    if (live) { lead.className = 'dot'; lead.textContent = '●'; } else lead.textContent = '♪';
    np.replaceChildren(lead, ` ${live ? 'currently playing' : 'last played'} — `, a);
    np.hidden = false;
    np.dataset.ok = '1';
  } catch (e) {
    if (!np.dataset.ok) np.hidden = true; // a failed refresh keeps the last good track on screen
  }
}
if (np && LASTFM_KEY) {
  refreshNowPlaying();
  setInterval(() => { if (!document.hidden) refreshNowPlaying(); }, 60000);
}

// ---------- github contributions (26 weeks) ----------
// cached for 6 hours and fetched when the browser is idle, so it never competes with first paint
const contrib = document.getElementById('contrib');
const CONTRIB_KEY = 'contrib', CONTRIB_MS = 6 * 3600 * 1000;
function renderContrib(days) { // days: [date, count, level]
  const pad = new Date(days[0][0] + 'T00:00:00').getDay(); // first column starts on a sunday
  const cells = [];
  let total = 0;
  for (let i = 0; i < pad; i++) {
    const c = document.createElement('i');
    c.style.visibility = 'hidden';
    cells.push(c);
  }
  days.forEach(([date, count, level], i) => {
    total += count;
    const c = document.createElement('i');
    c.dataset.l = level;
    c.title = `${count} contribution${count === 1 ? '' : 's'} on ${date}`;
    c.style.animationDelay = `${Math.floor((i + pad) / 7) * 16}ms`; // oldest week first
    cells.push(c);
  });
  const grid = contrib.querySelector('.contrib');
  grid.style.setProperty('--weeks', Math.ceil((pad + days.length) / 7));
  grid.replaceChildren(...cells);
  contrib.querySelector('p').textContent = `${total} contributions in the last six months`;
  contrib.hidden = false;
  window.dispatchEvent(new Event('relayout')); // the mountains clear around the new grid
}
async function loadContrib() {
  try {
    const hit = JSON.parse(localStorage.getItem(CONTRIB_KEY) || 'null');
    if (hit && Date.now() - hit.t < CONTRIB_MS) { renderContrib(hit.days); return; }
  } catch (e) { /* no cache */ }
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`,
      { signal: AbortSignal.timeout(4000) });
    const days = (await res.json()).contributions.slice(-182).map(d => [d.date, d.count, d.level]);
    try { localStorage.setItem(CONTRIB_KEY, JSON.stringify({ t: Date.now(), days })); } catch (e) { /* storage blocked */ }
    renderContrib(days);
  } catch (e) {
    contrib.hidden = true;
  }
}
if (contrib) {
  if ('requestIdleCallback' in window) requestIdleCallback(loadContrib, { timeout: 2000 });
  else setTimeout(loadContrib, 200);
}

// ---------- project media: a short video loads on first hover (tap on touch) ----------
document.querySelectorAll('.media[data-video]').forEach(box => {
  let video;
  const start = parseFloat(box.dataset.start || '0');
  const make = () => {
    video = document.createElement('video');
    video.src = box.dataset.video;
    video.muted = video.loop = video.playsInline = true;
    video.preload = 'auto';
    box.append(video);
  };
  const play = () => { if (!video) make(); video.play().catch(() => {}); };
  const stop = () => { if (video) { video.pause(); video.currentTime = start; } };
  box.addEventListener('mouseenter', play);
  box.addEventListener('mouseleave', stop);
  box.addEventListener('click', () => { (video && !video.paused) ? stop() : play(); });
});

// ---------- dotted mountains and sky ----------
// a fixed canvas behind the whole page. images/mountains-{dark,light}.webp carry the mountains:
// alpha = dot density, rgb = dot color (made offline by tools/mountains_mask.py).
// above the ridge the same dither continues as a sparse sky that thickens toward the skyline.
(function mountains() {
  const SPACING = 2.8;       // css px between dots
  const WIDTH_FRAC = 0.95;   // photo width as a share of the window
  const HEIGHT_FRAC = 1.0;   // photo height = what it would be at this share of the window width
  const SIDE_FADE = 0.12;    // left and right share of the photo that fades out
  const HALO = 5;            // px over which dots fade out around text
  const RISE_MS = 1800;
  const IMG_VERSION = 1;     // bump after re-running tools/mountains_mask.py (and in each page's <head>)
  const SKY_MAX = 0.55;      // sky density at the skyline; the sky lattice has 1/4 of the points, so this reads light
  const SKY_REACH = 0.4;     // how far above the ridge the glow reaches, as a share of the window height
  // sky colors, taken from the two photos: [top of the page, at the skyline]
  const SKY = {
    dark: { top: [74, 86, 160], low: [196, 112, 168] },
    light: { top: [246, 200, 150], low: [232, 124, 52] },
  };

  const canvas = document.createElement('canvas');
  canvas.className = 'mountains';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  // 8x8 bayer matrix, thresholds in (0,1): tone becomes dot spacing like a halftone
  const BAYER = (() => {
    let m = [[0]];
    for (let n = 1; n < 8; n *= 2) {
      const s = m.length, next = [];
      for (let y = 0; y < s * 2; y++) next.push([]);
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const v = m[y][x] * 4;
        next[y][x] = v; next[y][x + s] = v + 2; next[y + s][x] = v + 3; next[y + s][x + s] = v + 1;
      }
      m = next;
    }
    return m.flat().map(v => (v + 0.5) / 64);
  })();
  const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  // seeded, so a resize (or the mobile address bar) never reshuffles the stray dots
  const rng = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  const photos = {}; // mode -> Promise of { w, h, data }
  function loadPhoto(mode) {
    return photos[mode] || (photos[mode] = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          const x = c.getContext('2d');
          x.drawImage(img, 0, 0);
          res({ w: c.width, h: c.height, data: x.getImageData(0, 0, c.width, c.height).data }); // throws on file://
        } catch (e) { rej(e); }
      };
      img.onerror = rej;
      img.src = new URL(`images/mountains-${mode}.webp?v=${IMG_VERSION}`, SCRIPT_URL); // relative to this file, so it works on a 404 at any depth
    }));
  }

  let photo = null, dark = true, W = 0, H = 0, dpr = 1, cols = 0, rows = 0;
  let tone, color, jitter, clear, target, sky;   // per lattice point; sky = 1 where the point belongs to the sky
  let rects = [];                                // text and box rects in document coordinates
  let raf = 0, last = 0, ready = false, risePending = false, dirty = false, building = 0;

  // builds the dot lattice. async so the work comes in slices of ~35 rows: on a slow phone one
  // long task would freeze input, many short ones do not. returns false if a newer rebuild took over
  async function layout(id) {
    W = innerWidth; H = innerHeight;
    const hd = HEIGHT_FRAC * W * photo.h / photo.w;           // drawn photo height, anchored to the bottom
    const photoTop = H - hd, photoW = WIDTH_FRAC * W, photoLeft = (W - photoW) / 2;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    cols = Math.ceil(W / SPACING); rows = Math.ceil(H / SPACING);
    const n = cols * rows, rand = rng(7);
    tone = new Float32Array(n); color = new Uint16Array(n); sky = new Uint8Array(n);
    jitter = new Float32Array(n); clear = new Float32Array(n); target = new Float32Array(n);
    const d = photo.data;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        jitter[k] = rand(); // fixed, so cleared areas keep the same stray dots
        const u = ((i + 0.5) * SPACING - photoLeft) / photoW, v = ((j + 0.5) * SPACING - photoTop) / hd;
        if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
        const p = (Math.floor(v * photo.h) * photo.w + Math.floor(u * photo.w)) * 4;
        tone[k] = d[p + 3] / 255 * smooth(0, SIDE_FADE, u) * smooth(0, SIDE_FADE, 1 - u);
        color[k] = (d[p] >> 4) << 8 | (d[p + 1] >> 4) << 4 | (d[p + 2] >> 4); // 4 bits per channel
      }
      if (j % 35 === 34) { await yieldToBrowser(); if (id !== building) return false; }
    }
    // the sky: above each column's ridge, on every second row and column, glowing toward the skyline
    const pal = SKY[dark ? 'dark' : 'light'], reach = SKY_REACH * H;
    for (let i = 0; i < cols; i += 2) {
      if (i % 120 === 118) { await yieldToBrowser(); if (id !== building) return false; }
      let ridge = rows; // first row of this column (and its neighbour) that belongs to a mountain
      for (let j = 0; j < rows; j++) if (tone[j * cols + i] > 0.08 || (i + 1 < cols && tone[j * cols + i + 1] > 0.08)) { ridge = j; break; }
      for (let j = 0; j < Math.min(ridge - 1, rows); j += 2) {
        const k = j * cols + i, y = (j + 0.5) * SPACING;
        const g = Math.exp(-((ridge - j) * SPACING) / reach);   // 1 at the skyline, fading upward
        tone[k] = SKY_MAX * (0.2 + 0.8 * g) * smooth(0, 0.12, y / H); // and nothing at the very top
        const m = (a, b) => Math.round((a + (b - a) * g) / 17);
        color[k] = m(pal.top[0], pal.low[0]) << 8 | m(pal.top[1], pal.low[1]) << 4 | m(pal.top[2], pal.low[2]);
        sky[k] = 1;
      }
    }
    return true;
  }

  // everything that must stay readable: every text line, plus a few boxes
  function measure() {
    const out = [], sx = scrollX, sy = scrollY, range = document.createRange();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeValue.trim() && !n.parentElement.closest('header,script,style,canvas,pre')
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) out.push({ l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy });
    }
    document.querySelectorAll('.hl, .contrib, .media, .chip').forEach(el => {
      if (el.closest('header') || el.hidden || el.closest('[hidden]')) return;
      const r = el.getBoundingClientRect();
      out.push({ l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy });
    });
    rects = out;
  }

  // how far each dot should be cleared (1 inside a box, fading to 0 over HALO px).
  // only boxes on screen are visited, so a long page costs no more than a short one
  function retarget() {
    target.fill(0);
    for (const q of rects) {
      const l = q.l - scrollX, r = q.r - scrollX, t = q.t - scrollY, b = q.b - scrollY;
      if (b + HALO < 0 || t - HALO > H || r + HALO < 0 || l - HALO > W) continue;
      const i0 = Math.max(0, Math.floor((l - HALO) / SPACING)), i1 = Math.min(cols - 1, Math.ceil((r + HALO) / SPACING));
      const j0 = Math.max(0, Math.floor((t - HALO) / SPACING)), j1 = Math.min(rows - 1, Math.ceil((b + HALO) / SPACING));
      for (let j = j0; j <= j1; j++) {
        const y = (j + 0.5) * SPACING, dy = Math.max(t - y, 0, y - b);
        for (let i = i0; i <= i1; i++) {
          const x = (i + 0.5) * SPACING, dx = Math.max(l - x, 0, x - r);
          const c = 1 - Math.hypot(dx, dy) / HALO;
          const k = j * cols + i;
          if (c > target[k]) target[k] = c;
        }
      }
    }
    if (reduced) clear.set(target);
  }

  const colorCache = new Map();
  function dotColor(c) { // c = 12-bit color, 4 bits per channel
    let s = colorCache.get(c);
    if (s) return s;
    s = `rgb(${(c >> 8 & 15) * 17} ${(c >> 4 & 15) * 17} ${(c & 15) * 17})`;
    colorCache.set(c, s);
    return s;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const radius = (dark ? 0.24 : 0.30) * SPACING, side = radius * 2, paths = new Map();
    for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) * SPACING;
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i, t0 = tone[k];
        if (t0 <= 0) continue;
        // the sky lives on a coarser lattice, so it gets its own bayer cell
        const th = sky[k] ? BAYER[((j >> 1) & 7) * 8 + ((i >> 1) & 7)] : BAYER[(j & 7) * 8 + (i & 7)];
        if (t0 - clear[k] * (1 - 0.6 * jitter[k]) <= th) continue;
        const x = (i + 0.5) * SPACING, key = color[k];
        let p = paths.get(key);
        if (!p) paths.set(key, p = new Path2D());
        p.rect(x - radius, y - radius, side, side); // at this size a square is a dot
      }
    }
    for (const [key, p] of paths) {
      ctx.fillStyle = dotColor(key);
      ctx.globalAlpha = dark ? 0.75 : 1;
      ctx.fill(p);
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(50, now - last || 16);
    last = now;
    if (dirty) { retarget(); dirty = false; } // scroll and layout changes are handled once per frame
    let moving = false;
    const k = reduced ? 1 : 1 - Math.exp(-dt / 90); // 90ms ease toward the target clearance
    for (let n = 0; n < clear.length; n++) {
      const d = target[n] - clear[n];
      if (d > 0.002 || d < -0.002) { clear[n] += d * k; moving = true; } else clear[n] = target[n];
    }
    draw();
    if (moving) schedule();
  }
  function schedule() { if (ready && !raf) raf = requestAnimationFrame(frame); }

  let builtW = 0, builtH = 0;
  const yieldToBrowser = () => new Promise(r => setTimeout(r));
  async function rebuild() {
    const id = ++building;                         // a newer rebuild cancels this one
    dark = !isDay();
    try { photo = await loadPhoto(dark ? 'dark' : 'light'); } catch (e) { canvas.style.display = 'none'; return; }
    if (id !== building) return;
    canvas.style.display = '';
    ready = false;                                 // no frames until the new lattice is complete
    if (!(await layout(id))) return;               // sliced into short tasks
    measure(); dirty = true; retarget(); dirty = false;
    builtW = innerWidth; builtH = innerHeight;
    clear.set(target);                             // no ease on a fresh build
    await yieldToBrowser(); if (id !== building) return;
    ready = true;
    draw();
    if (risePending) { risePending = false; startRise(); }
  }

  // first visit in a tab: the finished picture is revealed from the bottom up by a css mask,
  // so the animation costs the main thread nothing
  function startRise() {
    canvas.classList.add('rise');
    canvas.addEventListener('animationend', () => canvas.classList.remove('rise'), { once: true });
  }

  // each debounced task has its own timer: a shared one let a DOM change cancel a pending resize rebuild
  const later = fn => { let timer; return () => { clearTimeout(timer); timer = setTimeout(fn, 150); }; };
  const relayout = () => { if (!ready) return; measure(); dirty = true; schedule(); };
  const idle = fn => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 100);
  // a mobile address bar sliding away changes the height a little; that is not worth a rebuild
  const resized = () => { if (innerWidth !== builtW || Math.abs(innerHeight - builtH) > 150) rebuild(); };

  window.addEventListener('themechange', rebuild);
  const relayoutSoon = later(relayout); // the DOM and size observers share this, so a burst of changes is one re-measure
  window.addEventListener('resize', later(resized));
  window.addEventListener('relayout', relayout);
  window.addEventListener('scroll', () => { if (ready) { dirty = true; schedule(); } }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  new MutationObserver(relayoutSoon).observe(document.body, { childList: true, subtree: true, characterData: true });
  if (window.ResizeObserver) new ResizeObserver(relayoutSoon).observe(document.querySelector('main') || document.body);

  // first visit in a tab: the page fills in from the bottom up, once
  try {
    if (!reduced && !sessionStorage.getItem('rise')) {
      sessionStorage.setItem('rise', '1');
      risePending = true;
    }
  } catch (e) { /* storage blocked: no rise */ }

  // start after first paint, never before it
  const start = () => idle(rebuild);
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
})();
