/* The resume state (saved data) and the UI state (what is open, selected, being edited). */
import Core from '../resume/core.js';

export let state = Core.blankState();
export function setState(s) { state = s; } // the one place the whole state is replaced
export const ui = { sec: 'personal', sel: '', eds: {}, open: new Set(), ready: false, save: 'loading', lint: null, cg: [{ s: '', c: '' }, { s: '', c: '' }, { s: '', c: '' }, { s: '', c: '' }], armed: null };

export const SECS = [
  ['personal', 'Personal'], ['skills', 'Skills'], ['edu', 'Education'], ['work', 'Work'],
  ['projects', 'Projects'], ['courses', 'Courses'], ['positions', 'Positions'],
  ['achievements', 'Achievements'], ['refs', 'References'], ['versions', 'Versions'], ['check', 'Check']
];
export const LIST_SECS = ['work', 'projects', 'courses', 'positions', 'achievements', 'refs'];
export const LINT_TO_NAV = { hobbies: 'achievements' };

function deepMerge(a, b) {
  if (Array.isArray(a) || typeof a !== 'object' || a === null) return b === undefined ? a : b;
  const o = Object.assign({}, a);
  Object.keys(b || {}).forEach(k => { o[k] = (a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) && b[k] && typeof b[k] === 'object') ? deepMerge(a[k], b[k]) : b[k]; });
  return o;
}
export function normalize(s) {
  const b = Core.blankState();
  const out = Object.assign({}, b, s);
  out.master = deepMerge(b.master, s.master || {});
  out.versions = (s.versions && s.versions.length ? s.versions : b.versions).map(v => Object.assign(Core.newVersion(v.name), v, {
    skills: Object.assign({ technical: [], soft: [], interests: [] }, v.skills),
    order: Object.assign({ work: [], projects: [], courses: [], positions: [], achievements: [], refs: [] }, v.order)
  }));
  if (!out.versions.find(v => v.id === out.activeVersion)) out.activeVersion = out.versions[0].id;
  return out;
}
export const curVer = () => state.versions.find(v => v.id === state.activeVersion);
export const find = (sec, id) => state.master[sec].find(x => x.id === id);
export function setPath(obj, path, val) { const p = path.split('.'); let o = obj; for (let i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = val; }
export function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? '' : o[k]), obj); }
