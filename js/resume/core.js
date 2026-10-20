/* Resume data model, guideline rules and layout (no DOM): shared by the app and both exporters. */
const Core = (function () {
  'use strict';

  /* ---------- Institution constants (from MEC guidelines) ---------- */
  const INSTITUTION = 'Govt. Model Engineering College';
  const PRINCIPAL = { name: 'Prof. Dr. Jayachandran E S', email: 'principal@mec.ac.in' };
  const HOD_CSE = { name: 'Prof. Dr. Sindhu L', dept: 'Computer Science Engineering', email: 'sl@mec.ac.in' };
  const HOD_CSBS = { name: 'Prof. Dr. Binu V P', dept: 'Computer Science Engineering', email: 'binuvp@mec.ac.in' };
  const LINK = '467886';
  const HOD_ECE = { name: 'Prof. Dr. Jobymol Jacob', dept: 'Electronics and Communication Engineering', email: 'hodec@mec.ac.in' };
  const BRANCHES = {
    'Computer Science Engineering': { key: 'cse', hod: HOD_CSE },
    'Computer Science and Business Systems': { key: 'csbs', hod: HOD_CSBS },
    'Electrical and Electronics Engineering': { key: 'eee', hod: { name: 'Prof. Dr. Bindu V', dept: 'Electrical and Electronics Engineering', email: 'hodeee@mec.ac.in' } },
    'Electronics and Communication Engineering': { key: 'ece', hod: HOD_ECE },
    'Electronics Engineering in VLSI Design and Technology': { key: 'ece', hod: HOD_ECE },
    'Electronics and Biomedical Engineering': { key: 'ebe', hod: { name: 'Prof. Dr. Minimol B', dept: 'Electronics and Biomedical Engineering', email: 'hodbe@mec.ac.in' } },
    'Mechanical Engineering': { key: 'me', hod: { name: 'Prof. Dr. Rajesh V G', dept: 'Mechanical Engineering', email: 'hodme@mec.ac.in' } }
  };
  const LEVELS = ['International', 'National', 'State', 'Zonal / District', 'Within College', 'Other'];
  const BOARDS = ['CBSE', 'ICSE', 'State'];

  /* ---------- Approved sentence structures ---------- */
  const PATTERNS = {
    workDone: [
      'Worked as a <Role>, <work done>.',
      'Gained practical experience in <work done>.',
      'Contributed to the development and implementation of <Project>.',
      'Involved in the development of a <Project> aimed at <objective>.',
      'Assisted in the design and implementation of <Project>.',
      'Developed practical skills in <tools or systems>.',
      'Enhanced technical proficiency in <skills or technologies>.',
      'Direct involvement in the development of <Project>.',
      'Acquired hands-on expertise in <work done>.'
    ],
    workOn: [
      'Currently working as a <Role>, <nature of work>.',
      'Actively involved in the development of a <Project> as a <Role>.',
      'Involved in <work>, gaining valuable experience in <domain>.',
      'Contributing to a <Project> as a <Role>.',
      'Acting as a <Role> in <task or responsibility>, contributing to <project or domain>.'
    ],
    projDone: [
      'Designed and developed a <Project Name> to <function>.',
      'Created a <Project Name> designed to <function>.',
      'Contributed to the development of <Project Name>, a <major functions>.',
      'Co-created a <Project Name> to <major functions>.',
      'Built and implemented <Project Name> using <feature> to <function>.',
      'Led the development of <Project Name> with a focus on <objective>.',
      'Collaborated on the development of <Project Name> to <function>, improving <performance>.'
    ],
    projOn: [
      'Working on the development of <Project Name>, which <major function>.',
      'Currently building <Project Name>, a <system type> to <major function>.',
      'Developing the architecture of <Project Name> to <major function>.'
    ],
    course: [
      'Pursuing an Honours Degree in **<Course Name>** from KTU.',
      'Developed expertise in **<Technology>** through a course offered by **<Organisation>**.',
      'Strengthened practical skills in **<Technology>** via hands-on training offered by **<Organisation>**.',
      'Received a certification in **<Course Name>** through **<Platform>**, offered in association with **<Institution>**.',
      'Successfully completed the **<Platform>** certified course, **<Course Name>**, conducted by **<Institution>**.',
      'Developed proficiency in **<Technology>** through **<Platform>**, applying skills to <specific application or domain>.',
      'Obtained certification in **<Course Name>** from **<Platform>**, demonstrating proficiency in <skills or applications learned>.',
      'Certified in **<Course Name>** by **<Platform>**, skilled in <key techniques or applications> for <domain or real-world impact>.'
    ],
    position: [
      'Took on the role of **<Post>** at **<Club Name> <Year>**, <Club Description>.',
      'Held the position of **<Post>** at **<Club Name> <Year>**, <Club Description>, where I led <specific tasks>.',
      'Worked as the **<Post>** at **<Club Name> <Year>**.',
      'Appointed as the Campus Ambassador for **<Event or Organisation> <Year>**.',
      'Designated as the Campus Ambassador for **<Event or Organisation> <Year>**.',
      'Served as the **<Post>** at **<Club Name> <Year>**, <Club Description>, contributing to <key responsibility>.',
      'Led operations for **<Club Name> <Year>** in the position of **<Post>**, ensuring <results>.',
      'Chosen as the Program Coordinator for **<Event or Organisation> <Year>**, facilitating <engagement>.',
      'Acted as the **<Post>** of **<Club Name> <Year>**, <Club Description>, overseeing <events>.',
      'Fulfilled duties of **<Post>** at **<Club Name> <Year>**, coordinating <activities>.',
      'Functioned in the role of **<Post>** at **<Club Name> <Year>**, <Club Description>, supervising <team or events>.',
      'Undertook the role of **<Post>** at **<Club Name> <Year>**, responsible for <key duties>.',
      'Managed leadership responsibilities at **<Club Name> <Year>** in the position of **<Post>**, managing <teams or projects>.',
      'Represented **<Event or Organisation> <Year>** on campus as the **<Post>**, strengthening <outreach>.'
    ],
    achieve: [
      'Secured **<Rank>** in **<Event Name> <Year>**, conducted by <Institution>.',
      'Attained **<Rank>** in **<Event Name> <Year>**, organised by <Institution>.',
      'Received **<Rank>** at **<Event Name>**, a <technical or non-technical> competition hosted by <Organisation>.',
      'Achieved **<Rank>** in **<Event Name>**, <Event Description> conducted as part of **<Tech Fest Name> <Year>**, <Fest Description> of <Institution>.',
      'Participated in **<Workshop Name>** on <Topic Name>, organised by <Institution>.',
      'Attended **<Workshop Name>** on <Topic Name> conducted by <Institution>.',
      'Took part in a **<Workshop Name>** on <Topic>, organised by <Institution>.',
      'Gained hands-on exposure to <Technologies> through a **<Workshop Name>**, conducted by <Institution>.',
      'Awarded **<Scholarship Name> <Year>** in recognition of <Achievement>.',
      'Recognised as a **<Fellowship Name> <Year>** for contributions to <description>.',
      'Member of **<Event or Club> <Year>**, <Club Description>.',
      'Volunteer of **<Event or Club> <Year>**, <Club Description>.'
    ]
  };

  const SUGG = {
    soft: ['Communication', 'Problem Solving', 'Teamwork', 'Leadership', 'Adaptability', 'Critical Thinking', 'Attention to Detail', 'Organisational Skills', 'Time Management', 'Creativity'],
    cse: {
      tech: ['JavaScript', 'Python', 'React', 'MySQL', 'C++', 'Node.js', 'Machine Learning', 'HTML', 'CSS', 'Java', 'MongoDB', 'Angular', 'Flutter', 'RESTful APIs', 'Data Structures and Algorithms', 'Object-Oriented Programming'],
      int: ['Machine Learning', 'Web Development', 'Cybersecurity', 'Data Analytics', 'DevOps', 'Artificial Intelligence', 'Blockchain Technology', 'Game Development', 'Cloud Computing', 'Full Stack Development', 'Software Engineering Principles', 'Distributed Systems']
    },
    csbs: {
      tech: ['Excel', 'Data Analytics', 'R', 'Oracle ERP', 'MATLAB', 'SAP BusinessObject', 'Salesforce', 'Statistical Analysis', 'Data Visualisation', 'Business Intelligence', 'SQL for Analytics', 'Dashboard Development'],
      int: ['Data Analytics and Visualisation', 'Machine Learning', 'Cloud Computing', 'CRM and ERP Systems', 'Financial Technology', 'Business Process Automation', 'Cybersecurity', 'Blockchain', 'Predictive Analytics', 'Digital Transformation']
    },
    ece: {
      tech: ['Embedded Systems', 'MATLAB', 'Arduino', 'Verilog', 'VHDL', 'Raspberry Pi', 'Vivado', 'KiCad', 'LTspice', 'Embedded C', 'C++', 'FPGA Design', 'PCB Design', 'SystemVerilog', 'Cadence Virtuoso', 'Static Timing Analysis', 'RISC-V'],
      int: ['Embedded Systems and IoT', 'FPGA Programming (Verilog/VHDL)', 'Signal and Image Processing', 'VLSI Design and Simulation', 'PCB Design and Circuit Simulation', 'ASIC Design Concepts', 'SoC Architecture', 'Mixed-Signal Systems']
    },
    eee: {
      tech: ['MATLAB', 'Multisim', 'LTspice', 'Load Flow Analysis', 'PowerWorld Simulator', 'PID Tuning', 'MATLAB Simulink', 'Siemens PLC', 'Battery Management Systems', 'Converters', 'Inverters'],
      int: ['Power Electronics', 'Embedded Systems Design', 'Electric Vehicle Technology', 'Microcontroller Programming', 'Energy Storage Systems', 'Robotics and Automation', 'Smart Grid Technologies', 'Control Systems', 'Electrical Drives']
    },
    ebe: {
      tech: ['Clinical Engineering', 'Biomechanics', 'Sensor Design', 'Biomedical Instrumentation', 'Rehabilitation Engineering', 'Prosthetics', 'AI in Healthcare Diagnostics', 'Medical Device Design', 'Biomedical Signal Processing'],
      int: ['Biomedical Signal Processing', 'Biosensors', 'Medical Imaging', 'Wearable Health Devices', 'Artificial Organs', 'Robotics in Surgery', 'Healthcare Data Analytics', 'Biomedical Materials']
    },
    me: {
      tech: ['SolidWorks', 'CNC Programming', 'AutoCAD', 'CFD Analysis', 'PLC Programming', 'ANSYS', 'Fusion 360', 'Finite Element Analysis', 'Manufacturing Processes', 'Mechanical System Design'],
      int: ['Thermal and Fluid Dynamics', 'Finite Element Analysis', 'Robotics and Automation', 'Vehicle Dynamics', 'Industrial Automation', '3D Printing', 'Renewable Energy Systems', 'Material Science', 'Quality Control']
    }
  };

  /* ---------- Small helpers ---------- */
  const SMALL = new Set(['and', 'of', 'for', 'in', 'to', 'the', 'with', 'on', 'at', 'a', 'an', 'by', 'or', 'via', 'as', 'from']);
  function uid(p) { return p + Math.random().toString(36).slice(2, 8); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean); }
  function isTitle(s) {
    return words(s).every((w, i) => {
      const lw = w.toLowerCase().replace(/[^a-z]/g, '');
      if (i > 0 && SMALL.has(lw)) return true;
      const c = w.replace(/^[^A-Za-z0-9]+/, '').charAt(0);
      if (!c) return true;
      return !/[a-z]/.test(c);
    });
  }
  function titleCase(s) {
    return words(s).map((w, i) => {
      const lw = w.toLowerCase();
      if (i > 0 && SMALL.has(lw)) return lw;
      if (/[A-Z]/.test(w.slice(1)) || /[0-9.+#/]/.test(w)) return w.charAt(0).toUpperCase() + w.slice(1);
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }
  function fmtDuration(n, unit) {
    if (unit === 'Ongoing') return 'Ongoing';
    const k = parseInt(n, 10);
    if (!(k > 0)) return '';
    return k + ' ' + (k === 1 ? unit.replace(/s$/, '') : unit);
  }
  function pctText(v) { v = String(v || '').trim(); return v && !/%$/.test(v) ? v + '%' : v; }
  function markupRuns(text, url, linkIdx) {
    const parts = String(text || '').split('**');
    const runs = []; let bi = 0;
    parts.forEach((p, i) => {
      if (!p) return;
      const bold = i % 2 === 1;
      const r = { t: p, b: bold };
      if (bold) { if (url && bi === (parseInt(linkIdx, 10) || 0)) r.link = url; bi++; }
      runs.push(r);
    });
    return runs;
  }
  function boldSegments(text) { return String(text || '').split('**').filter((p, i) => i % 2 === 1 && p); }
  function plain(text) { return String(text || '').replace(/\*\*/g, ''); }
  const R = (t, o) => Object.assign({ t }, o || {});

  /* ---------- Blank state ---------- */
  function newVersion(name) {
    return {
      id: uid('v'), name: name || 'General',
      skills: { technical: [], soft: [], interests: [] },
      order: { work: [], projects: [], courses: [], positions: [], achievements: [], refs: [] },
      hobbies: true
    };
  }
  function blankState() {
    const v = newVersion('General');
    return {
      v: 1, activeVersion: v.id,
      master: {
        personal: { name: '', email: '', phone: '+91 ', dob: '', linkedin: '', github: '', portfolio: '' },
        skills: { technical: [], soft: [], interests: [] },
        edu: {
          branch: 'Computer Science Engineering',
          btech: { cgpa: '', year: '2027' },
          diploma: { on: false, inst: '', board: 'SBTE', branch: '', cgpa: '', year: '' },
          c12: { on: true, inst: '', board: 'CBSE', pct: '', year: '' },
          c10: { on: true, inst: '', board: 'CBSE', pct: '', year: '' }
        },
        work: [], projects: [], courses: [], positions: [], achievements: [], refs: [],
        hobbies: [],
        inst: { pName: '', pDetails: '', pEmail: '', hName: '', hDetails: '', hEmail: '' }
      },
      versions: [v]
    };
  }
  function blankItem(sec) {
    const id = uid(sec.charAt(0));
    switch (sec) {
      case 'work': return { id, company: '', url: '', role: '', tech: '', dNum: '', dUnit: 'Months', desc: '' };
      case 'projects': return { id, title: '', role: '', team: '1', dNum: '', dUnit: 'Months', tech: '', desc: '' };
      case 'courses': return { id, text: '', url: '', linkIdx: 0 };
      case 'positions': return { id, text: '' };
      case 'achievements': return { id, text: '', url: '', linkIdx: 0, level: 'Within College' };
      case 'refs': return { id, name: '', post: '', org: '', email: '' };
    }
  }

  /* ---------- Compose a version into renderable lines ---------- */
  function ordered(state, ver, sec) {
    const list = state.master[sec] || [];
    return (ver.order[sec] || []).map(id => list.find(x => x.id === id)).filter(Boolean);
  }
  function defaults(branch) {
    const h = hodFor(branch);
    return { pName: PRINCIPAL.name, pDetails: 'Principal, ' + INSTITUTION + ', Kochi', pEmail: PRINCIPAL.email, hName: h.name, hDetails: 'HOD, ' + h.dept + ', ' + INSTITUTION + ', Kochi', hEmail: h.email };
  }
  function hodFor(branch) { return (BRANCHES[branch] || BRANCHES['Computer Science Engineering']).hod; }

  function compose(state, verId, opts) {
    const m = state.master, p = m.personal;
    const ver = state.versions.find(v => v.id === verId) || state.versions[0];
    // `ed` on a run or line tells the on-page editor which field it shows. Exporters ignore it.
    // `ghost` (preview only) is the key of the selected item, whose empty optional lines are shown so they can be filled in.
    const ghost = (opts && opts.ghost) || '';
    const K = (k, v, o) => Object.assign({ k, v: v == null ? '' : String(v) }, o);
    const I = (sec, id, f, v, o) => Object.assign({ sec, id, f, v: v == null ? '' : String(v) }, o);
    const header = {
      name: (p.name || 'YOUR NAME').toUpperCase(),
      links: [{ t: 'LinkedIn', url: p.linkedin }]
        .concat(p.github ? [{ t: 'GitHub', url: p.github }] : [])
        .concat(p.portfolio ? [{ t: 'Portfolio', url: p.portfolio }] : []),
      dob: 'DOB – ' + (p.dob || 'DD/MM/YYYY'),
      email: p.email || 'name.mec@gmail.com',
      phone: p.phone && p.phone.trim().length > 4 ? p.phone : '+91 XXXXXXXXXX'
    };
    const blocks = [];
    const spaced = (items) => items.forEach((it, i) => { if (i > 0) it.lines[0].before = 80; });
    const keep = (items) => items.forEach(it => it.lines.forEach((l, i) => { l.keepNext = i < it.lines.length - 1; }));

    // Skills
    const sk = [];
    [['technical', 'Technical Skills'], ['soft', 'Soft Skills'], ['interests', 'Interests']].forEach(([k, label]) => {
      const vals = ver.skills[k] || [];
      const ed = { kind: 'skills', ek: 'skills:' + k, g: k, v: vals.join(', '), ph: 'Type skills, separated by commas' };
      if (vals.length) sk.push({ sec: 'skills', id: k, lines: [{ kind: 'skill', label: label + ':', value: vals.join(', '), ed }] });
      else if (ghost.startsWith('skills')) sk.push({ sec: 'skills', id: k, lines: [{ kind: 'skill', label: label + ':', value: '', ed, ghost: 1 }] });
    });
    if (sk.length) blocks.push({ key: 'skills', title: 'SKILLS & INTERESTS', items: sk });

    // Education
    const e = m.edu, edu = [];
    const eduRow = (id, inst, score, year, subRuns, pct) => {
      const b = 'edu.' + id + '.', sf = pct ? 'pct' : 'cgpa', raw = String(e[id][sf] || '');
      return {
        sec: 'edu', id, lines: [
          { kind: 'row', bullet: true, left: [R(inst || '<Institution>', { b: 1, ed: id === 'btech' ? null : K(b + 'inst', inst, { ph: '<Institution>' }) })], right: [R((score || '<score>') + ' ', { b: 1, ed: K(b + sf, raw, { ph: '<score>', post: pct && raw.trim() && !/%$/.test(raw.trim()) ? '% ' : ' ' }) }), R('| ' + (year || '<Year>'), { ed: K(b + 'year', year, { ph: '<Year>', pre: '| ' }) })] },
          { kind: 'row', bullet: false, left: subRuns }
        ]
      };
    };
    edu.push(eduRow('btech', INSTITUTION, e.btech.cgpa, e.btech.year, [R('KTU', { b: 1 }), R(', B.Tech in ' + e.branch)]));
    if (e.diploma.on) edu.push(eduRow('diploma', e.diploma.inst, e.diploma.cgpa, e.diploma.year, [R(e.diploma.board || 'SBTE', { b: 1, ed: K('edu.diploma.board', e.diploma.board, { ph: 'SBTE' }) }), R(', ' + (e.diploma.branch || '<Branch>'), { ed: K('edu.diploma.branch', e.diploma.branch, { ph: '<Branch>', pre: ', ' }) })]));
    if (e.c12.on) edu.push(eduRow('c12', e.c12.inst, pctText(e.c12.pct), e.c12.year, [R(e.c12.board || '<Board>', { b: 1 }), R(', 12'), R('th', { sup: 1 })], true));
    if (e.c10.on) edu.push(eduRow('c10', e.c10.inst, pctText(e.c10.pct), e.c10.year, [R(e.c10.board || '<Board>', { b: 1 }), R(', 10'), R('th', { sup: 1 })], true));
    spaced(edu); keep(edu);
    blocks.push({ key: 'edu', title: 'EDUCATION', items: edu });

    // Work
    const work = ordered(state, ver, 'work').map(w => {
      const E = (f, o) => I('work', w.id, f, w[f], o);
      const lines = [
        { kind: 'row', bullet: true, left: [R(w.company || '<Company>', { b: 1, link: w.url || null, ed: E('company', { ph: '<Company>' }) })], right: [R(fmtDuration(w.dNum, w.dUnit) || '<Duration>', { i: 1, ed: E('dur', { kind: 'dur', v: fmtDuration(w.dNum, w.dUnit), ph: '<Duration>' }) })] },
        { kind: 'row', bullet: false, left: [R(w.role || '<Role>', { b: 1, ed: E('role', { ph: '<Role>' }) })] }
      ];
      if (w.tech || ghost === 'work:' + w.id) lines.push({ kind: 'row', bullet: false, ghost: w.tech ? 0 : 1, left: [R('Technologies Used:', { b: 1, i: 1 }), R(' ' + w.tech, { i: 1, ed: E('tech', { ph: 'Python, MySQL', pre: ' ' }) })] });
      lines.push({ kind: 'row', bullet: false, left: [R(w.desc || '<Description>', { ed: E('desc', { ph: '<Description>' }) })] });
      return { sec: 'work', id: w.id, lines };
    });
    spaced(work); keep(work);
    if (work.length) blocks.push({ key: 'work', title: 'WORK EXPERIENCE', items: work });

    // Projects
    const projects = ordered(state, ver, 'projects').map(p2 => {
      const E = (f, o) => I('projects', p2.id, f, p2[f], o);
      const lines = [
        { kind: 'row', bullet: true, left: [R(p2.title || '<Project>', { b: 1, ed: E('title', { ph: '<Project>' }) })], right: [R('Team Size: ' + (p2.team || '1'), { b: 1, ed: E('team', { ph: '1', pre: 'Team Size: ' }) })] },
        { kind: 'row', bullet: false, left: [R(p2.role || '<Role>', { b: 1, ed: E('role', { ph: '<Role>' }) })], right: [R(fmtDuration(p2.dNum, p2.dUnit) || '<Duration>', { i: 1, ed: E('dur', { kind: 'dur', v: fmtDuration(p2.dNum, p2.dUnit), ph: '<Duration>' }) })] }
      ];
      if (p2.tech || ghost === 'projects:' + p2.id) lines.push({ kind: 'row', bullet: false, ghost: p2.tech ? 0 : 1, left: [R('Technologies Used:', { b: 1, i: 1 }), R(' ' + p2.tech, { i: 1, ed: E('tech', { ph: 'React, Node.js', pre: ' ' }) })] });
      lines.push({ kind: 'row', bullet: false, left: [R(p2.desc || '<Description>', { ed: E('desc', { ph: '<Description>' }) })] });
      return { sec: 'projects', id: p2.id, lines };
    });
    spaced(projects); keep(projects);
    if (projects.length) blocks.push({ key: 'projects', title: 'PROJECTS', items: projects });

    // One-line sections
    const oneLine = (sec, title, withLink) => {
      const items = ordered(state, ver, sec).map(c => ({
        sec, id: c.id, lines: [{ kind: 'row', bullet: true, left: markupRuns(c.text || '<Text>', withLink ? c.url : null, c.linkIdx), ed: I(sec, c.id, 'text', c.text, { kind: 'rich', ph: 'Type the sentence, or pick a pattern in the side panel' }) }]
      }));
      return items.length ? { key: sec, title, items } : null;
    };
    const courses = oneLine('courses', 'COURSES AND CERTIFICATIONS', true);
    const positions = oneLine('positions', 'KEY POSITIONS', false);
    if (courses) blocks.push(courses);
    if (positions) blocks.push(positions);

    // Achievements + hobbies
    const ach = oneLine('achievements', 'ACHIEVEMENTS AND ACTIVITIES', true) || { key: 'achievements', title: 'ACHIEVEMENTS AND ACTIVITIES', items: [] };
    if ((ver.hobbies && m.hobbies.length) || ghost === 'hobbies:hobbies') {
      ach.items.push({ sec: 'hobbies', id: 'hobbies', lines: [{ kind: 'row', bullet: true, ghost: ver.hobbies && m.hobbies.length ? 0 : 1, left: [R('Hobbies:', { b: 1 }), R(' ' + m.hobbies.join(', '), { ed: { kind: 'hobbies', ek: 'hobbies', v: m.hobbies.join(', '), ph: 'Up to four, separated by commas', pre: ' ' } })] }] });
    }
    if (ach.items.length) blocks.push(ach);

    // References
    const ov = m.inst || {}, D = defaults(e.branch);
    const mail = (em, ed) => R(em, { b: 1, color: LINK, link: 'mailto:' + em, ed });
    const instRef = (id, n, dt, em) => ({ sec: 'refs', id, lines: [{ kind: 'row', bullet: true, left: [
      R(ov[n] || D[n], { b: 1, ed: K('inst.' + n, ov[n] || D[n], { dflt: D[n] }) }),
      R(', ' + (ov[dt] || D[dt]) + ', Email ID: ', { ed: K('inst.' + dt, ov[dt] || D[dt], { dflt: D[dt], pre: ', ', post: ', Email ID: ' }) }),
      mail(ov[em] || D[em], K('inst.' + em, ov[em] || D[em], { dflt: D[em] }))] }] });
    const refs = [instRef('principal', 'pName', 'pDetails', 'pEmail'), instRef('hod', 'hName', 'hDetails', 'hEmail')].concat(ordered(state, ver, 'refs').map(r => {
      const E = (f, o) => I('refs', r.id, f, r[f], o);
      return {
        sec: 'refs', id: r.id, lines: [{ kind: 'row', bullet: true, left: [R(r.name || '<Name>', { b: 1, ed: E('name', { ph: '<Name>' }) }), R(', ' + (r.post || '<Post>'), { ed: E('post', { ph: '<Post>', pre: ', ' }) }), R(' at ' + (r.org || '<Organisation>') + ', Email ID: ', { ed: E('org', { ph: '<Organisation>', pre: ' at ', post: ', Email ID: ' }) }), (r.email ? mail(r.email, E('email')) : R('<Email ID>', { b: 1, ed: E('email', { ph: '<Email ID>' }) }))] }]
      };
    }));
    blocks.push({ key: 'refs', title: 'REFERENCES', items: refs });

    return { header, blocks, versionName: ver.name };
  }

  /* ---------- Guideline linting ---------- */
  function stemOf(pattern) { return pattern.split('<')[0].replace(/\*\*/g, '').trim(); }
  function norm(s) { return String(s || '').toLowerCase().replace(/\*\*/g, '').replace(/\ban\b/g, 'a').replace(/\s+/g, ' ').trim(); }
  function matchesAny(text, list) {
    const t = norm(text);
    return list.some(p => { const st = norm(stemOf(p)); return st && t.startsWith(st); });
  }
  function durIssue(n, unit, label) {
    if (unit === 'Ongoing') return null;
    const k = parseInt(n, 10);
    if (!(k > 0)) return 'Enter the ' + label + ' duration.';
    if (unit === 'Days' && k >= 7) return 'Durations of 7 days or more are written in Weeks.';
    if (unit === 'Weeks' && k >= 5) return 'Durations of a month or more are written in Months.';
    return null;
  }
  const isUrl = u => /^https?:\/\/\S+$/i.test(String(u || '').trim());

  function lintText(text, opts) {
    const out = []; opts = opts || {};
    const t = String(text || '');
    if (/<[^>]+>/.test(t)) out.push({ lvl: 'err', msg: 'Replace the remaining <placeholders> with real details.' });
    if (opts.fullStop !== false && t.trim() && !/[.][\u201D"']?$/.test(t.replace(/\*\*/g, '').trim())) out.push({ lvl: 'err', msg: 'End the sentence with a full stop.' });
    if (/[,;][^\s]/.test(t) || /[a-z]\.[A-Z]/.test(t)) out.push({ lvl: 'warn', msg: 'Leave one space after every punctuation mark.' });
    if (/\s{2,}/.test(t.replace(/\n/g, ' '))) out.push({ lvl: 'warn', msg: 'Remove the double spaces.' });
    return out;
  }
  function linesGuess(len) { return Math.ceil(len / 118); }

  function lintState(state, verId) {
    const m = state.master, p = m.personal;
    const ver = state.versions.find(v => v.id === verId) || state.versions[0];
    const byItem = {};
    const add = (key, lvl, msg) => { (byItem[key] = byItem[key] || []).push({ lvl, msg }); };
    const addAll = (key, arr) => arr.forEach(i => add(key, i.lvl, i.msg));

    // Personal
    if (!p.name.trim()) add('personal:name', 'err', 'Enter your full name exactly as in your academic records.');
    if (!p.linkedin.trim()) add('personal:linkedin', 'err', 'LinkedIn is mandatory.');
    else if (!isUrl(p.linkedin)) add('personal:linkedin', 'warn', 'Use the full link, starting with https://');
    if (p.github && !isUrl(p.github)) add('personal:github', 'warn', 'Use the full link, starting with https://');
    if (p.portfolio && !isUrl(p.portfolio)) add('personal:portfolio', 'warn', 'Use the full link, starting with https://');
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(p.dob.trim())) add('personal:dob', 'warn', 'Write the date of birth as DD/MM/YYYY.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email.trim())) add('personal:email', 'err', 'Enter a valid email address.');
    else if (!/\.mec/i.test(p.email)) add('personal:email', 'warn', 'Use your .mec email ID (for example name.mec@gmail.com).');
    if (!/^\+\d{1,3}\s?\d{6,12}$/.test(p.phone.trim())) add('personal:phone', 'warn', 'Use the international format, for example +91 9876543210.');

    // Skills (only what this version shows)
    ['technical', 'soft', 'interests'].forEach(g => {
      (ver.skills[g] || []).forEach(s => { if (!isTitle(s)) add('skills:' + g, 'warn', '"' + s + '" should be in Title Case.'); });
    });
    if (!(ver.skills.technical || []).length) add('skills:technical', 'warn', 'Add at least one technical skill to this version.');

    // Education
    const e = m.edu;
    const cg = (key, v, label) => {
      if (!/^\d{1,2}\.\d{2}$/.test(String(v).trim())) add(key, 'err', label + ' needs two decimals, for example 9.10.');
      else if (parseFloat(v) > 10) add(key, 'err', label + ' cannot be above 10.');
    };
    const yr = (key, v) => { if (!/^\d{4}$/.test(String(v).trim())) add(key, 'err', 'Enter the year as four digits, for example 2027.'); };
    const pc = (key, v) => {
      const s = String(v).trim().replace(/%$/, '');
      if (!/^\d{1,3}(\.\d)?$/.test(s) || parseFloat(s) > 100) add(key, 'err', 'Percentage needs at most one decimal, for example 94.2.');
    };
    cg('edu:btech', e.btech.cgpa, 'CGPA'); yr('edu:btech', e.btech.year);
    if (e.diploma.on) { if (!e.diploma.inst.trim()) add('edu:diploma', 'err', 'Enter the institution.'); cg('edu:diploma', e.diploma.cgpa, 'CGPA'); yr('edu:diploma', e.diploma.year); if (!e.diploma.branch.trim()) add('edu:diploma', 'err', 'Enter the diploma branch.'); }
    ['c12', 'c10'].forEach(k => {
      if (!e[k].on) return;
      if (!e[k].inst.trim()) add('edu:' + k, 'err', 'Enter the school name.');
      pc('edu:' + k, e[k].pct); yr('edu:' + k, e[k].year);
    });

    // Work
    ordered(state, ver, 'work').forEach(w => {
      const key = 'work:' + w.id;
      if (!w.company.trim()) add(key, 'err', 'Enter the organisation name.');
      else if (!isTitle(w.company)) add(key, 'warn', 'Company name should be in Title Case.');
      if (!isUrl(w.url)) add(key, 'warn', 'Link the certificate or proof (Drive link set to "Anyone with the link").');
      if (!w.role.trim()) add(key, 'err', 'Enter the role.'); else if (!isTitle(w.role)) add(key, 'warn', 'Role should be in Title Case.');
      const d = durIssue(w.dNum, w.dUnit, 'work'); if (d) add(key, 'err', d);
      if (w.tech) {
        if (/[.]\s*$/.test(w.tech)) add(key, 'warn', 'Technologies Used should not end with a full stop.');
        if (!isTitle(w.tech.replace(/,/g, ' '))) add(key, 'warn', 'Technologies Used should be in Title Case.');
      }
      if (!w.desc.trim()) add(key, 'err', 'Add a description.');
      else {
        addAll(key, lintText(w.desc));
        const ongoing = w.dUnit === 'Ongoing';
        if (!matchesAny(w.desc, ongoing ? PATTERNS.workOn : PATTERNS.workDone)) add(key, 'warn', 'Start with an approved ' + (ongoing ? 'ongoing' : 'completed') + ' sentence structure (use the pattern menu).');
        if (w.desc.length > 260) add(key, 'warn', 'About ' + linesGuess(w.desc.length) + ' lines long. The guidelines allow two lines at most.');
      }
    });

    // Projects
    ordered(state, ver, 'projects').forEach(pr => {
      const key = 'projects:' + pr.id;
      if (!pr.title.trim()) add(key, 'err', 'Enter the project title.');
      else { if (/[.]\s*$/.test(pr.title)) add(key, 'err', 'Project titles do not end with a full stop.'); if (!isTitle(pr.title)) add(key, 'warn', 'Project title should be in Title Case.'); }
      if (!/^[1-9]\d*$/.test(String(pr.team).trim())) add(key, 'err', 'Team size must be a whole number of 1 or more.');
      if (!pr.role.trim()) add(key, 'err', 'Enter your role.'); else { if (/[.]\s*$/.test(pr.role)) add(key, 'warn', 'Role should not end with a full stop.'); if (!isTitle(pr.role)) add(key, 'warn', 'Role should be in Title Case.'); }
      const d = durIssue(pr.dNum, pr.dUnit, 'project'); if (d) add(key, 'err', d);
      if (pr.tech) {
        if (/[.]\s*$/.test(pr.tech)) add(key, 'warn', 'Technologies Used should not end with a full stop.');
        if (!isTitle(pr.tech.replace(/,/g, ' '))) add(key, 'warn', 'Technologies Used should be in Title Case.');
      }
      if (!pr.desc.trim()) add(key, 'err', 'Add a description.');
      else {
        addAll(key, lintText(pr.desc));
        const ongoing = pr.dUnit === 'Ongoing';
        if (!matchesAny(pr.desc, ongoing ? PATTERNS.projOn : PATTERNS.projDone)) add(key, 'warn', 'Start with an approved ' + (ongoing ? 'ongoing' : 'completed') + ' sentence structure (use the pattern menu).');
        if (pr.title.trim() && !pr.desc.toLowerCase().includes(pr.title.trim().toLowerCase())) add(key, 'warn', 'Mention the project name in the description.');
        if (pr.desc.length > 260) add(key, 'warn', 'About ' + linesGuess(pr.desc.length) + ' lines long. The guidelines allow two lines at most.');
      }
    });

    // Rich one-liners
    const rich = (sec, pats, needBold, needLink) => ordered(state, ver, sec).forEach(c => {
      const key = sec + ':' + c.id;
      if (!c.text.trim()) { add(key, 'err', 'Write the entry.'); return; }
      addAll(key, lintText(c.text));
      if (!matchesAny(c.text, pats)) add(key, 'warn', 'Start with an approved sentence structure (use the pattern menu).');
      if (needBold && !boldSegments(c.text).length) add(key, 'warn', 'Bold the names that the guidelines ask for by wrapping them in ** **.');
      if (needLink && !isUrl(c.url)) add(key, 'warn', 'Add the certificate link (Drive link set to "Anyone with the link").');
      if (c.url && isUrl(c.url) && !boldSegments(c.text).length) add(key, 'warn', 'The link needs a bold name to attach to.');
    });
    rich('courses', PATTERNS.course, true, true);
    rich('positions', PATTERNS.position, true, false);
    rich('achievements', PATTERNS.achieve, true, false);

    // Hobbies
    if (m.hobbies.length > 4) add('hobbies:hobbies', 'err', 'Keep hobbies to four at most.');
    m.hobbies.forEach(h => { if (!isTitle(h)) add('hobbies:hobbies', 'warn', '"' + h + '" should be in Title Case.'); if (/\.$/.test(h)) add('hobbies:hobbies', 'warn', 'No trailing full stop after hobbies.'); });

    // References
    ordered(state, ver, 'refs').forEach(r => {
      const key = 'refs:' + r.id;
      if (!r.name.trim() || !r.post.trim() || !r.org.trim()) add(key, 'err', 'Fill in name, post and organisation.');
      else if (!isTitle(r.name) || !isTitle(r.post)) add(key, 'warn', 'Name and post should be in Title Case.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email.trim())) add(key, 'err', 'Enter a valid email address.');
    });

    // Order hint for achievements
    const ach = ordered(state, ver, 'achievements');
    for (let i = 1; i < ach.length; i++) {
      if (LEVELS.indexOf(ach[i].level) < LEVELS.indexOf(ach[i - 1].level)) {
        add('achievements:' + ach[i].id, 'warn', 'List achievements from international down to college level. Use "Sort by level".');
        break;
      }
    }

    let err = 0, warn = 0; const bySec = {};
    Object.keys(byItem).forEach(k => {
      const sec = k.split(':')[0];
      byItem[k].forEach(i => { if (i.lvl === 'err') err++; else warn++; bySec[sec] = bySec[sec] || { err: 0, warn: 0 }; bySec[sec][i.lvl]++; });
    });
    return { byItem, bySec, err, warn };
  }

  const api = { INSTITUTION, PRINCIPAL, BRANCHES, LEVELS, BOARDS, LINK, PATTERNS, SUGG, uid, esc, isTitle, titleCase, fmtDuration, pctText, markupRuns, boldSegments, plain, defaults, newVersion, blankState, blankItem, compose, lintState, ordered, hodFor };
  return api;
})();
export default Core;
