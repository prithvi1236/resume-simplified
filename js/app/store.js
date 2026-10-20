/* Where the resume is saved: the viewer's Claude account, this browser, or memory only. */

/* Plain browser download, used when the page runs as a standalone file (no Claude runtime). */
function standaloneDl() {
  return {
    save: async ({ filename, data }) => {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob), el = document.createElement('a');
      el.href = url; el.download = filename; document.body.appendChild(el); el.click(); el.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  };
}

export const Store = {
  mode: 'memory', db: null, uid: null, dl: null,
  async init() {
    try {
      if (window.claude && window.claude.use) {
        const ask = n => window.claude.use(n).catch(() => null);
        const [db, user, dl] = await Promise.all([ask('db'), ask('user'), ask('downloads')]);
        this.dl = dl;
        if (db && user) { const id = await user.id(); if (id) { this.db = db; this.uid = id; this.mode = 'cloud'; } }
      }
    } catch (e) { /* fall through to local */ }
    if (!window.claude) this.dl = standaloneDl();
    if (this.mode !== 'cloud') {
      try { localStorage.setItem('rd_probe', '1'); localStorage.removeItem('rd_probe'); this.mode = 'local'; } catch (e) { this.mode = 'memory'; }
    }
  },
  ref() { return this.db.doc('data/users/' + this.uid + '/resume'); },
  async load() {
    if (this.mode === 'cloud') {
      try { const s = await this.ref().get(); if (s.exists) return JSON.parse(s.data().json); } catch (e) { /* ignore */ }
      return null;
    }
    if (this.mode === 'local') { try { const j = localStorage.getItem('resumedesk.v1'); if (j) return JSON.parse(j); } catch (e) { /* ignore */ } }
    return null;
  },
  async save(st) {
    const json = JSON.stringify(st);
    if (this.mode === 'cloud') await this.ref().set({ json, updatedAt: Date.now() });
    else if (this.mode === 'local') localStorage.setItem('resumedesk.v1', json);
    else throw new Error('memory');
  }
};
