/* Side panel: versions, PDF import and data backup. */
import Core from '../../resume/core.js';
import { state, ui } from '../state.js';
import { Store } from '../store.js';

const { esc } = Core;

export function isEmpty() {
  const m = state.master;
  return !m.personal.name.trim() && !m.personal.email.trim() && !m.edu.btech.cgpa.trim() && !m.skills.technical.length &&
    !['work', 'projects', 'courses', 'positions', 'achievements'].some(k => m[k].length);
}
export function importPanel(first) {
  if (!window.pdfjsLib) return '';
  const imp = ui.imp, c = imp && imp.parsed.counts;
  let h = `<section class="panel"><h3>${first ? 'Start from an existing resume' : 'Import an existing resume'}</h3><div class="meta">${first ? 'Upload a PDF made with this template and every field below is filled in for you. Everything stays editable. Or skip this and type your details.' : 'Upload a PDF made with this template. It is added as a new version, and every entry stays editable.'}</div>
    <div class="bar" style="margin-top:10px"><button class="btn pri" data-act="pickImport">Choose PDF</button><input type="file" id="importFile" accept=".pdf,application/pdf" hidden></div>`;
  if (ui.impBusy) h += '<div class="meta">Reading the PDF…</div>';
  if (imp) {
    const nm = state.master.personal.name.trim(), other = nm && imp.parsed.data.personal.name && nm.toLowerCase() !== imp.parsed.data.personal.name.toLowerCase();
    h += `<div class="panel" style="background:var(--panel2);margin:10px 0 0"><b>${esc(imp.file)}</b>
      <div class="meta" style="margin:6px 0">Found ${c.technical + c.soft + c.interests} skills, ${c.work} work, ${c.projects} projects, ${c.courses} courses, ${c.positions} positions, ${c.achievements} achievements${c.hobbies ? ', ' + c.hobbies + ' hobbies' : ''}${c.refs ? ', ' + c.refs + ' extra reference' + (c.refs > 1 ? 's' : '') : ''}.</div>
      ${imp.parsed.warnings.map(w => `<div class="cissues"><div class="w">${esc(w)}</div></div>`).join('')}
      <div class="grid" style="margin-top:10px"><label class="fd full"><span class="fl">Version name</span><input data-impname value="${esc(imp.name)}"></label></div>
      <label class="inc" style="margin:10px 0"><input type="checkbox" data-impow ${imp.overwrite ? 'checked' : ''}> Replace my saved personal details and education with the ones in this file</label>
      ${other ? `<div class="meta">This file is for "${esc(imp.parsed.data.personal.name)}", but your saved name is "${esc(nm)}". Leave the box unticked to keep your details.</div>` : ''}
      <div class="bar" style="margin-top:10px"><button class="btn pri" data-act="doImport">Add as new version</button><button class="btn" data-act="cancelImport">Cancel</button></div></div>`;
  }
  return h + '</section>';
}
export function versionsView() {
  const rows = state.versions.map(v => {
    const n = s => v.order[s].filter(id => state.master[s].some(x => x.id === id)).length;
    const skills = v.skills.technical.length + v.skills.soft.length + v.skills.interests.length;
    const act = v.id === state.activeVersion;
    return `<article class="panel vc ${act ? 'act' : ''}" data-vid="${v.id}">
      <div class="nm"><input data-vname="${v.id}" value="${esc(v.name)}" aria-label="Version name"><div class="meta" style="margin-top:4px">${n('work')} work, ${n('projects')} projects, ${n('courses')} courses, ${n('achievements')} achievements, ${skills} skills${act ? ' · Editing now' : ''}</div></div>
      ${act ? '' : '<button class="btn sm" data-act="useVer">Edit this version</button>'}
      <button class="btn sm" data-act="dupVer">Duplicate</button>
      <button class="btn sm pri" data-act="dlVer">DOCX</button><button class="btn sm pri" data-act="dlVerPdf">PDF</button>
      <button class="btn sm" data-act="delVer" ${state.versions.length < 2 ? 'disabled' : ''}>Delete</button></article>`;
  }).join('');
  return `<div class="wrap"><h1>Versions</h1>
    <p class="lead">A version is a selection and ordering of your saved entries, such as one aimed at backend roles and another at data roles. Editing an entry changes it everywhere; including or reordering it changes only the version you are in.</p>
    ${rows}
    <section class="panel"><h3>Create a version</h3><div class="addrow"><input id="newVer" placeholder="For example: Data and ML" aria-label="New version name">
      <button class="btn pri" data-act="newVer" data-mode="copy">Copy current</button><button class="btn" data-act="newVer" data-mode="empty">Start empty</button></div></section>
    ${importPanel()}
    <section class="panel"><h3>Your data</h3><div class="bar">
      <button class="btn" data-act="backup">Download backup (JSON)</button>
      <button class="btn" data-act="restore">Restore from backup</button>
      <button class="btn danger" data-act="wipe">Erase all data</button></div>
      <div class="meta">${Store.mode === 'cloud' ? 'Your data is stored privately against your account.' : Store.mode === 'local' ? 'Your data is stored in this browser only. Download a backup now and then.' : 'Storage is unavailable here, so nothing persists. Download a backup before leaving.'}</div>
      <input type="file" id="restoreFile" accept=".json,application/json" hidden></section></div>`;
}
