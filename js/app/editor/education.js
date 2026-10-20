/* Side panel: education, with the percentage and CGPA calculators. */
import Core from '../../resume/core.js';
import { $ } from '../dom.js';
import { state, ui } from '../state.js';
import { fld } from './fields.js';

const { esc } = Core;

export function eduView() {
  const e = state.master.edu, F = fld;
  const cg = ui.cg.map((r, i) => `<input type="number" step="0.01" data-cg="${i}.s" value="${esc(r.s)}" placeholder="SGPA" aria-label="Semester ${i + 1} SGPA"><input type="number" data-cg="${i}.c" value="${esc(r.c)}" placeholder="Credits" aria-label="Semester ${i + 1} credits">`).join('');
  const school = (k, label) => `<article class="card" data-key="edu:${k}"><header class="ch"><span class="ctitle" style="cursor:default">${label}</span><span class="bd" data-badge></span></header><div class="cb">
    <div class="grid">
      ${F({ k: `edu.${k}.inst`, label: 'School name', full: 1 })}
      ${F({ k: `edu.${k}.board`, label: 'Board', type: 'select', opts: Core.BOARDS })}
      ${F({ k: `edu.${k}.pct`, label: 'Percentage', ph: '94.2', hint: 'From your official certificate. One decimal at most.' })}
      ${F({ k: `edu.${k}.year`, label: 'Year of passing', ph: '2023' })}
    </div>
    <details><summary>Calculate percentage from total marks</summary><div class="calc">
      <input type="number" id="tm-${k}" placeholder="${k === 'c10' ? 'Total marks (State: grade points)' : 'Total marks'}" aria-label="Total marks">
      <button class="btn" data-act="calcPct" data-cls="${k}">Fill percentage</button></div>
      <div class="fh" style="margin-top:6px">${k === 'c12' ? 'ICSE and CBSE: total ÷ 5 (best five). State: total ÷ 12.' : 'ICSE: total ÷ 6. CBSE: total ÷ 5. State: (grade points × 10) ÷ 9.'}</div></details>
    <div class="cissues" data-issues="edu:${k}"></div></div></article>`;
  return `<div class="wrap"><h1>Education</h1>
    <p class="lead">Listed most recent first. The institution for B.Tech is fixed by the template.</p>
    <div class="panel"><div class="grid">
      ${F({ k: 'edu.branch', label: 'B.Tech branch', type: 'select', opts: Object.keys(Core.BRANCHES), full: 1, hint: 'This also picks your HOD reference and the skill ideas.' })}
    </div></div>
    <article class="card" data-key="edu:btech"><header class="ch"><span class="ctitle" style="cursor:default">Govt. Model Engineering College, KTU</span><span class="bd" data-badge></span></header><div class="cb">
      <div class="grid">
        ${F({ k: 'edu.btech.cgpa', label: 'CGPA', ph: '9.10', hint: 'Up to the latest published semester, two decimals.' })}
        ${F({ k: 'edu.btech.year', label: 'Year of passing', ph: '2027' })}
      </div>
      <details><summary>Calculate CGPA from semesters</summary><div class="calc" style="max-width:420px">${cg}</div>
        <div class="bar" style="margin-top:8px"><button class="btn sm" data-act="cgAdd">Add semester</button><button class="btn sm" data-act="cgUse">Use this CGPA</button><span class="res" id="cgres"></span></div>
        <div class="fh">Weighted by credits: sum of (SGPA × credits) ÷ total credits.</div></details>
      <div class="cissues" data-issues="edu:btech"></div></div></article>
    <label class="inc" style="margin:4px 0 10px"><input type="checkbox" data-k="edu.diploma.on" ${e.diploma.on ? 'checked' : ''}> Include a diploma (lateral entry only)</label>
    ${e.diploma.on ? `<article class="card" data-key="edu:diploma"><header class="ch"><span class="ctitle" style="cursor:default">Diploma</span><span class="bd" data-badge></span></header><div class="cb"><div class="grid">
      ${F({ k: 'edu.diploma.inst', label: 'Institution', full: 1 })}
      ${F({ k: 'edu.diploma.board', label: 'Board' })}
      ${F({ k: 'edu.diploma.branch', label: 'Branch', ph: 'Automobile Engineering' })}
      ${F({ k: 'edu.diploma.cgpa', label: 'CGPA', ph: '8.53' })}
      ${F({ k: 'edu.diploma.year', label: 'Year of passing', ph: '2024' })}
    </div><div class="cissues" data-issues="edu:diploma"></div></div></article>` : ''}
    ${school('c12', 'Class 12')}${school('c10', 'Class 10')}
    <label class="inc"><input type="checkbox" data-k="edu.c12.on" ${e.c12.on ? 'checked' : ''}> Show Class 12</label>
    <label class="inc" style="margin-top:6px"><input type="checkbox" data-k="edu.c10.on" ${e.c10.on ? 'checked' : ''}> Show Class 10</label></div>`;
}

export function cgCalc() {
  let sum = 0, cr = 0; ui.cg.forEach(r => { const s = parseFloat(r.s), c = parseFloat(r.c); if (s >= 0 && c > 0) { sum += s * c; cr += c; } });
  return cr > 0 ? sum / cr : null;
}
export function paintCg() { const el = $('#cgres'); if (!el) return; const r = cgCalc(); el.textContent = r ? 'CGPA ' + r.toFixed(2) : ''; }
