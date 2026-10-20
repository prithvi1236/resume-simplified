/* Zoom on edit: the entry being edited is enlarged in place. */
import { $ } from '../dom.js';
import { ui } from '../state.js';
import { fitPreview } from './render.js';

// Scale the zoomed entry to about 1.6x real size on screen, but never wider than the visible area,
// and push what follows down by the height the scaling adds. On a screen too narrow to show the entry
// at a readable size (phones), enlarge it to 1.25x anyway, keeping its line breaks, and let the page box
// scroll sideways ("pan") so the caret stays in view.
export function fitZoom(s) {
  const box = $('#pvbox'), el = $('#sheet').querySelector('.pg:not(.meas) .zm:not(.pg)');
  if (!el) { box.classList.remove('pan'); box.scrollLeft = 0; return; }
  const wrap = $('#pvwrap'), cs = getComputedStyle(wrap), avail = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 12;
  const fit = avail / ((el.offsetWidth + 8) * s), pan = s * fit < 0.95;
  const z = pan ? 1.25 / s : Math.max(1, Math.min(1.6 / s, fit));
  box.classList.toggle('pan', pan);
  el.style.transformOrigin = pan ? '0 0' : '';
  el.style.marginTop = pan ? 5 * z + 2 + 'px' : ''; // room for the scaled outline above
  el.style.transform = `scale(${z})`; el.style.marginBottom = el.offsetHeight * (z - 1) + (pan ? 5 * z + 2 : 6) + 'px';
}
/* While panning, scroll the page box sideways so the caret stays in view. */
export function followCaret() {
  const box = $('#pvbox'); if (!box.classList.contains('pan')) return;
  const a = document.activeElement; if (!a || !a.closest('.zm')) return;
  const sel = getSelection(), rng = sel.rangeCount && sel.getRangeAt(0);
  if (!rng || !a.contains(rng.endContainer)) return;
  let r = rng.getClientRects()[0];
  if (!r) { // a caret between elements (e.g. at the very start of a field) has no rect: use that edge of the field
    const f = a.getBoundingClientRect(), pre = document.createRange(); pre.selectNodeContents(a); pre.setEnd(rng.endContainer, rng.endOffset);
    r = pre.toString() ? { left: f.right - 1, right: f.right } : { left: f.left, right: f.left + 1 };
  }
  const b = box.getBoundingClientRect(), pad = 32;
  if (r.right > b.right - pad) box.scrollLeft += r.right - b.right + pad * 2;
  else if (r.left < b.left + pad) box.scrollLeft -= b.left + pad * 2 - r.left;
}
/* Enlarge one entry in place (key 'sec:id'), or none. Toggles classes only, so the field being typed in keeps its caret. */
export function setZoom(key) {
  ui.zoom = key || null;
  const sheet = $('#sheet');
  sheet.querySelectorAll('.zm').forEach(el => { el.classList.remove('zm'); el.style.transform = el.style.marginBottom = el.style.marginTop = el.style.transformOrigin = ''; });
  const el = ui.zoom && Array.from(sheet.querySelectorAll('.pg:not(.meas) .it, .pg:not(.meas) .hd')).find(x => x.dataset.sec + ':' + x.dataset.id === ui.zoom);
  if (el) { el.classList.add('zm'); el.closest('.pg').classList.add('zm'); }
  fitPreview();
  if (el) { const a = document.activeElement; (el.contains(a) ? a : el).scrollIntoView({ block: 'nearest', inline: 'nearest' }); followCaret(); }
}
export function setAutoZoom(on) {
  ui.autoZoom = on;
  const b = $('#zoomBtn'); b.textContent = 'Zoom on edit: ' + (on ? 'On' : 'Off'); b.setAttribute('aria-pressed', on);
  try { localStorage.setItem('resumedesk.zoom', on ? 'on' : 'off'); } catch (e) { /* per-browser nicety only */ }
  if (!on) setZoom(null);
}
