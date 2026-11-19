// Fixed scenes for screenshots. Query params:
// ?shot=cover|editor&layout=star|grid|diagonal|magazine&grade=sunset|neon|golden|noir
// &caption=..&sub=..&mode=multi|single&posterise=0|1&size=sq|portrait|wide
// Samples alternate across panels in multi mode. window.__shotReady fires after
// the display font and both sample photos load and two frames have painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  await apply(query);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
