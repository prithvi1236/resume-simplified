/* Builds the Word document from a composed resume model (uses the docx library). */
const DocxGen = (function () {
  'use strict';

  function build(docx, model) {
    const { Document, Paragraph, TextRun, ExternalHyperlink, AlignmentType, TabStopType, BorderStyle, Header, Footer, LevelFormat, Tab } = docx;
    const F = 'Aptos Display', SZ = 18, RIGHT = 10466;

    const tr = (r, extra) => new TextRun(Object.assign({
      text: r.t, font: F, size: SZ, bold: !!r.b, italics: !!r.i, superScript: !!r.sup, color: r.color || '000000'
    }, extra || {}));
    const runs = list => list.map(r => (r.link ? new ExternalHyperlink({ link: r.link, children: [tr(r)] }) : tr(r)));
    const tab = () => new TextRun({ children: [new Tab()], font: F, size: SZ });

    /* ----- header ----- */
    const h = model.header;
    const nameRun = () => new TextRun({ text: h.name, bold: true, size: 32, font: F });
    const firstHeader = () => {
      const linkKids = [];
      h.links.forEach((l, i) => {
        if (i > 0) linkKids.push(new TextRun({ text: ' | ', font: F, size: 20 }));
        linkKids.push(l.url ? new ExternalHyperlink({ link: l.url, children: [tr({ t: l.t, color: '467886' })] }) : tr({ t: l.t }));
      });
      linkKids.push(tab());
      linkKids.push(new ExternalHyperlink({ link: 'mailto:' + h.email, children: [tr({ t: h.email })] }));
      return new Header({
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [nameRun()] }),
          new Paragraph({ spacing: { after: 0 }, tabStops: [{ type: TabStopType.RIGHT, position: RIGHT }], children: linkKids }),
          new Paragraph({
            spacing: { after: 0 }, tabStops: [{ type: TabStopType.RIGHT, position: RIGHT }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 17, space: 1, color: '000000' } },
            children: [tr({ t: h.dob }), tab(), tr({ t: h.phone })]
          })
        ]
      });
    };
    const nextHeader = () => new Header({
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [nameRun()] }),
        new Paragraph({
          spacing: { after: 0 }, run: { size: 24, font: F },
          border: { bottom: { style: BorderStyle.SINGLE, size: 17, space: 1, color: '000000' } },
          children: [new TextRun({ text: '', font: F, size: 24 })]
        })
      ]
    });
    const footer = () => new Footer({
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Govt. Model Engineering College, Kochi', font: F, size: 18 })] })]
    });

    /* ----- body ----- */
    const children = [];
    model.blocks.forEach(b => {
      children.push(new Paragraph({
        keepNext: true, spacing: { before: 80, after: 0, line: 240 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 1, color: 'auto' } },
        children: [new TextRun({ text: b.title, bold: true, font: F, size: SZ })]
      }));
      b.items.forEach(it => it.lines.forEach(l => {
        if (l.kind === 'skill') {
          children.push(new Paragraph({
            numbering: { reference: 'b', level: 0 },
            indent: { left: 2410, hanging: 2050 },
            spacing: { after: 0, line: 240 },
            tabStops: [{ type: TabStopType.LEFT, position: 720 }, { type: TabStopType.LEFT, position: 2410 }],
            children: [tr({ t: l.label, b: 1 }), tab(), tr({ t: l.value })]
          }));
          return;
        }
        const kids = runs(l.left);
        if (l.right && l.right.length) { kids.push(tab()); runs(l.right).forEach(k => kids.push(k)); }
        const o = {
          children: kids, spacing: { before: l.before || 0, after: 0, line: 240 },
          keepNext: !!l.keepNext, keepLines: true,
          tabStops: [{ type: TabStopType.RIGHT, position: RIGHT }]
        };
        if (l.bullet) o.numbering = { reference: 'b', level: 0 }; else o.indent = { left: 720 };
        children.push(new Paragraph(o));
      }));
    });

    return new Document({
      creator: h.name, title: h.name + ' - Resume',
      styles: { default: { document: { run: { font: F, size: SZ } } } },
      numbering: {
        config: [{
          reference: 'b',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: 'Arial' } } }]
        }]
      },
      sections: [{
        properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 720, right: 720, bottom: 720, left: 720, header: 680, footer: 283 } } },
        headers: { default: nextHeader(), first: firstHeader() },
        footers: { default: footer(), first: footer() },
        children
      }]
    });
  }
  return { build };
})();
export default DocxGen;
