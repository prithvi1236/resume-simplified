/* Event handling for typing and clicking on the page. */
import { $, toast } from '../dom.js';
import { ui } from '../state.js';
import { touch } from '../history.js';
import { refreshLint, paintNav, paintIssues } from '../issues.js';
import { setView } from '../layout.js';
import { renderEditor } from '../editor/render.js';
import { LATE } from './markup.js';
import { queueRefresh } from './render.js';
import { setZoom } from './zoom.js';
import { setCaret } from './caret.js';
import { readEd, applyEd, syncPanel, paintSheetMarks } from './apply.js';
import { showInPanel, select, keyOf, addTo, pageAction, markMove } from './select.js';

export function wireSheet() {
  const sheet = $('#sheet');
  sheet.addEventListener('pointerdown', () => { ui.ptr = true; });
  window.addEventListener('pointerup', () => { ui.ptr = false; if (ui.ptrCb) { const f = ui.ptrCb; ui.ptrCb = null; setTimeout(f, 0); } });
  // Preview a move while the pointer or keyboard focus is on an up/down arrow.
  const mvOf = e => e.target.closest && e.target.closest('.mv');
  sheet.addEventListener('pointerover', e => { const b = mvOf(e); if (b) markMove(b, true); });
  sheet.addEventListener('pointerout', e => { const b = mvOf(e); if (b && !b.contains(e.relatedTarget)) markMove(b, false); });
  sheet.addEventListener('focusin', e => { const b = mvOf(e); if (b) markMove(b, true); });
  sheet.addEventListener('focusout', e => { const b = mvOf(e); if (b) markMove(b, false); });
  sheet.addEventListener('focusin', e => {
    if (ui.restoring) return;
    const el = e.target.closest('[data-ek]'); if (!el) return;
    const key = keyOf(el); select(key);
    if (ui.autoZoom && ui.zoom !== key) setZoom(key);
  });
  sheet.addEventListener('input', e => {
    const el = e.target.closest('[data-ek]'), ed = el && ui.eds[el.dataset.ek]; if (!ed || LATE.includes(ed.kind)) return;
    applyEd(ed, readEd(el, ed)); touch(); refreshLint(); paintNav(); paintIssues(); paintSheetMarks(); syncPanel(ed);
    if (ui.sec === 'check') renderEditor();
    if (!e.isComposing) queueRefresh(900); // reflow pages once typing pauses
  });
  sheet.addEventListener('focusout', e => {
    const el = e.target.closest('[data-ek]'), ed = el && ui.eds[el.dataset.ek]; if (!ed || ui.restoring) return;
    const text = readEd(el, ed);
    // Apply after focus has landed on the next field, so the redraw can keep that field focused.
    setTimeout(() => {
      if (LATE.includes(ed.kind)) {
        if (!applyEd(ed, text)) toast('Write the duration like "6 Months", "3 Weeks" or "Ongoing".');
        touch(); refreshLint(); paintNav();
        if (!$('#editor').contains(document.activeElement)) renderEditor(); else paintIssues();
      }
      queueRefresh();
    }, 0);
  });
  sheet.addEventListener('keydown', e => {
    const el = e.target.closest('[data-ek]'); if (!el) return;
    const rich = (ui.eds[el.dataset.ek] || {}).kind === 'rich';
    if (e.key === 'Enter') {
      e.preventDefault();
      const all = Array.from(sheet.querySelectorAll('[data-ek]')), nx = all[all.indexOf(el) + (e.shiftKey ? -1 : 1)];
      if (nx) { nx.focus({ preventScroll: true }); setCaret(nx, nx.textContent.length); nx.scrollIntoView({ block: 'nearest' }); } else el.blur();
    } else if (e.key === 'Escape') el.blur();
    else if ((e.metaKey || e.ctrlKey) && /^[biu]$/i.test(e.key) && !(rich && /^b$/i.test(e.key))) e.preventDefault();
  });
  sheet.addEventListener('paste', e => {
    const el = e.target.closest('[data-ek]'); if (!el) return;
    e.preventDefault();
    const t = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s*\n\s*/g, ' ');
    document.execCommand('insertText', false, t);
  });
  sheet.addEventListener('drop', e => { if (e.target.closest('[data-ek]')) e.preventDefault(); });
  sheet.addEventListener('click', e => {
    if (e.target.closest('[data-ek]')) return;
    const add = e.target.closest('[data-add]'); if (add) { addTo(add.dataset.add); return; }
    const pa = e.target.closest('[data-pa]');
    if (pa && pa.dataset.pa === 'zoom') {
      const key = keyOf(pa);
      if (ui.zoom === key) { const a = document.activeElement; if (a && sheet.contains(a)) a.blur(); setZoom(null); }
      else { select(key); setZoom(key); const f = pa.closest('[data-sec][data-id]').querySelector('[data-ek]'); if (f) { f.focus({ preventScroll: true }); setCaret(f, f.textContent.length); } }
      return;
    }
    if (pa && pa.dataset.pa === 'links') { select('personal:header'); showInPanel('personal'); const i = $('#editor').querySelector('[data-k="personal.linkedin"]'); if (i) i.focus(); if (document.body.dataset.view === 'page' && matchMedia('(max-width:1180px)').matches) setView('panel'); return; }
    if (pa) { pageAction(pa); return; }
    const it = e.target.closest('[data-sec][data-id]');
    select(it ? it.dataset.sec + ':' + it.dataset.id : '');
  });
}
