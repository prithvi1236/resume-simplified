/* Draws whichever side-panel view is open. */
import { $ } from '../dom.js';
import { ui } from '../state.js';
import { paintIssues } from '../issues.js';
import { personalView } from './personal.js';
import { skillsView } from './skills.js';
import { eduView, paintCg } from './education.js';
import { listView } from './lists.js';
import { versionsView } from './versions.js';
import { checkView } from './check.js';

export function renderEditor() {
  const s = ui.sec, ed = $('#editor');
  const y = ed.scrollTop;
  ed.innerHTML = s === 'personal' ? personalView() : s === 'skills' ? skillsView() : s === 'edu' ? eduView() : s === 'versions' ? versionsView() : s === 'check' ? checkView() : listView(s);
  ed.scrollTop = y;
  paintIssues();
  if (s === 'edu') paintCg();
}
