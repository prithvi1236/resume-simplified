/* Zoom on edit: the entry being edited is enlarged in place. */
import { $ } from '../dom.js';
import { ui } from '../state.js';
import { fitPreview } from './render.js';

// Scale the zoomed entry to about 1.6x real size on screen, but never wider than the visible area,
// and push what follows down by the height the scaling adds.
export function fitZoom(s) {
  const el = $('#sheet').querySelector('.pg:not(.meas) .zm:not(.pg)'); if (!el) return;
  const wrap = $('#pvwrap'), cs = getComputedStyle(wrap), avail = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 12;
  const z = Math.max(1, Math.min(1.6 / s, avail / ((el.offsetWidth + 8) * s)));
  el.style.transform = `scale(${z})`; el.style.marginBottom = el.offsetHeight * (z - 1) + 6 + 'px';
}
/* Enlarge one entry in place (key 'sec:id'), or none. Toggles classes only, so the field being typed in keeps its caret. */
export function setZoom(key) {
  ui.zoom = key || null;
  const sheet = $('#sheet');
  sheet.querySelectorAll('.zm').forEach(el => { el.classList.remove('zm'); el.style.transform = el.style.marginBottom = ''; });
  const el = ui.zoom && Array.from(sheet.querySelectorAll('.pg:not(.meas) .it, .pg:not(.meas) .hd')).find(x => x.dataset.sec + ':' + x.dataset.id === ui.zoom);
  if (el) { el.classList.add('zm'); el.closest('.pg').classList.add('zm'); }
  fitPreview();
  if (el) { const a = document.activeElement; (el.contains(a) ? a : el).scrollIntoView({ block: 'nearest' }); }
}
export function setAutoZoom(on) {
  ui.autoZoom = on;
  const b = $('#zoomBtn'); b.textContent = 'Zoom on edit: ' + (on ? 'On' : 'Off'); b.setAttribute('aria-pressed', on);
  try { localStorage.setItem('resumedesk.zoom', on ? 'on' : 'off'); } catch (e) { /* per-browser nicety only */ }
  if (!on) setZoom(null);
}
