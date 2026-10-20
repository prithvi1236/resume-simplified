/* Word/PDF download, JSON backup and restore, and PDF import. */
import Core from '../resume/core.js';
import ResumeImport from '../resume/import.js';
import DocxGen from '../resume/docx.js';
import PdfGen from '../resume/pdf.js';
import ResumeFonts from '../resume/fonts.js';
import { toast, fname } from './dom.js';
import { state, ui, normalize, setState } from './state.js';
import { Store } from './store.js';
import { touch } from './history.js';
import { renderAll } from './layout.js';
import { renderEditor } from './editor/render.js';

async function makeFile(verId, fmt) {
  const lib = fmt === 'pdf' ? (window.jspdf && window.jspdf.jsPDF) : window.docx;
  if (!lib) throw new Error('The ' + (fmt === 'pdf' ? 'PDF' : 'Word') + ' exporter did not load. Check your connection and reload.');
  const v = state.versions.find(x => x.id === (verId || state.activeVersion));
  const model = Core.compose(state, v.id);
  const blob = fmt === 'pdf' ? PdfGen.build(lib, model, ResumeFonts).output('blob') : await lib.Packer.toBlob(DocxGen.build(lib, model));
  const nm = (state.master.personal.name || 'Resume').trim().toUpperCase();
  return { blob, name: fname(nm + ' - Resume' + (state.versions.length > 1 ? ' - ' + v.name : ''), fmt), errs: Core.lintState(state, v.id).err };
}
export async function download(verId, fmt) {
  fmt = fmt || 'docx';
  if (!Store.dl) { toast('File downloads are not available in this view.'); return; }
  try {
    const f = await makeFile(verId, fmt);
    await Store.dl.save({ filename: f.name, data: f.blob });
    if (f.errs) toast('Downloaded with ' + f.errs + ' unresolved guideline ' + (f.errs === 1 ? 'error' : 'errors') + '. See Guideline check.');
  } catch (e) { if (e && e.message && !e.code) toast(e.message); else if (!e || e.code !== 'declined') toast('Could not save the file' + (e && e.code ? ' (' + e.code + ')' : '') + '.'); }
}

export async function backup() {
  if (!Store.dl) { toast('File downloads are not available in this view.'); return; }
  try { await Store.dl.save({ filename: 'resume-desk-backup.json', data: JSON.stringify(state, null, 1) }); } catch (e) { if (!e || e.code !== 'declined') toast('Could not save the backup.'); }
}
export async function importFrom(file) {
  if (!file) return;
  ui.impBusy = true; ui.imp = null; renderEditor();
  try {
    const parsed = await ResumeImport.parse(window.pdfjsLib, await file.arrayBuffer());
    const nm = state.master.personal.name.trim();
    ui.imp = { parsed, file: file.name, name: file.name.replace(/\.pdf$/i, ''), overwrite: !nm };
  } catch (e) { toast('Could not read that PDF as a resume: ' + (e && e.message ? e.message : 'unknown error')); }
  ui.impBusy = false; renderEditor();
}
export function restoreFrom(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result); if (!s.master || !s.versions) throw new Error('shape');
      setState(normalize(s)); ui.open.clear(); touch(); renderAll(); toast('Backup restored.');
    } catch (e) { toast('That file is not a valid backup.'); }
  };
  r.readAsText(file);
}
