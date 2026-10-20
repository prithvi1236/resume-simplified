/* Side-panel input, change and click handling. */
import Core from '../../resume/core.js';
import ResumeImport from '../../resume/import.js';
import { $, toast } from '../dom.js';
import { state, ui, LIST_SECS, curVer, find, setPath, setState } from '../state.js';
import { touch } from '../history.js';
import { renderTop, renderAll, changed, goto } from '../layout.js';
import { download, backup, importFrom, restoreFrom } from '../files.js';
import { cgCalc, paintCg } from './education.js';
import { CFG, segOpts } from './lists.js';
import { isEmpty } from './versions.js';
import { renderEditor } from './render.js';

export function moveIn(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
export function addSkill(g, raw) {
  const v = Core.titleCase(String(raw || '').trim()); if (!v) return;
  const pool = state.master.skills[g], inc = curVer().skills[g];
  if (!pool.includes(v)) pool.push(v);
  if (!inc.includes(v)) inc.push(v);
  changed(); renderEditor();
}
export function addHobby(raw) {
  const v = Core.titleCase(String(raw || '').replace(/\.$/, '').trim()); if (!v) return;
  if (!state.master.hobbies.includes(v)) state.master.hobbies.push(v);
  changed(); renderEditor();
}
export function onInput(e) {
  const t = e.target;
  if (t.dataset.cg) { const [i, f] = t.dataset.cg.split('.'); ui.cg[+i][f] = t.value; paintCg(); return; }
  if (t.hasAttribute && t.hasAttribute('data-impname')) { ui.imp.name = t.value; return; }
  if (t.dataset.vname) { state.versions.find(v => v.id === t.dataset.vname).name = t.value || 'Untitled'; renderTop(); touch(); return; }
  if (t.dataset.k) {
    let val = t.type === 'checkbox' ? t.checked : t.value;
    setPath(state.master, t.dataset.k, val);
    changed();
    if (/\.on$/.test(t.dataset.k) || t.dataset.k === 'edu.branch') renderEditor();
    return;
  }
  if (t.dataset.sec && t.dataset.f) {
    const it = find(t.dataset.sec, t.dataset.id); if (!it) return;
    let val = t.value; if (t.dataset.f === 'linkIdx') val = parseInt(val, 10) || 0;
    it[t.dataset.f] = val;
    const card = t.closest('.card');
    if (t.dataset.f === 'dUnit') { const n = card.querySelector('[data-f="dNum"]'); if (n) n.disabled = val === 'Ongoing'; }
    if (t.dataset.f === 'text') { const ls = card.querySelector('[data-linksel]'); if (ls) ls.innerHTML = segOpts(Core.boldSegments(val), it.linkIdx); }
    if (['company', 'title', 'name', 'text'].includes(t.dataset.f)) { const tt = card.querySelector('.ctitle'); if (tt) tt.textContent = CFG[t.dataset.sec].nm(it); }
    changed();
  }
}
export function onChange(e) {
  const t = e.target;
  if (t.dataset.pat) {
    if (!t.value) return;
    const card = t.closest('.card'), ta = card.querySelector(`textarea[data-f="${t.dataset.pat}"]`);
    ta.value = t.value; ta.dispatchEvent(new Event('input', { bubbles: true }));
    const m = /<[^>]+>/.exec(ta.value); ta.focus(); if (m) ta.setSelectionRange(m.index, m.index + m[0].length);
    t.value = ''; return;
  }
  if (t.dataset.act === 'toggleInc') {
    const card = t.closest('.card'), sec = card.dataset.sec, id = card.dataset.id, ord = curVer().order[sec];
    if (t.checked) { if (!ord.includes(id)) ord.push(id); } else curVer().order[sec] = ord.filter(x => x !== id);
    ui.open.add(id); changed(); renderEditor(); return;
  }
  if (t.dataset.act === 'hobInc') { curVer().hobbies = t.checked; changed(); return; }
  if (t.id === 'restoreFile') { restoreFrom(t.files[0]); t.value = ''; return; }
  if (t.id === 'importFile') { importFrom(t.files[0]); t.value = ''; return; }
  if (t.hasAttribute && t.hasAttribute('data-impow')) { ui.imp.overwrite = t.checked; return; }
}
function twoStep(btn, run, label) {
  if (btn.classList.contains('armed')) { run(); return; }
  const old = btn.textContent; btn.classList.add('armed'); btn.textContent = label || 'Confirm delete';
  setTimeout(() => { if (btn.isConnected) { btn.classList.remove('armed'); btn.textContent = old; } }, 3200);
}
export function onClick(e) {
  const nav = e.target.closest('[data-nav]'); if (nav) { ui.sec = nav.dataset.nav; renderAll(); $('#editor').scrollTop = 0; return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, card = b.closest('.card'), sec = card && card.dataset.sec, id = card && card.dataset.id;
  const ver = curVer();
  switch (act) {
    case 'toggleOpen': { const c = card.querySelector('.cb'); c.hidden = !c.hidden; if (c.hidden) ui.open.delete(id); else ui.open.add(id); b.setAttribute('aria-expanded', !c.hidden); break; }
    case 'up': case 'down': { const ord = ver.order[sec], i = ord.indexOf(id); moveIn(ord, i, act === 'up' ? -1 : 1); changed(); renderEditor(); break; }
    case 'del': twoStep(b, () => { state.master[sec] = state.master[sec].filter(x => x.id !== id); state.versions.forEach(v => { v.order[sec] = v.order[sec].filter(x => x !== id); }); changed(); renderEditor(); }); break;
    case 'add': {
      const s = ui.sec, it = Core.blankItem(s); state.master[s].push(it); ver.order[s].push(it.id); ui.open.add(it.id);
      changed(); renderEditor();
      const c = document.getElementById('c-' + it.id); if (c) { c.scrollIntoView({ block: 'center', behavior: 'smooth' }); const f = c.querySelector('input:not([type=checkbox]),textarea'); if (f) f.focus({ preventScroll: true }); }
      break;
    }
    case 'sortLevel': { const list = state.master.achievements, ord = ver.order.achievements; ord.sort((a, c) => Core.LEVELS.indexOf(list.find(x => x.id === a).level) - Core.LEVELS.indexOf(list.find(x => x.id === c).level)); changed(); renderEditor(); toast('Sorted from international to college level.'); break; }
    case 'bold': {
      const ta = card.querySelector('textarea[data-f="text"]'), s = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '**' + ta.value.slice(s, en) + '**' + ta.value.slice(en);
      ta.focus(); ta.setSelectionRange(s + 2, en + 2); ta.dispatchEvent(new Event('input', { bubbles: true })); break;
    }
    case 'skAdd': { const i = document.querySelector(`[data-skin="${b.dataset.g}"]`); addSkill(b.dataset.g, i.value); break; }
    case 'skSugg': addSkill(b.dataset.g, b.dataset.v); break;
    case 'skOn': { const g = b.dataset.g; if (!ver.skills[g].includes(b.dataset.v)) ver.skills[g].push(b.dataset.v); changed(); renderEditor(); break; }
    case 'skOff': ver.skills[b.dataset.g].splice(+b.dataset.i, 1); changed(); renderEditor(); break;
    case 'skL': moveIn(ver.skills[b.dataset.g], +b.dataset.i, -1); changed(); renderEditor(); break;
    case 'skR': moveIn(ver.skills[b.dataset.g], +b.dataset.i, 1); changed(); renderEditor(); break;
    case 'skDel': { const g = b.dataset.g, v = b.dataset.v; state.master.skills[g] = state.master.skills[g].filter(x => x !== v); state.versions.forEach(x => { x.skills[g] = x.skills[g].filter(y => y !== v); }); changed(); renderEditor(); break; }
    case 'hobAdd': addHobby(document.querySelector('[data-hobin]').value); break;
    case 'hobDel': state.master.hobbies.splice(+b.dataset.i, 1); changed(); renderEditor(); break;
    case 'calcPct': {
      const k = b.dataset.cls, total = parseFloat($('#tm-' + k).value), board = state.master.edu[k].board;
      if (!(total > 0)) { toast('Enter the total marks first.'); break; }
      const div = k === 'c12' ? (board === 'State' ? 12 : 5) : (board === 'ICSE' ? 6 : 5);
      const pct = k === 'c10' && board === 'State' ? (total * 10) / 9 : total / div;
      state.master.edu[k].pct = (Math.round(pct * 10) / 10).toString(); changed(); renderEditor(); break;
    }
    case 'pickImport': $('#importFile').click(); break;
    case 'cancelImport': ui.imp = null; renderEditor(); break;
    case 'doImport': {
      if (isEmpty()) state.versions = [];
      const v = ResumeImport.apply(state, ui.imp.parsed, { name: (ui.imp.name || '').trim() || 'Imported resume', overwrite: ui.imp.overwrite });
      ui.imp = null; touch(); renderAll(); toast('Added "' + v.name + '". Open any section to edit its entries.'); break;
    }
    case 'resetInst': state.master.inst = { pName: '', pDetails: '', pEmail: '', hName: '', hDetails: '', hEmail: '' }; changed(); renderEditor(); toast('Principal and HOD reset to defaults.'); break;
    case 'cgAdd': ui.cg.push({ s: '', c: '' }); renderEditor(); break;
    case 'cgUse': { const r = cgCalc(); if (r) { state.master.edu.btech.cgpa = r.toFixed(2); changed(); renderEditor(); } else toast('Enter SGPA and credits for at least one semester.'); break; }
    case 'jump': { const key = b.dataset.key, [s, i] = key.split(':'); const map = { hobbies: 'achievements', skills: 'skills', personal: 'personal', edu: 'edu' }; goto(map[s] || s, LIST_SECS.includes(s) ? i : null); break; }
    case 'useVer': state.activeVersion = b.closest('[data-vid]').dataset.vid; touch(); renderAll(); break;
    case 'dupVer': { const v = state.versions.find(x => x.id === b.closest('[data-vid]').dataset.vid), c = JSON.parse(JSON.stringify(v)); c.id = Core.uid('v'); c.name = v.name + ' copy'; state.versions.push(c); state.activeVersion = c.id; touch(); renderAll(); toast('Duplicated. You are now editing the copy.'); break; }
    case 'delVer': twoStep(b, () => { const vid = b.closest('[data-vid]').dataset.vid; state.versions = state.versions.filter(x => x.id !== vid); if (state.activeVersion === vid) state.activeVersion = state.versions[0].id; touch(); renderAll(); }); break;
    case 'newVer': {
      const name = ($('#newVer').value || '').trim() || 'New version';
      const v = Core.newVersion(name);
      if (b.dataset.mode === 'copy') { const c = JSON.parse(JSON.stringify(ver)); v.skills = c.skills; v.order = c.order; v.hobbies = c.hobbies; }
      state.versions.push(v); state.activeVersion = v.id; touch(); renderAll(); toast('Created "' + name + '".'); break;
    }
    case 'dlVer': download(b.closest('[data-vid]').dataset.vid, 'docx'); break;
    case 'dlVerPdf': download(b.closest('[data-vid]').dataset.vid, 'pdf'); break;
    case 'backup': backup(); break;
    case 'restore': $('#restoreFile').click(); break;
    case 'wipe': twoStep(b, () => { setState(Core.blankState()); ui.open.clear(); touch(); renderAll(); toast('All data erased.'); }); break;
  }
}
