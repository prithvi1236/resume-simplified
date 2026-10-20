/* Entry point: wires the top bar, loads fonts and saved data, then draws the app. */
import ResumeFonts from '../resume/fonts.js';
import { $ } from './dom.js';
import { state, ui, normalize, setState } from './state.js';
import { Store } from './store.js';
import { touch, History } from './history.js';
import { renderAll, setView, setPanel, goto } from './layout.js';
import { download } from './files.js';
import { addSkill, addHobby, onInput, onChange, onClick } from './editor/events.js';
import { renderPreview, fitPreview } from './page/render.js';
import { setZoom, setAutoZoom, followCaret } from './page/zoom.js';
import { addTo } from './page/select.js';
import { wireSheet } from './page/wire.js';

function wire() {
  const ed = $('#editor');
  ed.addEventListener('input', onInput); ed.addEventListener('change', onChange); ed.addEventListener('click', onClick);
  $('#nav').addEventListener('click', onClick);
  ed.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (e.target.dataset.skin) { e.preventDefault(); addSkill(e.target.dataset.skin, e.target.value); }
    if (e.target.hasAttribute('data-hobin')) { e.preventDefault(); addHobby(e.target.value); }
  });
  $('#verSel').addEventListener('change', e => { state.activeVersion = e.target.value; touch(); renderAll(); });
  $('#dl').addEventListener('click', () => download(null, 'docx'));
  $('#undo').addEventListener('click', () => History.step(true));
  $('#redo').addEventListener('click', () => History.step(false));
  // App-wide undo, also on page fields and form inputs, so one shortcut always walks the same history.
  document.addEventListener('keydown', e => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'y') { e.preventDefault(); History.step(k === 'z' && !e.shiftKey); }
  });
  document.addEventListener('beforeinput', e => {
    if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') { e.preventDefault(); History.step(e.inputType === 'historyUndo'); }
  });
  $('#dlpdf').addEventListener('click', () => download(null, 'pdf'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.zoom) setZoom(null); });
  $('#zoomBtn').addEventListener('click', () => setAutoZoom(!ui.autoZoom));
  document.addEventListener('selectionchange', followCaret);
  wireSheet();
  $('#addbar').addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (b) addTo(b.dataset.add); });
  $('#panelBtn').addEventListener('click', () => setPanel(document.body.dataset.panel === 'off'));
  $('#chk').addEventListener('click', () => goto('check'));
  document.querySelectorAll('[data-view-btn]').forEach(b => b.addEventListener('click', () => setView(b.dataset.viewBtn)));
  window.addEventListener('resize', () => fitPreview());
  if (window.ResizeObserver) new ResizeObserver(() => fitPreview()).observe($('#pvwrap'));
}
function loadFonts() {
  try {
    const F = ResumeFonts; if (!window.FontFace) return;
    const map = { normal: ['400', 'normal'], bold: ['700', 'normal'], italic: ['400', 'italic'], bolditalic: ['700', 'italic'] };
    Object.keys(F).forEach(k => {
      const bin = Uint8Array.from(atob(F[k]), c => c.charCodeAt(0));
      new FontFace('ResumeSim', bin.buffer, { weight: map[k][0], style: map[k][1] }).load().then(f => { document.fonts.add(f); renderPreview(); }).catch(() => {});
    });
  } catch (e) { /* preview keeps fallback font */ }
}
// iOS Safari zooms the whole page in when a field with text under 16px gets focus, and stays zoomed.
// The page already enlarges the entry being edited, so turn that off there (pinch zoom still works on iOS).
function noFocusZoom() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const m = document.querySelector('meta[name="viewport"]');
  if (ios && m && !/maximum-scale/.test(m.content)) m.content += ', maximum-scale=1';
}
async function boot() {
  noFocusZoom();
  loadFonts();
  if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdf.worker.min.js', import.meta.url).href;
  let panel = 'on'; try { panel = localStorage.getItem('resumedesk.panel') || 'on'; } catch (e) { /* default */ }
  document.body.dataset.panel = panel; $('#panelBtn').textContent = panel === 'off' ? 'Show details' : 'Hide details';
  let zoom = 'on'; try { zoom = localStorage.getItem('resumedesk.zoom') || 'on'; } catch (e) { /* default */ }
  setAutoZoom(zoom === 'on');
  setView('page');
  wire(); renderAll();
  await Store.init();
  const saved = await Store.load();
  let loaded = null;
  if (saved) { try { loaded = normalize(saved); } catch (e) { loaded = null; } }
  if (loaded) setState(loaded);
  ui.ready = true; ui.save = Store.mode === 'memory' ? 'memory' : 'saved';
  History.reset();
  document.body.dataset.ready = '1';
  if (!Store.dl) { $('#dl').title = $('#dlpdf').title = 'Downloads are not available in this view'; }
  renderAll();
}

boot();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js'); });
}
