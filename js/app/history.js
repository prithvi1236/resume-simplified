/* Saving after edits, the save-status pill, and undo/redo. */
import { $, toast } from './dom.js';
import { state, ui, normalize, setState } from './state.js';
import { Store } from './store.js';
import { renderAll } from './layout.js';

let saveTimer = null;
export function touch() { ui.save = 'dirty'; paintStatus(); clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 700); History.note(); }

/* Undo / redo: snapshots of the whole state. Edits that arrive close together (typing) settle into one step. */
export const History = {
  undo: [], redo: [], base: null, timer: null, LIMIT: 100,
  reset() { this.undo = []; this.redo = []; this.base = JSON.stringify(state); clearTimeout(this.timer); this.timer = null; this.paint(); },
  note() { if (this.base == null || this.busy) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.settle(), 600); this.paint(true); },
  settle() {
    clearTimeout(this.timer); this.timer = null;
    const cur = JSON.stringify(state);
    if (cur !== this.base) { this.undo.push(this.base); if (this.undo.length > this.LIMIT) this.undo.shift(); this.redo = []; this.base = cur; }
    this.paint();
  },
  step(back) {
    this.settle();
    const from = back ? this.undo : this.redo, to = back ? this.redo : this.undo;
    if (!from.length) return;
    to.push(this.base); this.base = from.pop();
    // Leave any field first so a pending page edit cannot write the old text back.
    const a = document.activeElement; if (a && a !== document.body && a.blur) { this.busy = true; a.blur(); }
    setTimeout(() => {
      setState(normalize(JSON.parse(this.base))); ui.sel = ''; ui.zoom = null;
      this.busy = true; touch(); this.busy = false;
      clearTimeout(this.timer); this.timer = null;
      renderAll(); this.paint();
      toast(back ? 'Undone.' : 'Redone.');
    }, 0);
  },
  paint(pending) { const u = $('#undo'), r = $('#redo'); if (!u) return; u.disabled = !(this.undo.length || pending); r.disabled = !this.redo.length || !!pending; }
};
async function doSave() {
  ui.save = 'saving'; paintStatus();
  try { await Store.save(state); ui.save = 'saved'; } catch (e) { ui.save = Store.mode === 'memory' ? 'memory' : 'error'; }
  paintStatus();
}
export function paintStatus() {
  const el = $('#status'); if (!el) return;
  const map = {
    loading: ['Loading your data', 'wait'], dirty: ['Unsaved changes', 'wait'], saving: ['Saving', 'wait'],
    saved: [Store.mode === 'cloud' ? 'Saved to your account' : 'Saved in this browser', 'ok'],
    memory: ['Not saved. Download a backup', 'bad'], error: ['Save failed. Will retry on next edit', 'bad']
  };
  const [t, c] = map[ui.save] || map.saved;
  el.textContent = t; el.className = 'pill ' + c;
}
