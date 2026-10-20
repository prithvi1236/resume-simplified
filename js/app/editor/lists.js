/* Side panel: list sections (work, projects, courses, positions, achievements, references). */
import Core from '../../resume/core.js';
import { state, ui, curVer } from '../state.js';
import { fld, patSel, durHTML } from './fields.js';

const { esc } = Core;

export const CFG = {
  work: { title: 'Work experience', add: 'Add work experience', lead: 'Internships, part-time roles and apprenticeships, completed or ongoing. Link the proof to the company name.', nm: it => it.company || 'New work experience' },
  projects: { title: 'Projects', add: 'Add project', lead: 'Put the projects that fit the role first. Order and inclusion are set per version.', nm: it => it.title || 'New project' },
  courses: { title: 'Courses and certifications', add: 'Add course', lead: 'Completed courses in order of relevance. Skip workshops here; they belong under achievements.', nm: it => Core.plain(it.text) || 'New course' },
  positions: { title: 'Key positions', add: 'Add position', lead: 'Core positions in clubs, cells or organisations. General volunteering goes under achievements.', nm: it => Core.plain(it.text) || 'New position' },
  achievements: { title: 'Achievements and activities', add: 'Add achievement', lead: 'International first, then national, state, district and college. Technical entries before non-technical ones.', nm: it => Core.plain(it.text) || 'New achievement' },
  refs: { title: 'References', add: 'Add reference', lead: 'The Principal and your HOD are added automatically. Add senior professionals who can vouch for you.', nm: it => it.name || 'New reference' }
};

function cardBody(sec, it) {
  const F = (f, label, o) => fld(Object.assign({ sec, id: it.id, f, label, value: it[f] }, o));
  const P = Core.PATTERNS;
  const richBase = (pats, link) => {
    const segs = Core.boldSegments(it.text);
    return `<div class="grid">
      ${sec === 'achievements' ? F('level', 'Level', { type: 'select', opts: Core.LEVELS, hint: 'Used to sort by level.' }) : ''}
      <div class="fd full"><span class="fl">Sentence</span>
        <div class="tools">${patSel('text', pats)}<button type="button" class="btn sm" data-act="bold">Bold selection</button></div>
        <textarea data-sec="${sec}" data-id="${it.id}" data-f="text" rows="3">${esc(it.text)}</textarea>
        <span class="fh">Bold names sit between ** **. Replace every &lt;placeholder&gt; and end with a full stop.</span></div>
      ${link ? `${F('url', 'Certificate link', { type: 'url', ph: 'https://drive.google.com/…', hint: 'Set sharing to "Anyone with the link".', full: 1 })}
      <label class="fd"><span class="fl">Link goes on</span><select data-sec="${sec}" data-id="${it.id}" data-f="linkIdx" data-linksel>${segOpts(segs, it.linkIdx)}</select><span class="fh">${sec === 'courses' ? 'The course name.' : 'The event name.'}</span></label>` : ''}</div>`;
  };
  switch (sec) {
    case 'work': return `<div class="grid">
      ${F('company', 'Company', { ph: 'Keltron' })}${F('role', 'Role', { ph: 'Software Development Intern' })}
      ${F('url', 'Proof link', { type: 'url', ph: 'https://drive.google.com/…', hint: 'Certificate or proof, shared as "Anyone with the link".', full: 1 })}
      ${durHTML(sec, it)}${F('tech', 'Technologies used', { ph: 'Python, MySQL', hint: 'Comma separated, Title Case, no full stop.' })}
      ${F('desc', 'Description', { type: 'area', full: 1, pre: `<div class="tools">${patSel('desc', [{ l: 'Completed', a: P.workDone }, { l: 'Ongoing', a: P.workOn }])}</div>`, hint: 'Two lines at most. Add numbers where you can.' })}</div>`;
    case 'projects': return `<div class="grid">
      ${F('title', 'Project title', { ph: 'SmartPark', hint: 'Title Case, no full stop.' })}${F('role', 'Your role', { ph: 'Backend Developer' })}
      ${F('team', 'Team size', { type: 'number', min: 1 })}${durHTML(sec, it)}
      ${F('tech', 'Technologies used', { full: 1, ph: 'React, Node.js, MongoDB', hint: 'Only the key technologies.' })}
      ${F('desc', 'Description', { type: 'area', full: 1, pre: `<div class="tools">${patSel('desc', [{ l: 'Completed', a: P.projDone }, { l: 'Ongoing', a: P.projOn }])}</div>`, hint: 'What it is, the objective, what you achieved. Two lines at most.' })}</div>`;
    case 'courses': return richBase([{ l: 'Approved sentences', a: P.course }], true);
    case 'positions': return richBase([{ l: 'Approved sentences', a: P.position }], false);
    case 'achievements': return richBase([{ l: 'Approved sentences', a: P.achieve }], true);
    case 'refs': return `<div class="grid">${F('name', 'Name', { ph: 'Jacob Simon' })}${F('post', 'Post', { ph: 'HR Executive' })}${F('org', 'Organisation', { ph: 'Samsung' })}${F('email', 'Email', { type: 'email' })}</div>`;
  }
}
export function segOpts(segs, cur) {
  if (!segs.length) return '<option value="0">No bold text yet</option>';
  return segs.map((s, i) => `<option value="${i}" ${(+cur || 0) === i ? 'selected' : ''}>${esc(s.length > 46 ? s.slice(0, 44) + '…' : s)}</option>`).join('');
}
function cardHTML(sec, it, incl, pos, total) {
  const key = sec + ':' + it.id, open = ui.open.has(it.id);
  return `<article class="card ${incl ? '' : 'off'}" data-sec="${sec}" data-id="${it.id}" data-key="${key}" id="c-${it.id}">
    <header class="ch"><button class="ctitle" data-act="toggleOpen" aria-expanded="${open}">${esc(CFG[sec].nm(it))}</button><span class="bd" data-badge></span>
      <label class="inc"><input type="checkbox" data-act="toggleInc" ${incl ? 'checked' : ''}> In this version</label>
      ${incl ? `<button class="ib" data-act="up" aria-label="Move up" ${pos === 0 ? 'disabled' : ''}>↑</button><button class="ib" data-act="down" aria-label="Move down" ${pos === total - 1 ? 'disabled' : ''}>↓</button>` : ''}
      <button class="ib" data-act="del" aria-label="Delete from all versions">×</button></header>
    <div class="cb" ${open ? '' : 'hidden'}>${cardBody(sec, it)}<div class="cissues" data-issues="${key}"></div></div></article>`;
}
export function listView(sec) {
  const ver = curVer(), all = state.master[sec], ids = ver.order[sec];
  const inc = ids.map(id => all.find(x => x.id === id)).filter(Boolean);
  const exc = all.filter(x => !ids.includes(x.id));
  const c = CFG[sec];
  let h = `<div class="wrap"><h1>${c.title}</h1><p class="lead">${c.lead}</p>
    <div class="bar"><button class="btn pri" data-act="add">${c.add}</button>${sec === 'achievements' ? '<button class="btn" data-act="sortLevel">Sort by level</button>' : ''}<span class="meta">${inc.length} in "${esc(ver.name)}", ${all.length} in total</span></div>`;
  if (!all.length) h += `<div class="empty">Nothing here yet. Add your first entry and it becomes available to every version.</div>`;
  h += inc.map((it, i) => cardHTML(sec, it, true, i, inc.length)).join('');
  if (exc.length) h += `<h2>Not in this version</h2>` + exc.map(it => cardHTML(sec, it, false, 0, 0)).join('');
  if (sec === 'achievements') {
    const hb = state.master.hobbies;
    h += `<section class="panel" style="margin-top:16px"><h3>Hobbies</h3><div class="meta">Up to four, in Title Case, closing the section.</div>
      <div class="chips">${hb.map((x, i) => `<span class="chip on"><span class="t">${esc(x)}</span><button data-act="hobDel" data-i="${i}" aria-label="Remove ${esc(x)}">×</button></span>`).join('')}</div>
      <div class="addrow"><input data-hobin placeholder="Add a hobby and press Enter" aria-label="Add a hobby"><button class="btn" data-act="hobAdd">Add</button></div>
      <div class="fe" data-fe="hobbies:hobbies"></div>
      <label class="inc" style="margin-top:10px"><input type="checkbox" data-act="hobInc" ${ver.hobbies ? 'checked' : ''}> Show hobbies in this version</label></section>`;
  }
  if (sec === 'refs') {
    const D = Core.defaults(state.master.edu.branch), I = (k, label, o) => fld(Object.assign({ k: 'inst.' + k, label, ph: D[k] }, o || {}));
    h += `<section class="panel"><h3>Principal and HOD</h3><div class="meta">Added to every version. Edit any part; a blank field uses the default shown in grey.</div>
      <div class="grid" style="margin-top:10px">
        ${I('pName', 'Principal name')}${I('pEmail', 'Principal email')}${I('pDetails', 'Principal designation and institution', { full: 1 })}
        ${I('hName', 'HOD name')}${I('hEmail', 'HOD email')}${I('hDetails', 'HOD designation, department and institution', { full: 1 })}
      </div><div class="bar" style="margin-top:10px"><button class="btn sm" data-act="resetInst">Reset to defaults</button></div></section>`;
  }
  return h + '</div>';
}
