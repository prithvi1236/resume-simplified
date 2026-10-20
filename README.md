# Resume Desk

Build, check and export resumes in the college template. Static site: no build step.

## Run locally

The app uses ES modules, which browsers will not load from a `file://` page, so serve the folder:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Deployed as-is on Vercel (static).

## Layout

```
index.html            markup only; loads the stylesheets, vendor scripts and js/app/main.js
sw.js                 offline cache (network first); list every new file in PRECACHE and bump CACHE
css/                  loaded in this order, so later files override earlier ones
  base.css            design tokens (light/dark) and resets
  controls.css        top bar, buttons, form controls
  layout.css          page/details split, nav, side panel shell
  editor.css          side-panel fields, cards, chips, check list
  sheet.css           the resume page, editing on it, zoom on edit
  toast.css           toast messages
  responsive.css      narrow screens and motion preferences
js/vendor/            third-party UMD builds: docx, jsPDF, pdf.js (+ worker); never edited
js/resume/            resume logic with no DOM
  core.js             data model, guideline checks, layout model shared by page and exports
  docx.js, pdf.js     Word and PDF exporters
  import.js           reads a PDF made with this template back into data
  fonts.js            embedded fonts (base64)
js/app/               the user interface
  main.js             entry point: wiring and boot
  state.js            resume state and UI state (replace the state only via setState)
  store.js            where data is saved (Claude account, browser, or memory)
  history.js          autosave, save status, undo/redo
  layout.js           whole-app redraw, page/details views
  issues.js           guideline issue counts and messages
  files.js            download/backup/import
  dom.js              small DOM helpers
  editor/             the side panel: one file per section, plus shared fields, events and render
  page/               the resume page: markup, render/paginate, zoom, caret, apply edits, select, events
```

Each module imports exactly what it uses and exports only what other modules import.
