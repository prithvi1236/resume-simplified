/* Caret position inside editable page fields. */
import { $ } from '../dom.js';

export function caretOff(el) {
  const sel = window.getSelection(); if (!sel.rangeCount || !el.contains(sel.anchorNode)) return el.textContent.length;
  const r = sel.getRangeAt(0).cloneRange(), pre = document.createRange(); pre.selectNodeContents(el); pre.setEnd(r.endContainer, r.endOffset);
  return pre.toString().length;
}
export function setCaret(el, off) {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, acc = 0;
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  while ((n = w.nextNode())) { if (acc + n.nodeValue.length >= off) { r.setStart(n, off - acc); r.collapse(true); break; } acc += n.nodeValue.length; }
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
}
export function focusEk(ek, scroll) {
  const el = Array.from($('#sheet').querySelectorAll('[data-ek]')).find(x => x.dataset.ek === ek); if (!el) return;
  el.focus({ preventScroll: true }); setCaret(el, el.textContent.length);
  if (scroll) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
