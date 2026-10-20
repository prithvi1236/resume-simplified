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
import { showInPanel, select, keyOf, addTo, pageAction } from './select.js';

export function wireSheet() {
  const sheet = $('#sheet');
  sheet.addEventListener('pointerdown', () => { ui.ptr = true; });
  // Pressing blank paper would move the caret into the nearest field (and, on a phone, scroll a panned entry
  // sideways so the tap misses); let the click below handle it instead. A press that starts on a field is never
  // a click on the paper, even though zooming in moves the field before the button comes up.
  let downOnField = false;
  sheet.addEventListener('mousedown', e => {
    downOnField = !!e.target.closest('[data-ek]');
    if (!e.target.closest('[data-sec][data-id], [data-ek], button, a')) e.preventDefault();
  });
  // A tap's mousedown, focus and click all come after its pointerup, so after a touch hold redraws until the click
  // (or give up after a moment), or the click lands on a replaced element. A touch that scrolls ends with pointercancel.
  let tapT = null;
  const release = () => { clearTimeout(tapT); ui.ptr = false; if (ui.ptrCb) { const f = ui.ptrCb; ui.ptrCb = null; setTimeout(f, 0); } };
  window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') release(); else { clearTimeout(tapT); tapT = setTimeout(release, 600); } });
  window.addEventListener('pointercancel', release);
  window.addEventListener('click', () => { if (ui.ptr) release(); }, true);
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
    if (e.target.closest('[data-ek]') || downOnField) return;
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
    if (!it) { const a = document.activeElement; if (a && sheet.contains(a)) a.blur(); }
    select(it ? it.dataset.sec + ':' + it.dataset.id : '');
  });
}
