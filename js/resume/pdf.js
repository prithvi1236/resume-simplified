/* Builds the PDF from a composed resume model (uses jsPDF and the embedded fonts). */
const PdfGen = (function () {
  'use strict';
  const BLUE = [70, 120, 134];

  function build(jsPDF, model, fonts) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const PW = 595.28, PH = 841.89, M = 36, CW = PW - 2 * M, FS = 9, LH = 10.99, BL = 11.55, BASE = 8.5, IND = 36, SKV = 120.5;
    const FAMS = { normal: 'AptosDisplay', bold: 'AptosDisplay-Bold', italic: 'AptosDisplay-Italic', bolditalic: 'AptosDisplay-BoldItalic' };
    if (fonts) Object.keys(fonts).forEach(st => { doc.addFileToVFS(FAMS[st] + '.ttf', fonts[st]); doc.addFont(FAMS[st] + '.ttf', FAMS[st], 'normal'); });
    const sf = st => (fonts ? doc.setFont(FAMS[st], 'normal') : doc.setFont('helvetica', st));
    const BOTTOM = PH - M;
    const font = r => (r.b && r.i ? 'bolditalic' : r.b ? 'bold' : r.i ? 'italic' : 'normal');
    const size = r => (r.sup ? 5.85 : r.big ? 10 : FS);
    const width = r => { sf(font(r)); doc.setFontSize(size(r)); return doc.getTextWidth(r.t); };
    const rgb = hex => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];

    function wrap(runs, maxW) {
      const lines = [[]]; let x = 0;
      runs.forEach(r => {
        String(r.t).split(/(\s+)/).forEach(tok => {
          if (!tok) return;
          const seg = Object.assign({}, r, { t: tok }); seg.w = width(seg);
          const ws = /^\s+$/.test(tok), cur = lines[lines.length - 1];
          if (ws && !cur.length) return;
          if (!ws && cur.length && x + seg.w > maxW) { while (cur.length && /^\s+$/.test(cur[cur.length - 1].t)) cur.pop(); lines.push([seg]); x = seg.w; return; }
          cur.push(seg); x += seg.w;
        });
      });
      return lines;
    }
    const lineW = segs => segs.reduce((a, s) => a + s.w, 0);
    function draw(segs, x, base) {
      segs.forEach(s => {
        sf(font(s)); doc.setFontSize(size(s));
        const c = s.color ? rgb(s.color) : (s.blue ? BLUE : [0, 0, 0]); doc.setTextColor(c[0], c[1], c[2]);
        doc.text(s.t, x, s.sup ? base - 3 : base);
        if (s.link) doc.link(x, base - FS + 1, s.w, FS + 2, { url: s.link });
        x += s.w;
      });
      doc.setTextColor(0, 0, 0);
    }
    const rule = (y, wt) => { doc.setLineWidth(wt); doc.setDrawColor(0, 0, 0); doc.line(M, y, PW - M, y); };

    /* header */
    const h = model.header;
    function headerFirst() {
      sf('bold'); doc.setFontSize(16); doc.text(h.name, PW / 2, 49, { align: 'center' });
      const left = [];
      h.links.forEach((l, i) => {
        if (i > 0) left.push({ t: ' | ', w: 0, big: 1 });
        left.push({ t: l.t, link: l.url || null, blue: !!l.url });
      });
      left.forEach(s => { s.w = width(s); });
      draw(left, M, 62.3);
      const em = { t: h.email, link: 'mailto:' + h.email }; em.w = width(em); draw([em], PW - M - em.w, 62.3);
      const dob = { t: h.dob }; dob.w = width(dob); draw([dob], M, 74.3);
      const ph = { t: h.phone }; ph.w = width(ph); draw([ph], PW - M - ph.w, 74.3);
      rule(78.68, 2.16);
      return 79.76;
    }
    function headerNext() {
      sf('bold'); doc.setFontSize(16); doc.text(h.name, PW / 2, 49, { align: 'center' });
      rule(70.58, 2.16); return 71.66;
    }

    /* layout of one line */
    function layout(l) {
      const before = (l.before || 0) / 20;
      if (l.kind === 'skill') {
        const val = wrap([{ t: l.value }], PW - M - (M + SKV)), lab = { t: l.label, b: 1 }; lab.w = width(lab);
        return { before, h: BL + (val.length - 1) * LH, draw(y) { draw([lab], M + IND, y + BASE); val.forEach((ln, i) => draw(ln, M + SKV, y + BASE + (i ? BL + (i - 1) * LH : 0))); bullet(y); } };
      }
      const x0 = M + IND;
      let rs = null, rw = 0;
      if (l.right && l.right.length) { rs = wrap(l.right, CW)[0]; rw = lineW(rs); }
      const lines = wrap(l.left, PW - M - x0 - (rw ? rw + 10 : 0));
      const first = l.bullet ? BL : LH, off = 0;
      return { before, h: first + (lines.length - 1) * LH, draw(y) { lines.forEach((ln, i) => draw(ln, x0, y + BASE + off + (i ? first - off + (i - 1) * LH : 0))); if (rs) draw(rs, PW - M - rw, y + BASE + off); if (l.bullet) bullet(y + off); } };
    }
    function bullet(y) { sf('normal'); doc.setFontSize(FS); doc.text('\u2022', M + 18, y + BASE); }

    /* flow */
    let y = headerFirst();
    const usable = BOTTOM - M - 22;
    function ensure(need) { if (y + need > BOTTOM && need < usable) { doc.addPage(); y = headerNext(); } }
    model.blocks.forEach(b => {
      const items = b.items.map(it => { const ls = it.lines.map(layout); return { ls, h: ls.reduce((a, l) => a + l.before + l.h, 0) }; });
      ensure(4 + LH + 2 + (items[0] ? items[0].h : 0));
      y += 4; sf('bold'); doc.setFontSize(FS); doc.setTextColor(0, 0, 0); doc.text(b.title, M, y + BASE); y += LH; rule(y + 1.4, 0.5); y += 1.6;
      items.forEach(it => {
        ensure(it.h);
        it.ls.forEach(l => { y += l.before; if (y + l.h > BOTTOM) { doc.addPage(); y = headerNext(); } l.draw(y); y += l.h; });
      });
    });

    /* footer */
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      doc.setPage(p); sf('normal'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
      doc.text('Govt. Model Engineering College, Kochi', PW / 2, PH - 16.5, { align: 'center' });
    }
    doc.setProperties({ title: h.name + ' - Resume', author: h.name });
    return doc;
  }
  return { build };
})();
export default PdfGen;
