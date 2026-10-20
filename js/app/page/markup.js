/* Markup for editable text on the page. Every field is a contenteditable span carrying data-ek; ui.eds maps that key to the field it edits. */
import Core from '../../resume/core.js';
import { ui } from '../state.js';

const { esc } = Core;

// Every field shown on the page is a contenteditable span carrying data-ek; ui.eds maps that key to the field it edits.
const PLAIN = (() => { try { const d = document.createElement('div'); d.contentEditable = 'plaintext-only'; return d.contentEditable === 'plaintext-only'; } catch (e) { return false; } })();
export const LATE = ['dur', 'skills', 'hobbies']; // parsed when the field is left, not on every key
const edKey = ed => ed.ek || (ed.k ? 'k:' + ed.k : ed.sec + ':' + ed.id + ':' + ed.f);
export function edSpan(ed, inner) {
  const ek = edKey(ed); ui.eds[ek] = ed;
  const ce = ed.kind === 'rich' || !PLAIN ? 'true' : 'plaintext-only';
  return `<span data-ek="${esc(ek)}" contenteditable="${ce}" data-ph="${esc(ed.ph || '')}">${inner}</span>`;
}
function rh(runs) {
  return runs.map(r => {
    let s = r.ed ? esc(r.ed.pre || '') + edSpan(r.ed, esc(r.ed.v)) + esc(r.ed.post || '') : esc(r.t);
    if (r.sup) s = '<sup>' + s + '</sup>'; if (r.b) s = '<b>' + s + '</b>'; if (r.i) s = '<i>' + s + '</i>'; if (r.link) s = '<span class="hl"' + (r.color ? ' style="color:#' + r.color + '"' : '') + '>' + s + '</span>';
    return s;
  }).join('');
}
export function lineHTML(l) {
  const mt = l.before ? ' style="margin-top:5.33px"' : '', gh = l.ghost ? ' ghost' : '';
  if (l.kind === 'skill') return `<div class="ln bl sk${gh}"${mt}><b>${esc(l.label)}</b><span>${edSpan(l.ed, esc(l.value))}</span></div>`;
  const left = l.ed ? edSpan(l.ed, l.ed.v ? rh(l.left) : '') : rh(l.left);
  return `<div class="ln ${l.bullet ? 'bl' : 'ct'}${gh}"${mt}><span class="l">${left}</span>${l.right ? `<span class="r">${rh(l.right)}</span>` : ''}</div>`;
}
