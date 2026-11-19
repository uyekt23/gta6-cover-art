// PosterForge UI: photo loading (picker + drag-and-drop), per-panel assignment
// and positioning (sliders or dragging on the preview), grades, caption styling,
// Surprise me, and exact-size PNG export. A ?shot= query builds a fixed scene.
import { LAYOUTS, GRADES, EXPORT_SIZES, defaultState, drawCover, exportCover } from './cover.js';
import { runShot } from './shots.js';

const $ = id => document.getElementById(id);
const canvas = $('cover'), ctx = canvas.getContext('2d');
const state = defaultState();
let photos = [];            // HTMLImageElement[]
let photoNames = [];
let selectedPanel = 0;
let currentSize = EXPORT_SIZES[0];

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  canvas.width = currentSize.w; canvas.height = currentSize.h;
  drawCover(ctx, canvas.width, canvas.height, state, photos);
  $('sizeHint').textContent = `Export size: ${currentSize.w} × ${currentSize.h}px PNG — preview is that exact render.`;
}

function fillSelect(el, entries, value) {
  el.innerHTML = '';
  entries.forEach(([v, label]) => {
    const o = document.createElement('option'); o.value = v; o.textContent = label; el.appendChild(o);
  });
  el.value = value;
}
function refreshPanelControls() {
  const n = LAYOUTS[state.layout].panels.length;
  if (selectedPanel >= n) selectedPanel = 0;
  fillSelect($('panel'), Array.from({ length: n }, (_, i) => [String(i), `Panel ${i + 1}`]), String(selectedPanel));
  fillSelect($('panelPhoto'),
    photos.length ? photos.map((_, i) => [String(i), photoNames[i] || `Photo ${i + 1}`]) : [['0', '(no photo yet)']],
    String(state.panelPhoto[selectedPanel] ?? (photos.length ? selectedPanel % photos.length : 0)));
  const v = state.panelView[selectedPanel] || {};
  $('zoom').value = v.z || 1; $('shiftX').value = v.x || 0; $('shiftY').value = v.y || 0;
}
function refreshThumbs() {
  const t = $('thumbs'); t.innerHTML = '';
  photos.forEach(img => { const c = img.cloneNode(); c.src = img.src; t.appendChild(c); });
}
async function addFiles(files) {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    photos.push(await loadImage(URL.createObjectURL(f)));
    photoNames.push(f.name);
  }
  refreshPanelControls(); refreshThumbs(); redraw();
  if (photos.length) $('status').textContent = `${photos.length} photo(s) loaded — panels filled.`;
}

function view() {
  return (state.panelView[selectedPanel] ??= {});
}
function bind() {
  fillSelect($('layout'), Object.entries(LAYOUTS).map(([k, v]) => [k, v.label]), state.layout);
  fillSelect($('grade'), Object.entries(GRADES).map(([k, v]) => [k, v.label]), state.grade);
  fillSelect($('size'), EXPORT_SIZES.map(s => [s.id, s.label]), currentSize.id);
  $('layout').addEventListener('change', e => { state.layout = e.target.value; state.panelPhoto = {}; state.panelView = {}; refreshPanelControls(); redraw(); });
  $('grade').addEventListener('change', e => { state.grade = e.target.value; redraw(); });
  $('mode').addEventListener('change', e => { state.mode = e.target.value; redraw(); });
  $('size').addEventListener('change', e => { currentSize = EXPORT_SIZES.find(s => s.id === e.target.value); redraw(); });
  $('panel').addEventListener('change', e => { selectedPanel = Number(e.target.value); refreshPanelControls(); });
  $('panelPhoto').addEventListener('change', e => { state.panelPhoto[selectedPanel] = Number(e.target.value); redraw(); });
  $('zoom').addEventListener('input', e => { view().z = Number(e.target.value); redraw(); });
  $('shiftX').addEventListener('input', e => { view().x = Number(e.target.value); redraw(); });
  $('shiftY').addEventListener('input', e => { view().y = Number(e.target.value); redraw(); });
  $('caption').addEventListener('input', e => { state.caption = e.target.value; redraw(); });
  $('sub').addEventListener('input', e => { state.sub = e.target.value; redraw(); });
  $('titleSize').addEventListener('input', e => { state.titleSize = Number(e.target.value); redraw(); });
  $('titleColor').addEventListener('input', e => { state.titleColor = e.target.value; redraw(); });
  $('outlineColor').addEventListener('input', e => { state.outlineColor = e.target.value; redraw(); });
  for (const id of ['posterise', 'grain', 'vignette', 'showSafe'])
    $(id).addEventListener('change', e => { state[id] = e.target.checked; redraw(); });
  $('photo').addEventListener('change', e => addFiles([...e.target.files]));
  const drop = $('drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); addFiles([...e.dataTransfer.files]); });
  // Drag on the preview positions the selected panel's photo.
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, v: { ...(state.panelView[selectedPanel] || {}) } }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    view().x = Math.max(-1, Math.min(1, (drag.v.x || 0) + (e.clientX - drag.x) / r.width * 2));
    view().y = Math.max(-1, Math.min(1, (drag.v.y || 0) + (e.clientY - drag.y) / r.height * 2));
    $('shiftX').value = view().x; $('shiftY').value = view().y; redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  $('surprise').addEventListener('click', () => {
    const lk = Object.keys(LAYOUTS), gk = Object.keys(GRADES);
    state.layout = lk[Math.floor(Math.random() * lk.length)];
    state.grade = gk[Math.floor(Math.random() * gk.length)];
    state.panelPhoto = {}; state.panelView = {};
    // Shuffle panel assignment for a fresh collage feel.
    const n = LAYOUTS[state.layout].panels.length;
    for (let i = 0; i < n; i++) if (photos.length > 1 && Math.random() < 0.6) state.panelPhoto[i] = Math.floor(Math.random() * photos.length);
    $('layout').value = state.layout; $('grade').value = state.grade;
    refreshPanelControls(); redraw();
    $('status').textContent = `Surprise: ${LAYOUTS[state.layout].label} + ${GRADES[state.grade].label}.`;
  });
  $('export').addEventListener('click', async () => {
    const blob = await exportCover(state, photos, currentSize);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `posterforge-${currentSize.w}x${currentSize.h}.png`;
    a.click();
    $('status').textContent = `Saved posterforge-${currentSize.w}x${currentSize.h}.png`;
  });
}

async function applyShot(query) {
  state.layout = query.get('layout') || 'star';
  state.grade = query.get('grade') || 'sunset';
  state.mode = query.get('mode') || 'multi';
  state.caption = query.get('caption') || 'VICE SUNSET';
  state.sub = query.get('sub') ?? 'LEONIDA NIGHTS';
  state.posterise = query.get('posterise') !== '0';
  const sz = EXPORT_SIZES.find(s => s.id === query.get('size'));
  if (sz) currentSize = sz;
  const pier = await loadImage('samples/pier.jpg');
  const boulevard = await loadImage('samples/boulevard.jpg');
  photos = [pier, boulevard]; photoNames = ['pier.jpg', 'boulevard.jpg'];
  try { await document.fonts.load('100px Anton'); await document.fonts.ready; } catch { /* fallback font */ }
  $('layout').value = state.layout; $('grade').value = state.grade; $('mode').value = state.mode;
  $('caption').value = state.caption; $('sub').value = state.sub; $('size').value = currentSize.id;
  refreshPanelControls(); refreshThumbs(); redraw();
}

bind();
refreshPanelControls();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), applyShot);
} else {
  // Friendly first paint: load both bundled samples so the maker is alive instantly.
  (async () => {
    try {
      photos = [await loadImage('samples/pier.jpg'), await loadImage('samples/boulevard.jpg')];
      photoNames = ['pier.jpg (sample)', 'boulevard.jpg (sample)'];
      try { await document.fonts.load('100px Anton'); } catch { /* ignore */ }
      refreshPanelControls(); refreshThumbs();
    } catch { /* samples optional */ }
    redraw();
  })();
}
