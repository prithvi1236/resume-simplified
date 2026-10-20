/* Reads a PDF made with this template back into resume data (text via pdf.js). */
import Core from './core.js';

const ResumeImport = (function () {
  'use strict';

  const HEADINGS = [
    ['skills', /^SKILLS\s*(&|AND)\s*INTERESTS$/i], ['edu', /^EDUCATION$/i], ['work', /^WORK\s+EXPERIENCE$/i],
    ['projects', /^PROJECTS$/i], ['courses', /^COURSES\s*(&|AND)\s*CERTIFICATIONS$/i], ['positions', /^KEY\s+POSITIONS$/i],
    ['achievements', /^ACHIEVEMENTS\s*(&|AND)\s*ACTIVITIES$/i], ['refs', /^REFERENCES$/i]
  ];
  const BULLET = /^[\u2022\u00b7\u25cf\u25aa\u2023\uf000-\uf0ff]$/;
  const clean = s => String(s || '').replace(/[\u00a0\s]+/g, ' ').trim();

  /* ---------- 1. read the PDF into lines of styled runs ---------- */
  async function readLines(pdfjsLib, buf) {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    const pages = [];
    for (let pn = 1; pn <= doc.numPages; pn++) {
      const page = await doc.getPage(pn);
      const vp = page.getViewport({ scale: 1 });
      await page.getOperatorList();
      const tc = await page.getTextContent();
      const annots = (await page.getAnnotations()).filter(a => a.url && a.rect);
      const fontInfo = {};
      const info = fn => {
        if (fontInfo[fn]) return fontInfo[fn];
        let nm = '';
        try { nm = page.commonObjs.has(fn) ? (page.commonObjs.get(fn).name || '') : ''; } catch (e) { /* ignore */ }
        return (fontInfo[fn] = { b: /bold|black|heavy|semibold/i.test(nm), i: /italic|oblique/i.test(nm), sym: /symbol|wingding/i.test(nm) });
      };
      const items = [];
      tc.items.forEach(it => {
        if (typeof it.str !== 'string') return;
        const size = Math.hypot(it.transform[2], it.transform[3]) || it.height || 9;
        const f = info(it.fontName), x = it.transform[4], y = it.transform[5];
        const url = (annots.find(a => x + it.width / 2 >= a.rect[0] - 0.5 && x + it.width / 2 <= a.rect[2] + 0.5 && y >= a.rect[1] - 3 && y <= a.rect[3] + 1) || {}).url || null;
        items.push({ t: it.str, x, y, w: it.width, size, b: f.b, i: f.i, sym: f.sym, url });
      });
      // cluster into lines by baseline
      items.sort((a, b) => b.y - a.y || a.x - b.x);
      const lines = [];
      items.forEach(it => {
        if (!it.t.length && !it.w) return;
        const L = lines.find(l => Math.abs(l.y - it.y) <= (it.size < 7 ? 5 : 3.5));
        if (L) L.items.push(it); else lines.push({ y: it.y, items: [it], page: pn });
      });
      lines.sort((a, b) => b.y - a.y);
      lines.forEach(l => { l.items.sort((a, b) => a.x - b.x); l.pageH = vp.height; l.pageW = vp.width; });
      pages.push(lines);
    }
    return pages;
  }

  /* build segments (split at wide gaps) and runs (style + link) for a line */
  function shape(line) {
    const its = line.items.filter(i => i.t.length || i.w > 0);
    let bullet = false, first = its[0];
    if (first && (BULLET.test(first.t.trim()) || (first.sym && first.t.trim().length <= 1 && first.t.trim().length > 0))) { bullet = true; its.shift(); }
    else if (first && first.sym && !first.t.trim()) { bullet = true; its.shift(); }
    const segs = []; let cur = null, prevEnd = null, prev = null;
    its.forEach(it => {
      const ws = !it.t.trim();
      if (prevEnd !== null && (ws ? it.w > 20 : it.x - prevEnd > 20)) { cur = null; }
      if (ws && (!cur || it.w > 20)) { prevEnd = it.x + it.w; prev = it; return; }
      if (!cur) { cur = { runs: [], x0: it.x, x1: it.x }; segs.push(cur); prevEnd = null; prev = null; }
      let text = it.t;
      if (prev && !ws && !/\s$/.test(prev.t) && !/^\s/.test(text) && it.x - prevEnd > Math.max(0.9, it.size * 0.17)) text = ' ' + text;
      const last = cur.runs[cur.runs.length - 1];
      const style = ws && last ? { b: last.b, i: last.i, url: last.url } : { b: it.b, i: it.i, url: it.url };
      if (last && last.b === style.b && last.i === style.i && (last.url || null) === (style.url || null) && !ws) last.t += text;
      else if (last && ws) last.t += text;
      else if (last && (last.url || null) === (style.url || null) && last.b === style.b && last.i === style.i) last.t += text;
      else cur.runs.push({ t: text, b: style.b, i: style.i, url: style.url, sup: it.size < 7 });
      cur.x1 = it.x + it.w; prevEnd = it.x + it.w; prev = it;
    });
    const text = segs.map(s => s.runs.map(r => r.t).join('')).join(' \t ');
    return { bullet, segs, text: clean(text.replace(/ \t /g, ' \t ')), x0: its.length ? its[0].x : 0, y: line.y, pageH: line.pageH, pageW: line.pageW, page: line.page };
  }
  const segText = s => clean(s ? s.runs.map(r => r.t).join('') : '');
  const left = l => (l.segs.length > 1 ? clean(l.segs.slice(0, -1).map(segText).join(' ')) : segText(l.segs[0]));
  const right = l => (l.segs.length > 1 ? segText(l.segs[l.segs.length - 1]) : '');

  /* ---------- 2. split into sections and bullet entries ---------- */
  function sectionize(pages) {
    const out = { header: [], sections: {} }; let cur = null; let name = '';
    pages.forEach((lines, pi) => {
      const shaped = lines.map(shape).filter(l => l.text);
      shaped.forEach((l, li) => {
        if (l.y < 30) return; // footer
        if (pi > 0 && li === 0 && !HEADINGS.some(h => h[1].test(l.text)) && !l.bullet) return; // repeated name on page 2+
        if (pi === 0 && li === 0) { name = l.text; out.header.push(l); return; }
        const h = HEADINGS.find(x => x[1].test(l.text.replace(/\s*\t\s*/g, ' ')));
        if (h && !l.bullet) { cur = h[0]; out.sections[cur] = out.sections[cur] || []; return; }
        if (!cur) { out.header.push(l); return; }
        out.sections[cur].push(l);
      });
    });
    out.name = name;
    return out;
  }
  function entries(lines) {
    const list = [];
    lines.forEach(l => { if (l.bullet || !list.length) list.push([l]); else list[list.length - 1].push(l); });
    return list;
  }

  /* ---------- 3. helpers to turn lines into text ---------- */
  function markup(lines) {
    // tokens with style, joined across wrapped lines; whitespace inherits the previous style
    const segs = [];
    lines.forEach((l, li) => {
      const runs = l.segs.reduce((a, s) => a.concat(s.runs), []);
      runs.forEach((r, ri) => {
        let t = r.t; if (!t) return;
        if (li > 0 && ri === 0 && segs.length && !/\s$/.test(segs[segs.length - 1].t)) t = ' ' + t;
        const ws = !t.trim(), last = segs[segs.length - 1];
        const b = ws && last ? last.b : r.b;
        if (last && last.b === b && (!r.url || !last.url || last.url === r.url)) { last.t += t; if (r.url && !last.url) last.url = r.url; }
        else segs.push({ t, b, url: r.url || null });
      });
    });
    let out = '', boldIdx = -1, url = '', linkIdx = 0;
    segs.forEach(s => {
      const t = s.t.replace(/\s+/g, ' ');
      if (s.b && t.trim()) {
        boldIdx++;
        const lead = t.match(/^\s*/)[0], trail = t.match(/\s*$/)[0];
        out += lead + '**' + t.trim() + '**' + trail;
        if (s.url && !url) { url = s.url; linkIdx = boldIdx; }
      } else out += t;
    });
    // segments that are bold only because of a stray space run collapse to plain text
    return { text: clean(out).replace(/\*\*\s*\*\*/g, ' '), url, linkIdx };
  }
  const plainOf = lines => clean(lines.map(l => l.segs.map(segText).join(' ')).join(' '));
  const splitList = s => {
    const out = []; let depth = 0, cur = '';
    for (const ch of s) {
      if (ch === '(') depth++; if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    const seen = new Set();
    return out.map(clean).filter(x => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase()));
  };
  function duration(s) {
    s = clean(s);
    if (/^ongoing$/i.test(s)) return { dNum: '', dUnit: 'Ongoing' };
    const m = s.match(/^(\d+)\s*(day|week|month)s?$/i);
    return m ? { dNum: m[1], dUnit: m[2][0].toUpperCase() + m[2].slice(1).toLowerCase() + 's' } : { dNum: '', dUnit: 'Months' };
  }

  /* ---------- 4. parse ---------- */
  async function parse(pdfjsLib, buf) {
    const warnings = [];
    const pages = await readLines(pdfjsLib, buf);
    const S = sectionize(pages);
    const P = { personal: {}, edu: {}, skills: { technical: [], soft: [], interests: [] }, work: [], projects: [], courses: [], positions: [], achievements: [], hobbies: [], refs: [], inst: {} };

    // header
    const hdr = S.header;
    if (!hdr.length) throw new Error('No header found. This does not look like a Resume Desk template PDF.');
    P.personal.name = Core.titleCase(clean(S.name).toLowerCase());
    hdr.slice(1).forEach(l => {
      const all = l.segs.map(segText).join(' ');
      l.segs.forEach(sg => { const em = segText(sg).replace(/\s+/g, '').match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/); if (em && !P.personal.email) P.personal.email = em[0]; });
      const dob = all.match(/(\d{1,2}\/\d{1,2}\/\d{4})/); if (dob) P.personal.dob = dob[1].replace(/^(\d)\//, '0$1/').replace(/\/(\d)\//, '/0$1/');
      const ph = all.match(/(\+\d{1,3}[\s\d]{7,14}\d)/); if (ph) P.personal.phone = clean(ph[1]);
      l.segs.forEach(s => s.runs.forEach(r => {
        if (!r.url) return;
        if (/linkedin/i.test(r.t)) P.personal.linkedin = r.url;
        else if (/github/i.test(r.t)) P.personal.github = r.url;
        else if (/portfolio/i.test(r.t)) P.personal.portfolio = r.url;
      }));
    });
    if (!P.personal.email) warnings.push('Could not read the email address.');

    // skills
    let key = null; const acc = { technical: '', soft: '', interests: '' };
    (S.sections.skills || []).forEach(l => {
      const t = plainOf([l]);
      const m = t.match(/^(Technical Skills|Soft Skills|Interests)\s*:\s*(.*)$/i);
      if (m) { key = /technical/i.test(m[1]) ? 'technical' : /soft/i.test(m[1]) ? 'soft' : 'interests'; acc[key] += ' ' + m[2]; }
      else if (key) acc[key] += ' ' + t;
    });
    Object.keys(acc).forEach(k => { P.skills[k] = splitList(acc[k]); });

    // education
    entries(S.sections.edu || []).forEach(en => {
      const l1 = en[0], l2 = en[1]; if (!l2) return;
      let inst = left(l1), score = right(l1);
      if (!score) { const m = plainOf([l1]).match(/^(.*?)\s+([\d.]+%?)\s*\|\s*(\d{4})$/); if (m) { inst = m[1]; score = m[2] + ' | ' + m[3]; } }
      const sm = score.match(/^([\d.]+)\s*%?\s*\|\s*(\d{4})$/); if (!sm) return;
      const sub = plainOf([l2]);
      if (/^KTU/i.test(sub) || /B\.?\s*Tech/i.test(sub)) {
        P.edu.btech = { cgpa: sm[1], year: sm[2] };
        const b = sub.match(/B\.?\s*Tech\s+in\s+(.+)$/i); if (b) { const br = Object.keys(Core.BRANCHES).find(k => k.toLowerCase() === clean(b[1]).toLowerCase()); if (br) P.edu.branch = br; else warnings.push('Branch "' + clean(b[1]) + '" was not recognised.'); }
      } else if (/^SBTE/i.test(sub)) {
        P.edu.diploma = { on: true, inst, board: 'SBTE', branch: clean(sub.replace(/^SBTE\s*,?\s*/i, '')), cgpa: sm[1], year: sm[2] };
      } else {
        const board = (sub.match(/^(CBSE|ICSE|State)/i) || [''])[0]; const b = board ? board[0].toUpperCase() + board.slice(1).toLowerCase() : 'CBSE';
        const boardName = /^state$/i.test(b) ? 'State' : b.toUpperCase();
        const k = /12/.test(sub) ? 'c12' : /10/.test(sub) ? 'c10' : null;
        if (k) P.edu[k] = { on: true, inst, board: boardName, pct: sm[1], year: sm[2] };
      }
    });

    // work
    entries(S.sections.work || []).forEach(en => {
      const l1 = en[0]; if (!l1.bullet) return;
      const d = duration(right(l1));
      const comp = l1.segs[0].runs.find(r => r.url);
      const it = Object.assign(Core.blankItem('work'), { company: left(l1), url: comp ? comp.url : '' }, d);
      it.role = en[1] ? left(en[1]) : '';
      let i = 2;
      if (en[2] && /^Technologies Used\s*:/i.test(plainOf([en[2]]))) { it.tech = clean(plainOf([en[2]]).replace(/^Technologies Used\s*:/i, '')); i = 3; }
      it.desc = plainOf(en.slice(i));
      P.work.push(it);
    });

    // projects
    entries(S.sections.projects || []).forEach(en => {
      const l1 = en[0]; if (!l1.bullet) return;
      const ts = right(l1).match(/team\s*size\s*:\s*(\d+)/i);
      const it = Object.assign(Core.blankItem('projects'), { title: left(l1), team: ts ? ts[1] : '1' });
      if (en[1]) { it.role = left(en[1]); Object.assign(it, duration(right(en[1]))); }
      let i = 2;
      if (en[2] && /^Technologies Used\s*:/i.test(plainOf([en[2]]))) { it.tech = clean(plainOf([en[2]]).replace(/^Technologies Used\s*:/i, '')); i = 3; }
      it.desc = plainOf(en.slice(i));
      P.projects.push(it);
    });

    // one-liners
    const rich = (sec, withLink) => entries(S.sections[sec] || []).forEach(en => {
      if (!en[0].bullet) return;
      const m = markup(en);
      const pl = m.text.replace(/\*\*/g, '');
      if (sec === 'achievements' && /^Hobbies\s*:/i.test(pl)) { P.hobbies = splitList(pl.replace(/^Hobbies\s*:/i, '')); return; }
      const it = Core.blankItem(sec); it.text = m.text;
      if (withLink) { it.url = m.url; it.linkIdx = m.linkIdx; }
      if (sec === 'achievements') it.level = 'Within College';
      P[sec].push(it);
    });
    rich('courses', true); rich('positions', false); rich('achievements', true);

    // references
    entries(S.sections.refs || []).forEach(en => {
      const t = plainOf(en);
      const m = t.match(/^(.*?),\s*(.*?),?\s*Email ID\s*:\s*(\S+)\s*$/i); if (!m) { warnings.push('Could not read a reference line.'); return; }
      const name = clean(m[1]), det = clean(m[2]).replace(/,$/, ''), email = m[3];
      if (/^principal\b/i.test(det)) { P.inst.pName = name; P.inst.pDetails = det; P.inst.pEmail = email; }
      else if (/^HOD\b/i.test(det)) { P.inst.hName = name; P.inst.hDetails = det; P.inst.hEmail = email; }
      else { const at = det.match(/^(.*?)\s+at\s+(.*)$/i); P.refs.push(Object.assign(Core.blankItem('refs'), { name, post: at ? at[1] : det, org: at ? at[2] : '', email })); }
    });

    if (!P.edu.btech) warnings.push('No B.Tech education entry was found.');
    ['work', 'projects', 'courses', 'positions', 'achievements'].forEach(k => { /* optional sections */ });
    return { data: P, warnings, counts: { technical: P.skills.technical.length, soft: P.skills.soft.length, interests: P.skills.interests.length, work: P.work.length, projects: P.projects.length, courses: P.courses.length, positions: P.positions.length, achievements: P.achievements.length, hobbies: P.hobbies.length, refs: P.refs.length } };
  }

  /* ---------- 5. add as a new version ---------- */
  function keyOf(sec, it) {
    if (sec === 'work') return (it.company + '|' + it.role).toLowerCase();
    if (sec === 'projects') return it.title.toLowerCase();
    if (sec === 'refs') return (it.name + '|' + it.email).toLowerCase();
    return Core.plain(it.text).toLowerCase();
  }
  function apply(state, parsed, opts) {
    const P = parsed.data, m = state.master, v = Core.newVersion(opts.name || 'Imported resume');
    const setIf = (obj, k, val) => { if (val && (opts.overwrite || !String(obj[k] || '').trim() || (k === 'phone' && String(obj[k]).trim().length <= 4))) obj[k] = val; };
    Object.keys(P.personal).forEach(k => setIf(m.personal, k, P.personal[k]));
    if (P.edu.branch && (opts.overwrite || !m.edu.btech.cgpa)) m.edu.branch = P.edu.branch;
    if (P.edu.btech) Object.keys(P.edu.btech).forEach(k => setIf(m.edu.btech, k, P.edu.btech[k]));
    ['c12', 'c10', 'diploma'].forEach(k => { if (P.edu[k]) { const empty = k === 'diploma' ? !m.edu.diploma.on : !m.edu[k].inst; if (opts.overwrite || empty) Object.assign(m.edu[k], P.edu[k]); } });
    const D = Core.defaults(m.edu.branch);
    Object.keys(P.inst).forEach(k => { if (P.inst[k] && P.inst[k] !== D[k] && (opts.overwrite || !m.inst[k])) m.inst[k] = P.inst[k]; });
    ['technical', 'soft', 'interests'].forEach(g => {
      P.skills[g].forEach(s => { if (!m.skills[g].includes(s)) m.skills[g].push(s); });
      v.skills[g] = P.skills[g].slice();
    });
    ['work', 'projects', 'courses', 'positions', 'achievements', 'refs'].forEach(sec => {
      P[sec].forEach(it => {
        const ex = m[sec].find(x => keyOf(sec, x) === keyOf(sec, it));
        if (ex) { if (!v.order[sec].includes(ex.id)) v.order[sec].push(ex.id); }
        else { m[sec].push(it); v.order[sec].push(it.id); }
      });
    });
    if (P.hobbies.length) { P.hobbies.forEach(h => { if (!m.hobbies.includes(h) && m.hobbies.length < 4) m.hobbies.push(h); }); v.hobbies = true; } else v.hobbies = false;
    state.versions.push(v); state.activeVersion = v.id;
    return v;
  }

  return { parse, apply };
})();
export default ResumeImport;
