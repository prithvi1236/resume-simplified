/* Side panel: personal details. */
import { fld } from './fields.js';
import { isEmpty, importPanel } from './versions.js';

export function personalView() {
  const F = (k, label, o) => fld(Object.assign({ k: 'personal.' + k, label, ik: 'personal:' + k }, o));
  return `<div class="wrap"><h1>Personal details</h1>
    <p class="lead">Type straight onto the page, or fill this in. Every version of your resume reads from it.</p>
    ${isEmpty() ? importPanel(true) : ''}
    <div class="panel"><div class="grid">
      ${F('name', 'Full name', { full: 1, ph: 'As in your academic records', hint: 'Printed in uppercase on the resume.' })}
      ${F('email', 'Email', { type: 'email', ph: 'name.mec@gmail.com' })}
      ${F('phone', 'Phone', { type: 'tel', ph: '+91 9876543210', hint: 'International format.' })}
      ${F('dob', 'Date of birth', { ph: 'DD/MM/YYYY' })}
      ${F('linkedin', 'LinkedIn link', { type: 'url', ph: 'https://www.linkedin.com/in/…', hint: 'Mandatory.' })}
      ${F('github', 'GitHub link', { type: 'url', ph: 'https://github.com/…', hint: 'Optional. Leave empty to drop it from the header.' })}
      ${F('portfolio', 'Portfolio link', { type: 'url', ph: 'https://…', hint: 'Optional. UI/UX portfolio or personal site.' })}
    </div></div></div>`;
}
