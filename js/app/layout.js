/* Redrawing the whole app, and switching between the page and details views. */
import Core from '../resume/core.js';
import { $ } from './dom.js';
import { state, ui } from './state.js';
import { touch, paintStatus } from './history.js';
import { refreshLint, paintNav, paintIssues } from './issues.js';
import { renderEditor } from './editor/render.js';
import { renderPreview, fitPreview } from './page/render.js';

const { esc } = Core;

export function renderTop() {
  const s = $('#verSel');
  s.innerHTML = state.versions.map(v => `<option value="${v.id}" ${v.id === state.activeVersion ? 'selected' : ''}>${esc(v.name)}</option>`).join('');
}
function light() { refreshLint(); paintNav(); paintIssues(); renderPreview(); }
export function renderAll() { refreshLint(); renderTop(); paintNav(); renderEditor(); renderPreview(); paintStatus(); }
export function changed() { touch(); light(); if (ui.sec === 'check') renderEditor(); }
export function setView(v) {
  document.body.dataset.view = v;
  document.querySelectorAll('[data-view-btn]').forEach(b => b.classList.toggle('on', b.dataset.viewBtn === v));
  fitPreview();
}
export function setPanel(on) {
  document.body.dataset.panel = on ? 'on' : 'off';
  const b = $('#panelBtn'); b.textContent = on ? 'Hide details' : 'Show details'; b.setAttribute('aria-pressed', on);
  try { localStorage.setItem('resumedesk.panel', on ? 'on' : 'off'); } catch (e) { /* per-browser nicety only */ }
  fitPreview();
}
export function goto(sec, id) {
  ui.sec = sec; if (id) ui.open.add(id);
  if (document.body.dataset.panel === 'off') setPanel(true);
  renderAll(); setView('panel');
  const t = id && document.getElementById('c-' + id); if (t) t.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
