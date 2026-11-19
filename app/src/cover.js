// PosterForge cover engine: multi-panel GTA-style poster layouts, colour grades,
// posterise/duotone, bold display caption, grain + vignette, exact-size export.
// All drawing is plain Canvas 2D, client-side, no network.

// Panel polygons in normalised 0..1 coordinates. Each layout tiles the whole
// canvas; thin light gutters are stroked over the seams afterwards.
export const LAYOUTS = {
  star: {
    label: 'Star — 5 panels',
    panels: [
      [[0, 0], [0.52, 0], [0.44, 0.34], [0, 0.34]],
      [[0.52, 0], [1, 0], [1, 0.34], [0.44, 0.34]],
      [[0, 0.34], [1, 0.34], [1, 0.70], [0, 0.70]],
      [[0, 0.70], [0.48, 0.70], [0.56, 1], [0, 1]],
      [[0.48, 0.70], [1, 0.70], [1, 1], [0.56, 1]],
    ],
  },
  grid: {
    label: 'Hero Grid — 6 panels',
    panels: [
      [[0, 0], [0.58, 0], [0.58, 0.66], [0, 0.66]],
      [[0.58, 0], [1, 0], [1, 0.33], [0.58, 0.33]],
      [[0.58, 0.33], [1, 0.33], [1, 0.66], [0.58, 0.66]],
      [[0, 0.66], [0.34, 0.66], [0.34, 1], [0, 1]],
      [[0.34, 0.66], [0.67, 0.66], [0.67, 1], [0.34, 1]],
      [[0.67, 0.66], [1, 0.66], [1, 1], [0.67, 1]],
    ],
  },
  diagonal: {
    label: 'Diagonal — 4 slashes',
    panels: [
      [[0, 0], [0.40, 0], [0.27, 1], [0, 1]],
      [[0.40, 0], [0.64, 0], [0.51, 1], [0.27, 1]],
      [[0.64, 0], [0.87, 0], [0.74, 1], [0.51, 1]],
      [[0.87, 0], [1, 0], [1, 1], [0.74, 1]],
    ],
  },
  magazine: {
    label: 'Magazine — 5 panels',
    panels: [
      [[0, 0], [1, 0], [1, 0.52], [0, 0.52]],
      [[0, 0.52], [0.33, 0.52], [0.33, 0.78], [0, 0.78]],
      [[0.33, 0.52], [0.67, 0.52], [0.67, 0.78], [0.33, 0.78]],
      [[0.67, 0.52], [1, 0.52], [1, 0.78], [0.67, 0.78]],
      [[0, 0.78], [1, 0.78], [1, 1], [0, 1]],
    ],
  },
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.35) contrast(1.12) brightness(1.02)',
    overlay: [[0, 'rgba(64,16,96,0.28)'], [0.55, 'rgba(255,94,58,0.10)'], [1, 'rgba(255,45,120,0.42)']],
    mode: 'soft-light', duo: ['#2a0a3e', '#ffb35c'], accent: '#ffd23f',
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.5) contrast(1.18) brightness(0.98)',
    overlay: [[0, 'rgba(0,229,255,0.16)'], [0.5, 'rgba(20,0,60,0.18)'], [1, 'rgba(255,0,170,0.38)']],
    mode: 'soft-light', duo: ['#060a2e', '#4df3ff'], accent: '#ff2ea6',
  },
  golden: {
    label: 'Golden Hour',
    filter: 'saturate(1.22) contrast(1.08) brightness(1.07) sepia(0.22)',
    overlay: [[0, 'rgba(255,190,60,0.14)'], [1, 'rgba(150,60,10,0.34)']],
    mode: 'soft-light', duo: ['#33150a', '#ffe29a'], accent: '#ffffff',
  },
  noir: {
    label: 'Noir',
    filter: 'saturate(0.25) contrast(1.32) brightness(1.0)',
    overlay: [[0, 'rgba(0,0,0,0.10)'], [1, 'rgba(0,0,0,0.48)']],
    mode: 'multiply', duo: ['#050505', '#f2f2f2'], accent: '#e8e8e8',
  },
};

export const EXPORT_SIZES = [
  { id: 'sq', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export function defaultState() {
  return {
    layout: 'star', grade: 'sunset', mode: 'multi', posterise: true,
    grain: true, vignette: true, showSafe: false,
    caption: 'VICE SUNSET', sub: 'LEONIDA NIGHTS',
    titleSize: 1, titleColor: '#ffffff', outlineColor: '#160a24',
    panelPhoto: {}, panelView: {},
  };
}

function polyPath(ctx, poly, w, h) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
  ctx.closePath();
}
function bbox(poly) {
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Posterise + duotone one panel image into an offscreen canvas at bbox size.
function posterised(img, bw, bh, view, grade) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(bw)); c.height = Math.max(2, Math.round(bh));
  const x = c.getContext('2d', { willReadFrequently: true });
  drawCoverFit(x, img, c.width, c.height, view, 'none');
  const data = x.getImageData(0, 0, c.width, c.height);
  const [dr, dg, db] = hexRgb(grade.duo[0]), [lr, lg, lb] = hexRgb(grade.duo[1]);
  const levels = 5;
  for (let i = 0; i < data.data.length; i += 4) {
    const lum = (0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2]) / 255;
    const q = Math.round(lum * (levels - 1)) / (levels - 1);
    const t = Math.pow(q, 0.9);
    const pr = Math.round(data.data[i] / 255 * (levels - 1)) / (levels - 1) * 255;
    const pg = Math.round(data.data[i + 1] / 255 * (levels - 1)) / (levels - 1) * 255;
    const pb = Math.round(data.data[i + 2] / 255 * (levels - 1)) / (levels - 1) * 255;
    data.data[i] = pr * 0.45 + (dr + (lr - dr) * t) * 0.55;
    data.data[i + 1] = pg * 0.45 + (dg + (lg - dg) * t) * 0.55;
    data.data[i + 2] = pb * 0.45 + (db + (lb - db) * t) * 0.55;
  }
  x.putImageData(data, 0, 0);
  return c;
}

// Draw img covering a w×h box, honouring per-panel zoom (view.z) and drag offset (view.x/y in -1..1).
export function drawCoverFit(ctx, img, w, h, view = {}, filter = 'none') {
  if (!img) { ctx.fillStyle = '#241335'; ctx.fillRect(0, 0, w, h); return; }
  const z = view.z || 1, scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * z;
  const pw = img.naturalWidth * scale, ph = img.naturalHeight * scale;
  const dx = (w - pw) / 2 + (view.x || 0) * w * 0.25;
  const dy = (h - ph) / 2 + (view.y || 0) * h * 0.25;
  ctx.save();
  if (filter !== 'none') ctx.filter = filter;
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

let grainTile = null;
function makeGrain() {
  grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 140;
  const x = grainTile.getContext('2d'), d = x.createImageData(140, 140);
  let seed = 42;
  for (let i = 0; i < d.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = seed % 256; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
}

function drawCaption(ctx, w, h, state, grade) {
  const title = (state.caption || '').trim().toUpperCase();
  const sub = (state.sub || '').trim().toUpperCase();
  const band = ctx.createLinearGradient(0, 0, 0, h * 0.30);
  band.addColorStop(0, 'rgba(8,2,18,0.72)'); band.addColorStop(1, 'rgba(8,2,18,0)');
  ctx.fillStyle = band; ctx.fillRect(0, 0, w, h * 0.30);
  if (title) {
    let size = h * 0.115 * state.titleSize;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const setFont = s => { ctx.font = `${s}px Anton, 'Arial Narrow Bold', sans-serif`; };
    setFont(size);
    let lines = [title];
    if (ctx.measureText(title).width > w * 0.92) {
      const words = title.split(/\s+/), mid = Math.ceil(words.length / 2);
      lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
      size *= 0.82; setFont(size);
    }
    while (lines.some(l => ctx.measureText(l).width > w * 0.94) && size > 14) { size -= 3; setFont(size); }
    lines.forEach((line, i) => {
      const y = h * 0.035 + i * size * 1.04;
      ctx.lineWidth = size * 0.16; ctx.strokeStyle = state.outlineColor; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = size * 0.07;
      ctx.strokeText(line, w / 2, y);
      ctx.shadowOffsetY = 0; ctx.fillStyle = state.titleColor; ctx.fillText(line, w / 2, y);
      if (i === lines.length - 1) {
        const tw = ctx.measureText(line).width;
        ctx.fillStyle = grade.accent; ctx.fillRect(w / 2 - tw / 2, y + size * 1.08, tw, Math.max(3, size * 0.07));
      }
    });
  }
  if (sub) {
    let size = h * 0.042;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `${size}px Anton, 'Arial Narrow Bold', sans-serif`;
    while (ctx.measureText(sub).width > w * 0.86 && size > 10) { size -= 2; ctx.font = `${size}px Anton, sans-serif`; }
    const y = h * 0.965;
    ctx.lineWidth = size * 0.18; ctx.strokeStyle = state.outlineColor; ctx.lineJoin = 'round';
    ctx.strokeText(sub, w / 2, y);
    ctx.fillStyle = '#ffffff'; ctx.fillText(sub, w / 2, y);
  }
}

/** Draw the full cover onto ctx at w×h from state + photos (array of HTMLImageElement). */
export function drawCover(ctx, w, h, state, photos) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.star;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#160a24'; ctx.fillRect(0, 0, w, h);
  layout.panels.forEach((poly, i) => {
    const b = bbox(poly), bw = b.w * w, bh = b.h * h;
    const idx = state.mode === 'single' ? 0 : (state.panelPhoto[i] ?? (photos.length ? i % photos.length : 0));
    const img = photos[idx] || null;
    const view = state.panelView[i] || {};
    ctx.save(); polyPath(ctx, poly, w, h); ctx.clip();
    ctx.translate(b.x * w, b.y * h);
    if (img && state.posterise) {
      const tile = posterised(img, bw, bh, view, grade);
      ctx.filter = grade.filter; ctx.drawImage(tile, 0, 0); ctx.filter = 'none';
    } else {
      drawCoverFit(ctx, img, bw, bh, view, grade.filter);
    }
    const g = ctx.createLinearGradient(0, 0, 0, bh);
    grade.overlay.forEach(([stop, col]) => g.addColorStop(stop, col));
    ctx.globalCompositeOperation = grade.mode; ctx.fillStyle = g; ctx.fillRect(0, 0, bw, bh);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  });
  ctx.strokeStyle = 'rgba(255,248,235,0.96)'; ctx.lineWidth = Math.max(4, w * 0.006); ctx.lineJoin = 'round';
  layout.panels.forEach(poly => { polyPath(ctx, poly, w, h); ctx.stroke(); });
  ctx.strokeStyle = '#0d0518'; ctx.lineWidth = Math.max(6, w * 0.010); ctx.strokeRect(0, 0, w, h);
  if (state.vignette) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(5,0,12,0.42)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  }
  drawCaption(ctx, w, h, state, grade);
  if (state.grain) {
    if (!grainTile) makeGrain();
    ctx.save(); ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(grainTile, 'repeat'); ctx.fillStyle = pat; ctx.fillRect(0, 0, w, h); ctx.restore();
  }
  if (state.showSafe) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,0,0.8)'; ctx.setLineDash([14, 10]); ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88); ctx.restore();
  }
}

/** Render an exact-size PNG blob for export. */
export function exportCover(state, photos, size) {
  const c = document.createElement('canvas'); c.width = size.w; c.height = size.h;
  const clean = { ...state, showSafe: false };
  drawCover(c.getContext('2d'), size.w, size.h, clean, photos);
  return new Promise(res => c.toBlob(res, 'image/png'));
}
