/* Selecting entries on the page, adding entries, and the per-entry margin buttons. */
import Core from '../../resume/core.js';
import { $, toast } from '../dom.js';
import { state, ui, SECS, LIST_SECS, curVer, find } from '../state.js';
import { touch } from '../history.js';
import { refreshLint, paintNav } from '../issues.js';
import { changed } from '../layout.js';
import { CFG } from '../editor/lists.js';
import { renderEditor } from '../editor/render.js';
import { moveIn } from '../editor/events.js';
import { renderPreview, queueRefresh } from './render.js';
import { setZoom } from './zoom.js';
import { focusEk } from './caret.js';

/* Point the side panel at whatever is selected on the page. */
export function showInPanel(sec, id) {
  const nav = { hobbies: 'achievements' }[sec] || sec, card = LIST_SECS.includes(sec) && find(sec, id) ? id : null;
  if (!SECS.some(x => x[0] === nav)) return;
  if (card) ui.open.add(card);
  ui.sec = nav; paintNav(); renderEditor();
  const ed = $('#editor'), near = q => { const x = ed.querySelector(q); return x && x.closest('.panel'); };
  const t = card ? document.getElementById('c-' + card) : sec === 'edu' ? ed.querySelector(`[data-key="edu:${id}"]`) : sec === 'refs' ? near('[data-k^="inst."]') : sec === 'hobbies' ? near('[data-hobin]') : null;
  if (t) t.scrollIntoView({ block: 'nearest' }); else ed.scrollTop = 0;
}
export function select(key) {
  if (ui.zoom && ui.zoom !== key) setZoom(null); // moving to another entry (or off the page) zooms back out
  if (ui.sel === key) return;
  ui.sel = key;
  $('#sheet').querySelectorAll('.it').forEach(el => el.classList.toggle('sel', el.dataset.sec + ':' + el.dataset.id === key));
  if (key) { const [sec, id] = key.split(':'); showInPanel(sec, id); }
  queueRefresh(); // shows or hides the selected entry's empty optional lines
}
export const keyOf = el => { const it = el.closest('[data-sec][data-id]'); return it ? it.dataset.sec + ':' + it.dataset.id : ''; };
export function addTo(sec) {
  const ver = curVer();
  if (sec === 'skills' || sec === 'hobbies') {
    ui.sel = sec === 'skills' ? 'skills:technical' : 'hobbies:hobbies';
    showInPanel(sec, sec === 'skills' ? 'technical' : 'hobbies'); renderPreview();
    focusEk(sec === 'skills' ? ['technical', 'soft', 'interests'].map(g => 'skills:' + g).find(k => !ver.skills[k.slice(7)].length) || 'skills:technical' : 'hobbies', true);
    return;
  }
  const it = Core.blankItem(sec); state.master[sec].push(it); ver.order[sec].push(it.id);
  ui.sel = sec + ':' + it.id; ui.open.add(it.id);
  touch(); refreshLint(); showInPanel(sec, it.id); renderPreview();
  const el = $('#sheet').querySelector(`.it[data-id="${it.id}"] [data-ek]`); if (el) focusEk(el.dataset.ek, true);
}
export function pageAction(btn) {
  const itEl = btn.closest('.it'), sec = itEl.dataset.sec, id = itEl.dataset.id, ver = curVer(), act = btn.dataset.pa;
  if (sec === 'hobbies') { ver.hobbies = false; ui.sel = ''; changed(); renderEditor(); toast('Hobbies hidden in "' + ver.name + '". Turn them back on under Achievements in the side panel.'); return; }
  const ord = ver.order[sec], i = ord.indexOf(id);
  if (act === 'up' || act === 'down') { moveIn(ord, i, act === 'up' ? -1 : 1); changed(); renderEditor(); return; }
  if (act === 'hide') { ver.order[sec] = ord.filter(x => x !== id); ui.sel = ''; changed(); renderEditor(); toast('Removed from "' + ver.name + '". It stays in your library under ' + CFG[sec].title + '.'); return; }
  // The armed state lives in ui (not on the button) because a page redraw can replace the button between the two clicks.
  if (act === 'del') {
    if (ui.armDel !== id) {
      ui.armDel = id; btn.classList.add('armed'); btn.textContent = 'Delete?';
      clearTimeout(ui.armT); ui.armT = setTimeout(() => { ui.armDel = null; queueRefresh(); }, 3200); return;
    }
    ui.armDel = null; clearTimeout(ui.armT);
    state.master[sec] = state.master[sec].filter(x => x.id !== id); state.versions.forEach(v => { v.order[sec] = v.order[sec].filter(x => x !== id); }); ui.sel = ''; changed(); renderEditor();
  }
}
