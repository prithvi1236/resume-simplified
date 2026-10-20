/* Draws the resume page: measures every entry, paginates, and scales the page to fit. */
import Core from '../../resume/core.js';
import { $ } from '../dom.js';
import { state, ui, LIST_SECS, curVer } from '../state.js';
import { LATE, edSpan, lineHTML } from './markup.js';
import { fitZoom } from './zoom.js';
import { caretOff, setCaret } from './caret.js';

const { esc } = Core;

const ZOOM_BTN = '<button data-pa="zoom" title="Zoom this entry in or out (Esc zooms out)" aria-label="Zoom this entry in or out">⤢</button>';
const ZOOM_BAR = '<div class="zbar"><button data-pa="zoom" title="Back to page size (Esc)">⤡ Zoom out</button></div>';
function itemBar(it, ver) {
  if (it.sec === 'hobbies') return `<div class="itb">${ZOOM_BTN}<button data-pa="hide" title="Hide hobbies in this version" aria-label="Hide hobbies in this version">⊘</button></div>`;
  if (!LIST_SECS.includes(it.sec)) return `<div class="itb">${ZOOM_BTN}</div>`;
  const ord = ver.order[it.sec], i = ord.indexOf(it.id);
  return `<div class="itb">${ZOOM_BTN}<button data-pa="up" title="Move up" aria-label="Move up" ${i <= 0 ? 'disabled' : ''}>↑</button><button data-pa="down" title="Move down" aria-label="Move down" ${i === ord.length - 1 ? 'disabled' : ''}>↓</button><button data-pa="hide" title="Remove from this version (stays in your library)" aria-label="Remove from this version">⊘</button>${ui.armDel === it.id ? '<button data-pa="del" class="armed" title="Click again to delete" aria-label="Confirm delete">Delete?</button>' : '<button data-pa="del" title="Delete from every version" aria-label="Delete from every version">×</button>'}</div>`;
}
const ADD_FOR = { skills: 'skills', work: 'work', projects: 'projects', courses: 'courses', positions: 'positions', achievements: 'achievements', refs: 'refs' };
function headerHTML(h) {
  const p = state.master.personal;
  const E = (k, ph) => edSpan({ k: 'personal.' + k, v: p[k], ph }, esc(p[k]));
  const links = h.links.map((l, i) => (i ? '<span class="sep">|</span>' : '') + `<span class="hl${l.url ? ' blue' : ''}" data-pa="links" title="Edit links in the side panel">${esc(l.t)}</span>`).join(' ');
  return `<div class="hd${ui.zoom === 'personal:header' ? ' zm' : ''}" data-sec="personal" data-id="header"><div class="itb">${ZOOM_BTN}</div><div class="nm">${E('name', 'YOUR NAME')}</div><div class="hr1"><span>${links}</span><span>${E('email', 'name.mec@gmail.com')}</span></div><div class="hr2"><span>DOB – ${E('dob', 'DD/MM/YYYY')}</span><span>${E('phone', '+91 XXXXXXXXXX')}</span></div>${ZOOM_BAR}</div>`;
}
// Removing the focused field fires focusout, so focus events are ignored while the page redraws.
export function renderPreview() {
  ui.restoring = true;
  try { drawPages(); } finally { ui.restoring = false; }
}
function drawPages() {
  const sheet = $('#sheet'), a = document.activeElement;
  // Keep the field being typed in focused, with its caret (and any text not yet parsed), across the redraw.
  const keep = a && a.dataset && a.dataset.ek && sheet.contains(a) ? { ek: a.dataset.ek, off: caretOff(a), text: a.textContent, late: LATE.includes((ui.eds[a.dataset.ek] || {}).kind) } : null;
  ui.eds = {};
  const ver = curVer(), m = Core.compose(state, state.activeVersion, { ghost: ui.sel }), L = ui.lint, h = m.header;
  const hdr1 = headerHTML(h);
  const hdr2 = `<div class="nm">${esc(h.name)}</div><div class="hsp"></div>`;
  const units = m.blocks.map(b => ({
    head: `<div class="sh">${esc(b.title)}${ADD_FOR[b.key] ? `<button class="sha" data-add="${b.key}" title="Add an entry to this section">+ Add</button>` : ''}</div>`,
    items: b.items.map(it => {
      const iss = L.byItem[it.sec + ':' + it.id];
      const cls = (iss ? (iss.some(i => i.lvl === 'err') ? 'bad' : 'warn') : '') + (ui.sel === it.sec + ':' + it.id ? ' sel' : '') + (ui.zoom === it.sec + ':' + it.id ? ' zm' : '');
      return `<div class="it ${cls}" data-sec="${it.sec}" data-id="${it.id}" ${iss ? `title="${esc(iss.map(i => i.msg).join(' '))}"` : ''}>${itemBar(it, ver)}${it.lines.map(lineHTML).join('')}${ZOOM_BAR}</div>`;
    })
  }));
  // 1) measure every piece in one hidden page
  let meas = '<div class="pg meas"><div class="pc"><div class="fr">' + hdr1 + '</div><div class="fr">' + hdr2 + '</div>';
  units.forEach(u => { meas += '<div class="fr">' + u.head + '</div>' + u.items.map(x => '<div class="fr">' + x + '</div>').join(''); });
  sheet.style.transform = 'none';
  sheet.innerHTML = meas + '</div></div>';
  const hs = Array.from(sheet.querySelectorAll('.pc > .fr')).map(n => n.getBoundingClientRect().height);
  const H1 = hs[0], H2 = hs[1]; let k = 2;
  const LIMIT = 1123 - 96;
  // 2) paginate: whole items stay together, a heading stays with its first item
  const pages = [{ h: hdr1, parts: [] }]; let y = H1;
  const newPage = () => { pages.push({ h: hdr2, parts: [] }); y = H2; };
  units.forEach(u => {
    const headH = hs[k++], ih = u.items.map(() => hs[k++]);
    if (y + headH + (ih[0] || 0) > LIMIT && pages[pages.length - 1].parts.length) newPage();
    pages[pages.length - 1].parts.push(u.head); y += headH;
    u.items.forEach((x, i) => {
      if (y + ih[i] > LIMIT && pages[pages.length - 1].parts.length) newPage();
      pages[pages.length - 1].parts.push(x); y += ih[i];
    });
  });
  // 3) draw the real pages
  sheet.innerHTML = pages.map((pg, i) => `<div class="pg" data-page="${i + 1}"><div class="pc">${pg.h}${pg.parts.join('')}</div><div class="ft">Govt. Model Engineering College, Kochi</div></div>`).join('');
  $('#pgcount').innerHTML = `<b>${pages.length}</b> ${pages.length === 1 ? 'page' : 'pages'} (estimate)`;
  const zm = sheet.querySelector('.zm'); if (zm) zm.closest('.pg').classList.add('zm');
  fitPreview();
  if (keep) {
    const el = Array.from(sheet.querySelectorAll('[data-ek]')).find(x => x.dataset.ek === keep.ek);
    if (el) { if (keep.late) el.textContent = keep.text; el.focus({ preventScroll: true }); setCaret(el, keep.off); }
  }
}
export function fitPreview() {
  const wrap = $('#pvwrap'), sheet = $('#sheet'), box = $('#pvbox'); if (!wrap) return;
  const cs = getComputedStyle(wrap), avail = Math.max(300, wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), s = Math.min(1, avail / 794);
  sheet.style.transform = `scale(${s})`;
  fitZoom(s);
  box.style.width = 794 * s + 'px'; box.style.height = sheet.offsetHeight * s + 'px';
}
/* Redraw the page soon, but never while a mouse button is held (that would break a click or text selection). */
let qr = null;
export function queueRefresh(delay) {
  clearTimeout(qr);
  qr = setTimeout(function run() { if (ui.ptr) { ui.ptrCb = run; return; } renderPreview(); }, delay || 0);
}
