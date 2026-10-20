/* Side panel: skills and interests. */
import Core from '../../resume/core.js';
import { state, curVer } from '../state.js';

const { esc } = Core;

export function skillsView() {
  const ver = curVer(), key = Core.BRANCHES[state.master.edu.branch].key, S = Core.SUGG;
  const groups = [
    ['technical', 'Technical skills', 'Skills you would use in a professional setting. You should be able to explain every one.', S[key].tech],
    ['soft', 'Soft skills', 'Non-technical skills that support your work.', S.soft],
    ['interests', 'Interests', 'Your technical areas of interest.', S[key].int]
  ];
  return `<div class="wrap"><h1>Skills and interests</h1>
    <p class="lead">Your library holds everything you could list. Each version picks and orders what it shows. Skills are converted to Title Case when added.</p>
    ${groups.map(([g, title, hint, sug]) => {
      const inc = ver.skills[g], pool = state.master.skills[g];
      return `<section class="panel"><h3>${title}</h3><div class="meta">${hint}</div>
        <div class="sub">In this version, in resume order</div>
        <div class="chips">${inc.length ? inc.map((s, i) => `<span class="chip on"><button data-act="skL" data-g="${g}" data-i="${i}" aria-label="Move earlier" ${i === 0 ? 'disabled' : ''}>‹</button><span class="t">${esc(s)}</span><button data-act="skR" data-g="${g}" data-i="${i}" aria-label="Move later" ${i === inc.length - 1 ? 'disabled' : ''}>›</button><button data-act="skOff" data-g="${g}" data-i="${i}" aria-label="Remove from this version">×</button></span>`).join('') : '<span class="meta">Nothing yet.</span>'}</div>
        <div class="sub">Library. Click to add to this version</div>
        <div class="chips">${pool.filter(s => !inc.includes(s)).map(s => `<span class="chip"><span class="t">${esc(s)}</span><button data-act="skOn" data-g="${g}" data-v="${esc(s)}" aria-label="Add to this version">+</button><button data-act="skDel" data-g="${g}" data-v="${esc(s)}" aria-label="Delete from library">×</button></span>`).join('') || '<span class="meta">Every library skill is in this version.</span>'}</div>
        <div class="addrow"><input data-skin="${g}" placeholder="Type a skill and press Enter" aria-label="Add a ${title}"><button class="btn" data-act="skAdd" data-g="${g}">Add</button></div>
        <div class="fe" data-fe="skills:${g}"></div>
        <details><summary>Ideas for your branch</summary><div class="chips">${sug.filter(s => !pool.includes(s)).map(s => `<button class="chip add" data-act="skSugg" data-g="${g}" data-v="${esc(s)}">${esc(s)}</button>`).join('') || '<span class="meta">All added.</span>'}</div></details>
      </section>`;
    }).join('')}</div>`;
}
