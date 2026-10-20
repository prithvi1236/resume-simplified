/* Form-field markup shared by the side-panel views. */
import Core from '../../resume/core.js';
import { state, getPath } from '../state.js';

const { esc } = Core;

export function fld(o) {
  const b = o.k ? `data-k="${o.k}"` : `data-sec="${o.sec}" data-id="${o.id}" data-f="${o.f}"`;
  const v = o.k ? getPath(state.master, o.k) : o.value;
  let input;
  if (o.type === 'area') input = `<textarea ${b} rows="${o.rows || 3}" placeholder="${esc(o.ph || '')}">${esc(v)}</textarea>`;
  else if (o.type === 'select') input = `<select ${b}>${o.opts.map(x => `<option ${String(x) === String(v) ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
  else input = `<input ${b} type="${o.type || 'text'}" value="${esc(v)}" placeholder="${esc(o.ph || '')}" ${o.min ? 'min="' + o.min + '"' : ''} autocomplete="off">`;
  return `<label class="fd ${o.full ? 'full' : ''}"><span class="fl">${o.label}</span>${o.pre || ''}${input}${o.hint ? `<span class="fh">${o.hint}</span>` : ''}${o.ik ? `<span class="fe" data-fe="${o.ik}"></span>` : ''}</label>`;
}
export function patSel(target, groups) {
  return `<select class="pat" data-pat="${target}" aria-label="Insert a sentence pattern"><option value="">Insert a sentence pattern</option>${groups.map(g => `<optgroup label="${g.l}">${g.a.map(p => `<option value="${esc(p)}">${esc(p.replace(/\*\*/g, ''))}</option>`).join('')}</optgroup>`).join('')}</select>`;
}
export function durHTML(sec, it) {
  const ongoing = it.dUnit === 'Ongoing';
  return `<div class="fd"><span class="fl">Duration</span><div class="dur">
    <input type="number" min="1" data-sec="${sec}" data-id="${it.id}" data-f="dNum" value="${esc(it.dNum)}" ${ongoing ? 'disabled' : ''} aria-label="Duration amount">
    <select data-sec="${sec}" data-id="${it.id}" data-f="dUnit" aria-label="Duration unit">${['Days', 'Weeks', 'Months', 'Ongoing'].map(u => `<option ${u === it.dUnit ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
    <span class="fh">Under 7 days: Days. Under a month: Weeks. Otherwise Months.</span></div>`;
}
