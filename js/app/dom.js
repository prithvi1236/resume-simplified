/* Small DOM helpers shared by every part of the app. */

export const $ = s => document.querySelector(s);

export function toast(msg) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 3800);
}
export function fname(base, ext) { return (base || 'Resume').replace(/[\\/:*?"<>|]+/g, '').trim() + '.' + ext; }
