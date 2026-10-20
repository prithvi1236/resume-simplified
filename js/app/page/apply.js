/* Writing text typed on the page back into the resume state. */
import Core from '../../resume/core.js';
import { $ } from '../dom.js';
import { state, ui, LIST_SECS, curVer, find, setPath, getPath } from '../state.js';
import { CFG, segOpts } from '../editor/lists.js';

function richText(el) {
  const out = [];
  (function walk(n, b) {
    n.childNodes.forEach(c => {
      if (c.nodeType === 3) { out.push([c.nodeValue, b]); return; }
      if (c.nodeType !== 1) return;
      if (c.tagName === 'BR') { out.push([' ', b]); return; }
      let nb = b; if (c.tagName === 'B' || c.tagName === 'STRONG') nb = true;
      const fw = c.style && c.style.fontWeight; if (fw) nb = fw === 'bold' || fw === 'bolder' || +fw >= 600;
      walk(c, nb);
    });
  })(el, false);
  let s = '', cur = false;
  out.forEach(([t, b]) => { t = t.replace(/ /g, ' ').replace(/\*\*/g, '').replace(/\n/g, ' '); if (!t) return; if (b !== cur) { s += '**'; cur = b; } s += t; });
  return cur ? s + '**' : s;
}
export const readEd = (el, ed) => ed.kind === 'rich' ? richText(el) : el.textContent.replace(/ /g, ' ').replace(/\n/g, ' ');
function parseDur(t, unit) {
  t = t.trim(); if (!t) return { dNum: '' };
  if (/^ongoing$/i.test(t)) return { dUnit: 'Ongoing' };
  const m = /^(\d+)\s*([a-z]*)\.?$/i.exec(t); if (!m) return null;
  const u = m[2].toLowerCase();
  if (/^y/.test(u)) return { dNum: String(+m[1] * 12), dUnit: 'Months' };
  const U = !u ? (unit === 'Ongoing' ? 'Months' : unit) : /^d/.test(u) ? 'Days' : /^w/.test(u) ? 'Weeks' : /^m/.test(u) ? 'Months' : null;
  return U ? { dNum: m[1], dUnit: U } : null;
}
const splitList = (t, fix) => Array.from(new Set(String(t).split(',').map(x => Core.titleCase(fix ? fix(x.trim()) : x.trim())).filter(Boolean)));
// Write one field from the page into the state. Returns false when the text could not be understood.
export function applyEd(ed, text) {
  const ver = curVer();
  switch (ed.kind) {
    case 'skills': { const list = splitList(text), pool = state.master.skills[ed.g]; ver.skills[ed.g] = list; list.forEach(x => { if (!pool.includes(x)) pool.push(x); }); return true; }
    case 'hobbies': { state.master.hobbies = splitList(text, x => x.replace(/\.$/, '')); if (state.master.hobbies.length) ver.hobbies = true; return true; }
    case 'dur': { const it = find(ed.sec, ed.id); if (!it) return true; const d = parseDur(text, it.dUnit); if (!d) return false; Object.assign(it, d); return true; }
  }
  if (ed.k) { let v = text; if (ed.dflt != null && (!v.trim() || v.trim() === ed.dflt)) v = ''; setPath(state.master, ed.k, v); return true; }
  const it = find(ed.sec, ed.id); if (it) it[ed.f] = text;
  return true;
}
// Mirror a page edit into the matching side-panel field without redrawing the panel.
export function syncPanel(ed) {
  const ed2 = $('#editor'), q = ed.k ? `[data-k="${ed.k}"]` : `[data-sec="${ed.sec}"][data-id="${ed.id}"][data-f="${ed.f}"]`;
  const inp = ed2.querySelector(q);
  if (inp && inp !== document.activeElement) inp.value = ed.k ? getPath(state.master, ed.k) : find(ed.sec, ed.id)[ed.f];
  if (!ed.k && LIST_SECS.includes(ed.sec)) {
    const it = find(ed.sec, ed.id), card = it && document.getElementById('c-' + ed.id); if (!card) return;
    const tt = card.querySelector('.ctitle'); if (tt) tt.textContent = CFG[ed.sec].nm(it);
    const ls = card.querySelector('[data-linksel]'); if (ls && ed.f === 'text') ls.innerHTML = segOpts(Core.boldSegments(it.text), it.linkIdx);
  }
}
export function paintSheetMarks() {
  const L = ui.lint;
  $('#sheet').querySelectorAll('.it').forEach(el => {
    const iss = L.byItem[el.dataset.sec + ':' + el.dataset.id];
    el.classList.toggle('bad', !!iss && iss.some(i => i.lvl === 'err')); el.classList.toggle('warn', !!iss && !iss.some(i => i.lvl === 'err'));
    if (iss) el.title = iss.map(i => i.msg).join(' '); else el.removeAttribute('title');
  });
}
