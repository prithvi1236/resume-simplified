/* Side panel: the guideline check. */
import Core from '../../resume/core.js';
import { state, ui, curVer, find } from '../state.js';
import { CFG } from './lists.js';

const { esc } = Core;

function issueLabel(key) {
  const [sec, id] = key.split(':');
  const nm = { personal: 'Personal details', skills: 'Skills', edu: 'Education', hobbies: 'Hobbies' };
  if (nm[sec]) { const sub = { btech: 'B.Tech', c12: 'Class 12', c10: 'Class 10', diploma: 'Diploma', technical: 'Technical skills', soft: 'Soft skills', interests: 'Interests', name: 'Name', email: 'Email', phone: 'Phone', dob: 'Date of birth', linkedin: 'LinkedIn', github: 'GitHub', portfolio: 'Portfolio' }[id]; return nm[sec] + (sub && sec !== 'hobbies' ? ' · ' + sub : ''); }
  const it = find(sec, id); return CFG[sec].title + ' · ' + (it ? CFG[sec].nm(it) : '');
}
export function checkView() {
  const L = ui.lint, keys = Object.keys(L.byItem);
  const nameU = (state.master.personal.name || 'FULL NAME').toUpperCase();
  let h = `<div class="wrap"><h1>Guideline check</h1><p class="lead">Checks "${esc(curVer().name)}" against the college resume guidelines. Click an issue to jump to it.</p>`;
  if (!keys.length) h += `<div class="okbox">Everything this tool can check passes for this version.</div>`;
  else {
    h += `<div class="bar"><span class="cnt err">${L.err} errors</span><span class="cnt warn">${L.warn} warnings</span></div><ul class="chk">`;
    keys.forEach(k => L.byItem[k].forEach(i => { h += `<li class="${i.lvl === 'err' ? 'e' : 'w'}" data-act="jump" data-key="${k}"><div><b>${esc(issueLabel(k))}</b><br>${esc(i.msg)}</div></li>`; }));
    h += '</ul>';
  }
  h += `<section class="panel" style="margin-top:18px"><h3>Before you submit</h3><div class="meta">
    Open the DOCX in Word 2016 or later and confirm the Aptos Display font is used.<br>
    Upload Word and PDF copies, certificates and grade cards to your drive folder named &lt;Class&gt;_&lt;RollNo&gt;_${esc(nameU)}.<br>
    Name files like "${esc(nameU)} - Resume", "${esc(nameU)} - Sem1 Grade Card".<br>
    Set every linked certificate to "Anyone with the link".</div></section></div>`;
  return h;
}
