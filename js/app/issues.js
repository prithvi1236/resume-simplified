/* Guideline issues: counts in the section nav and the messages next to fields. */
import Core from '../resume/core.js';
import { $ } from './dom.js';
import { state, ui, SECS, LINT_TO_NAV } from './state.js';

const { esc } = Core;

export function refreshLint() { ui.lint = Core.lintState(state, state.activeVersion); }
export function paintNav() {
  const L = ui.lint, bs = {};
  Object.keys(L.bySec).forEach(k => { const t = LINT_TO_NAV[k] || k; bs[t] = bs[t] || { err: 0, warn: 0 }; bs[t].err += L.bySec[k].err; bs[t].warn += L.bySec[k].warn; });
  $('#nav').innerHTML = SECS.map(([k, t]) => {
    let c = '';
    const b = k === 'check' ? { err: L.err, warn: L.warn } : bs[k];
    if (b && b.err) c = `<span class="cnt err">${b.err}</span>`; else if (b && b.warn) c = `<span class="cnt warn">${b.warn}</span>`;
    return `<button class="nv ${ui.sec === k ? 'on' : ''}" data-nav="${k}"><span>${t}</span>${c}</button>`;
  }).join('');
  const chk = $('#chk');
  chk.textContent = L.err ? L.err + (L.err === 1 ? ' error' : ' errors') + (L.warn ? ', ' + L.warn + ' warnings' : '') : L.warn ? L.warn + (L.warn === 1 ? ' warning' : ' warnings') : 'All checks pass';
  chk.className = 'pill ' + (L.err ? 'bad' : L.warn ? 'wait' : 'ok');
}
export function paintIssues() {
  const L = ui.lint;
  document.querySelectorAll('[data-fe]').forEach(el => {
    const list = L.byItem[el.dataset.fe] || [];
    el.innerHTML = list.map(i => `<div class="${i.lvl === 'warn' ? 'w' : ''}">${esc(i.msg)}</div>`).join('');
  });
  document.querySelectorAll('[data-issues]').forEach(el => {
    const list = L.byItem[el.dataset.issues] || [];
    el.innerHTML = list.map(i => `<div class="${i.lvl === 'err' ? 'e' : 'w'}">${esc(i.msg)}</div>`).join('');
  });
  document.querySelectorAll('.card[data-key]').forEach(c => {
    const list = L.byItem[c.dataset.key] || [], b = c.querySelector('[data-badge]'); if (!b) return;
    const e = list.filter(i => i.lvl === 'err').length, w = list.length - e;
    b.className = 'bd ' + (e ? 'err' : w ? 'warn' : ''); b.textContent = e ? e + (e === 1 ? ' error' : ' errors') : w ? w + (w === 1 ? ' warning' : ' warnings') : '';
  });
}
