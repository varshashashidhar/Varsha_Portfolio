// ---------- Mobile nav ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ---------- Scroll progress + scroll edge ----------
const progress = document.getElementById('progress');
const nav = document.getElementById('nav');
const onScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  nav.classList.toggle('scrolled', window.scrollY > 4);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Active section highlighting (nav + case study TOC) ----------
const linkFor = (id) => document.querySelectorAll(`.nav-links a[href="#${id}"], .cs-toc a[href="#${id}"]`);
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    document.querySelectorAll('.nav-links a.active, .cs-toc a.active').forEach((a) => a.classList.remove('active'));
    linkFor(id).forEach((a) => a.classList.add('active'));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('section[id], .cs-block[id]').forEach((el) => spy.observe(el));

// ---------- Reveal on scroll ----------
const revealEls = document.querySelectorAll('.cs-header, .tldr, .cs-block, .proto, .fit, .tl-item, .about-grid, .contact-links');
const revealer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach((el) => {
  el.classList.add('reveal');
  revealer.observe(el);
});

// ---------- Prototype ----------
const tabs = Array.from(document.querySelectorAll('.proto-tab'));
const panes = {
  support: document.getElementById('pane-support'),
  ops: document.getElementById('pane-ops'),
  pm: document.getElementById('pane-pm'),
};
const opsBadge = document.getElementById('opsBadge');
const pmBadge = document.getElementById('pmBadge');

// One indicator glides between tabs; CSS transitions retarget from the live value if interrupted
const segIndicator = document.createElement('span');
segIndicator.className = 'seg-indicator instant';
segIndicator.setAttribute('aria-hidden', 'true');
document.querySelector('.proto-tabs').prepend(segIndicator);

function moveIndicator(instant) {
  const active = tabs.find((t) => t.classList.contains('active'));
  segIndicator.classList.toggle('instant', !!instant);
  segIndicator.style.setProperty('--x', `${active.offsetLeft}px`);
  segIndicator.style.setProperty('--y', `${active.offsetTop}px`);
  segIndicator.style.width = `${active.offsetWidth}px`;
  segIndicator.style.height = `${active.offsetHeight}px`;
}
new ResizeObserver(() => moveIndicator(true)).observe(document.querySelector('.proto-tabs'));

let currentTab = 'support';
function selectTab(name) {
  const order = Object.keys(panes);
  const dir = order.indexOf(name) >= order.indexOf(currentTab) ? 'enter-right' : 'enter-left';
  const changed = name !== currentTab;
  currentTab = name;
  tabs.forEach((t) => {
    const on = t.dataset.pane === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  });
  Object.entries(panes).forEach(([key, pane]) => {
    pane.hidden = key !== name;
    pane.classList.toggle('active', key === name);
    pane.classList.remove('enter-right', 'enter-left');
    if (key === name && changed) { void pane.offsetWidth; pane.classList.add(dir); }
  });
  moveIndicator(false);
  if (name === 'ops') opsBadge.hidden = true;
  if (name === 'pm') pmBadge.hidden = true;
  moveIndicator(false);
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab.dataset.pane));
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    next.focus();
    selectTab(next.dataset.pane);
  });
});

// Illustrative expansion map for one account (Northwind Cloud is fictional)
const seedPains = () => ([
  {
    id: 'sales', team: 'Sales', name: 'Signal-based outbound', status: 'pilot', hours: 340, users: 40, weeks: 3, priority: 'Move upmarket',
    insight: '40 SDRs spend <strong>about half their day researching</strong> accounts. Signals plus enriched buying committees turn that time into outreach, right as the team moves upmarket.',
    quote: "If my reps could start every morning with the ten accounts that changed overnight, that's the quarter.",
    rec: 'Teams keep rebuilding the same job-change routing. A shared template could cut weeks from the second team\'s launch.',
    workflow: ['Signal-based outbound · runs daily', ['Find', 'enterprise accounts that match the best customers'], ['Watch', 'new exec hires, funding, hiring for RevOps roles'], ['Enrich', 'buying committee via waterfall: provider A → B → C'], ['Research', 'AI summary of each account\'s top initiative'], ['Write', 'first line tied to that initiative'], ['Route', 'to the owning SDR\'s sequence in Salesforce']],
  },
  {
    id: 'marketing', team: 'Marketing', name: 'In-market scoring for ABM', status: 'new', hours: 180, users: 8, weeks: 5, priority: 'Find in-market accounts',
    insight: 'Demand Gen plans ABM for next year but <strong>can\'t tell which accounts are in-market</strong>. Intent scoring gives them a list before the budget is set.',
    quote: "Give me the 200 accounts that are actually in-market and I'll build the whole program around them.",
    rec: 'Marketing leaders want account scores they can sync to ad platforms without RevOps in the loop.',
    workflow: ['In-market scoring · runs weekly', ['Find', 'target accounts from the ABM list'], ['Score', 'hiring, tech changes, funding, site visits'], ['Tier', 'top 200 to sales, the rest to nurture'], ['Sync', 'audiences to ad platforms'], ['Build', 'personalized pages for the top 50']],
  },
  {
    id: 'revops', team: 'RevOps', name: 'CRM hygiene waterfall', status: 'live', hours: 120, users: 6, weeks: 0, priority: 'Fix CRM data',
    insight: 'Already live. A weekly waterfall keeps <strong>Salesforce accounts and contacts current</strong>, and it\'s the foundation every other play builds on.',
    quote: 'For the first time I trust the CRM data in our pipeline review.',
    rec: 'Customers ask for a CRM health score they can show leadership.',
    workflow: ['CRM hygiene · runs weekly', ['Pull', 'accounts and contacts not updated in 90 days'], ['Enrich', 'waterfall: provider A → B → C'], ['Flag', 'job changes and bounced emails'], ['Update', 'Salesforce fields with source and date']],
  },
  {
    id: 'cx', team: 'Customer Success', name: 'Expansion signals for CSMs', status: 'new', hours: 90, users: 15, weeks: 4, priority: 'Grow existing customers',
    insight: 'CSMs learn about customer changes <strong>after the renewal call</strong>. Expansion signals put headcount growth and new teams in front of them first.',
    quote: 'We find out a customer doubled their team when they ask for more seats.',
    rec: 'CX teams ask for signals scoped to existing customers, kept separate from prospecting.',
    workflow: ['Expansion signals · runs daily', ['Watch', 'customer headcount, new teams, new funding'], ['Summarize', 'what changed, with AI'], ['Alert', 'the owning CSM in Slack'], ['Prep', 'QBR notes automatically']],
  },
]);

const firstPlays = {
  'Move upmarket': ['Build a target list of enterprise companies that look like your best customers.', 'Enrich buying committees with a waterfall across providers, so reps stop researching by hand.', 'Trigger outreach on signals: new exec hires, funding, and RevOps hiring.'],
  'Fix CRM data': ['Run a waterfall enrichment over stale Salesforce accounts and contacts.', 'Flag job changes so reps can follow champions to new companies.', 'Schedule a weekly refresh so the CRM stops decaying.'],
  'Find in-market accounts': ['Score target accounts on intent: hiring, tech changes, and funding.', 'Route the top tier to sales and the rest to ABM nurture.', 'Personalize landing pages for the top 50 accounts.'],
  'Grow existing customers': ['Watch customers for expansion signals: headcount growth and new teams.', 'Alert CSMs with an AI summary of what changed.', 'Feed those signals into QBR prep automatically.'],
};

const tableRows = [
  ['Acme Robotics', '2,400', 'Hired a VP RevOps', 'High'],
  ['Lumen Health', '860', 'Raised a Series C', 'High'],
  ['Brightline Logistics', '5,100', 'Opened an EMEA office', 'Medium'],
  ['Quanta Retail', '1,250', 'New CRO, 30 days ago', 'High'],
];
let fillTimers = [];

function renderTable(filled) {
  fillTimers.forEach(clearTimeout); fillTimers = [];
  const body = document.querySelector('#ktable tbody');
  body.innerHTML = tableRows.map((r) => `<tr><td>${r[0]}</td><td class="empty">—</td><td class="empty">—</td><td class="empty">—</td></tr>`).join('');
  $('tableStatus').textContent = filled ? 'Enriching…' : 'Waiting for a priority';
  if (!filled) return;
  // Cells fill in sequence, the way a waterfall resolves row by row
  const cells = [...body.querySelectorAll('tr')].flatMap((tr, ri) => [1, 2, 3].map((ci) => [tr.children[ci], tableRows[ri][ci], ci, ri * 3 + ci]));
  cells.forEach(([td, value, ci, i]) => {
    fillTimers.push(setTimeout(() => {
      td.classList.remove('empty');
      td.classList.add('filled');
      td.innerHTML = ci === 3 ? `<span class="fit-pill ${value === 'High' ? 'fit-high' : 'fit-med'}">${value}</span>` : value;
    }, 120 + i * 70));
  });
  fillTimers.push(setTimeout(() => { $('tableStatus').textContent = '4 accounts · 3 enriched columns · built live'; }, 120 + (cells.length + 3) * 70 + 200));
}

const readinessItems = [
  { label: 'Value story documented: hours saved and pipeline sourced', owner: 'Strategist · VP RevOps' },
  { label: 'Second team live in Clay', owner: 'Strategist · team lead' },
  { label: 'Exec sponsor aligned on the next two quarters', owner: 'Strategist · VP RevOps' },
  { label: 'Usage forecast shared with finance', owner: 'Strategist' },
  { label: 'Winning play published as an enterprise template', owner: 'Strategist · Clay' },
];

let pains = seedPains();
let selected = 'sales';
let readyDone = new Set();
let sent = new Set();

const gapList = document.getElementById('gapList');
const sendBtn = document.getElementById('sendBtn');
const sendToast = document.getElementById('sendToast');
const sqlBtn = document.getElementById('sqlBtn');
const sqlBlock = document.getElementById('sqlBlock');
const $ = (id) => document.getElementById(id);
const statusLabel = { live: 'Live', pilot: 'Pilot', new: 'Not started' };

function renderPains(bumpId) {
  const max = Math.max(...pains.map((p) => p.hours));
  gapList.innerHTML = '';
  pains.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'gap-row' + (p.id === selected ? ' active' : '') + (p.id === bumpId ? ' bump' : '');
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.innerHTML = `
      <span class="gap-name">${p.team}</span>
      <span class="status ${p.status}">${statusLabel[p.status]}</span>
      <span class="gap-reason">${p.name} · ~${p.hours} hrs/mo</span>
      <span></span>
      <span class="gap-bar"><i style="width:${(p.hours / max) * 100}%"></i></span>`;
    const pick = () => { selected = p.id; renderPains(); renderDetail(); };
    li.addEventListener('click', pick);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    gapList.appendChild(li);
  });
}

function sqlFor(p) {
  const [title, ...steps] = p.workflow;
  return `<span class="cm">// ${title}</span>\n` + steps.map(([verb, text], i) =>
    `<span class="cm">${i + 1}</span>  <span class="kw">${verb.padEnd(9)}</span>${text.replace(/provider A → B → C/, '<span class="st">provider A → B → C</span>')}`).join('\n');
}

function renderDetail() {
  const p = pains.find((x) => x.id === selected);
  const top = pains.filter((x) => x.status !== 'live').sort((a, b) => b.hours - a.hours)[0];
  $('detailLabel').textContent = p.id === top.id ? 'Next best play' : (p.status === 'live' ? 'Live play' : 'Play');
  $('gapTitle').textContent = `${p.team}: ${p.name}`;
  $('gapMeta').textContent = `${statusLabel[p.status]} · maps to "${p.priority.toLowerCase()}"`;
  $('kpiTickets').textContent = p.hours;
  $('kpiCustomers').textContent = p.users;
  $('kpiTtr').textContent = p.status === 'live' ? '—' : p.weeks;
  $('gapInsight').innerHTML = p.insight;
  $('sqlCode').innerHTML = sqlFor(p);
  sendToast.hidden = true;
  sendBtn.textContent = p.status === 'live' ? 'Already live' : `Propose to ${p.team}`;
  sendBtn.disabled = p.status === 'live' || sent.has(p.id);
}

sqlBtn.addEventListener('click', () => {
  sqlBlock.hidden = !sqlBlock.hidden;
  sqlBtn.textContent = sqlBlock.hidden ? 'Show workflow' : 'Hide workflow';
  sqlBtn.setAttribute('aria-expanded', String(!sqlBlock.hidden));
});

function renderBrief(p) {
  $('briefEmpty').hidden = true;
  $('briefBody').hidden = false;
  $('briefTitle').textContent = `Expand Clay to ${p.team}: ${p.name.toLowerCase()}`;
  $('briefMeta').textContent = 'Northwind Cloud · quarterly business review with the exec sponsor · illustrative';
  $('briefEvidence').innerHTML = `
    <li>About <strong>${p.hours} hours a month</strong> returned to <strong>${p.users}</strong> ${p.team} users.</li>
    <li>Live in about <strong>${p.weeks} weeks</strong>, built on the CRM workflow RevOps already trusts.</li>
    <li>Moves the priority the leader named at kickoff: <strong>${p.priority.toLowerCase()}</strong>.</li>`;
  $('briefQuote').textContent = `"${p.quote}"`;
  $('briefRec').textContent = p.rec;
}

sendBtn.addEventListener('click', () => {
  const p = pains.find((x) => x.id === selected);
  renderBrief(p);
  pmBadge.hidden = false;
  sendToast.textContent = `Proposal drafted for the ${p.team} leader and added to the QBR.`;
  sent.add(p.id);
  sendToast.hidden = false;
  sendBtn.disabled = true;
});

// Readiness checklist
function renderReady() {
  const list = $('readyList');
  list.innerHTML = '';
  readinessItems.forEach((item, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ready-item' + (readyDone.has(i) ? ' done' : '');
    b.setAttribute('aria-pressed', String(readyDone.has(i)));
    b.innerHTML = `<span class="ready-box">${readyDone.has(i) ? '✓' : ''}</span>
      <span><span class="ready-label">${item.label}</span><span class="ready-owner">${item.owner}</span></span>`;
    b.addEventListener('click', () => {
      readyDone.has(i) ? readyDone.delete(i) : readyDone.add(i);
      renderReady();
    });
    list.appendChild(b);
  });
  const n = readyDone.size;
  $('readyCount').textContent = `${n} of ${readinessItems.length} complete`;
  $('readyBar').style.width = `${(n / readinessItems.length) * 100}%`;
  const gate = $('gate');
  const pass = n === readinessItems.length;
  gate.classList.toggle('pass', pass);
  gate.textContent = pass ? 'Renewal: ready for multi-team expansion ✓' : `Renewal: ${readinessItems.length - n} open item${readinessItems.length - n === 1 ? '' : 's'} before the renewal call`;
}


// ---------- Runbook sheet: gesture-driven, spring-animated ----------
// Principles from Apple's "Designing Fluid Interfaces": track the pointer 1:1,
// hand the release velocity to a spring, project momentum to choose a detent,
// rubber-band past the edges, and let any motion be grabbed mid-flight.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sheetEl = $('runbook');
const sheetHandle = $('sheetHandle');
const PEEK = 58; // visible height when collapsed (the handle row)

const sheet = { y: 0, v: 0, raf: 0, detent: 'open' };

function sheetHeight() { return sheetEl.offsetHeight; }
function detents() { return { open: 0, peek: Math.max(0, sheetHeight() - PEEK) }; }
function applySheet() { sheetEl.style.transform = `translate3d(0, ${sheet.y}px, 0)`; }

// Spring with Apple's designer-friendly parameters: damping ratio + response (s)
function springTo(target, { damping = 1, response = 0.4, velocity = 0 } = {}) {
  cancelAnimationFrame(sheet.raf);
  if (reduceMotion.matches) { sheet.y = target; sheet.v = 0; applySheet(); return; }
  const k = Math.pow((2 * Math.PI) / response, 2);
  const c = (4 * Math.PI * damping) / response;
  sheet.v = velocity;
  let last = performance.now();
  const step = (now) => {
    let dt = Math.min(0.064, (now - last) / 1000);
    last = now;
    const n = Math.ceil(dt / 0.004);   // fixed sub-steps keep it stable
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = -k * (sheet.y - target) - c * sheet.v;
      sheet.v += a * h;
      sheet.y += sheet.v * h;
    }
    if (Math.abs(sheet.v) < 4 && Math.abs(sheet.y - target) < 0.4) {
      sheet.y = target; sheet.v = 0; applySheet(); return;
    }
    applySheet();
    sheet.raf = requestAnimationFrame(step);
  };
  sheet.raf = requestAnimationFrame(step);
}

// Where a flick would come to rest (Apple's deceleration projection)
function project(velocity, rate = 0.998) { return (velocity / 1000) * rate / (1 - rate); }

// Soft boundary: the further past the edge, the less it follows
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

function setDetent(name, opts) {
  sheet.detent = name;
  sheetHandle.setAttribute('aria-expanded', String(name === 'open'));
  springTo(detents()[name], opts);
}

function showSheet() {
  sheetEl.hidden = false;
  sheet.y = sheetHeight() + 24;   // start just below, rise from where it will return to
  applySheet();
  // On a phone the sheet would cover the confirmation, so it rises to its peek and invites a pull
  const narrow = window.matchMedia('(max-width: 734px)').matches;
  setDetent(narrow ? 'peek' : 'open', { damping: 1, response: 0.4 });
}

let drag = null;
let suppressClick = false;

sheetHandle.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  cancelAnimationFrame(sheet.raf);       // grab it mid-flight, from its live position
  sheetHandle.setPointerCapture(e.pointerId);
  drag = { startY: e.clientY, startSheet: sheet.y, moved: false, history: [{ t: e.timeStamp, y: e.clientY }] };
});

sheetHandle.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dy = e.clientY - drag.startY;
  if (!drag.moved && Math.abs(dy) < 6) return;   // small hysteresis before committing to a drag
  drag.moved = true;
  const { open, peek } = detents();
  let y = drag.startSheet + dy;
  if (y < open) y = open - rubberband(open - y, sheetHeight());
  else if (y > peek) y = peek + rubberband(y - peek, sheetHeight());
  sheet.y = y;
  applySheet();
  drag.history.push({ t: e.timeStamp, y: e.clientY });
  if (drag.history.length > 6) drag.history.shift();
});

function endDrag(e) {
  if (!drag) return;
  const d = drag; drag = null;
  if (!d.moved) {
    // A tap that never moved: settle back if we interrupted a motion; the click handler toggles
    springTo(detents()[sheet.detent]);
    return;
  }
  suppressClick = true;
  const h = d.history;
  const a = h[0], b = h[h.length - 1];
  const velocity = b.t > a.t ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0; // px/s
  const projected = sheet.y + project(velocity);
  const { open, peek } = detents();
  const name = Math.abs(projected - open) <= Math.abs(projected - peek) ? 'open' : 'peek';
  // A flick carried momentum, so a touch of bounce is earned here (damping 0.8, drawer values)
  setDetent(name, { damping: 0.8, response: 0.3, velocity });
}
sheetHandle.addEventListener('pointerup', endDrag);
sheetHandle.addEventListener('pointercancel', endDrag);

sheetHandle.addEventListener('click', () => {
  if (suppressClick) { suppressClick = false; return; }
  setDetent(sheet.detent === 'open' ? 'peek' : 'open', { damping: 1, response: 0.4 });
});

// Keep the sheet on its detent if the layout changes size (not when it first appears)
let lastSheetH = 0;
new ResizeObserver(() => {
  const h = sheetEl.hidden ? 0 : sheetHeight();
  if (lastSheetH && h && h !== lastSheetH && !drag) { cancelAnimationFrame(sheet.raf); sheet.y = detents()[sheet.detent]; applySheet(); }
  lastSheetH = h;
}).observe(sheetEl);

// Support engineer flow
const tagBtn = $('tagBtn');
const popover = $('popover');
const toast = $('toast');

tagBtn.addEventListener('click', () => {
  $('startHint').hidden = true;
  popover.hidden = !popover.hidden;
  if (!popover.hidden) popover.querySelector('.chip').focus();
});

function doTag(reason) {
  popover.hidden = true;
  tagBtn.disabled = true;
  const p = reason && pains.find((x) => x.priority === reason);

  if (p) {
    selected = p.id;
    renderPains(p.id);
    renderDetail();
    $('propTag').textContent = reason;
    $('propTag').classList.remove('muted');
    $('queueTag').textContent = reason;
    $('queueTag').hidden = false;
    $('runbookSteps').innerHTML = firstPlays[reason].map((s) => `<li>${s}</li>`).join('');
    $('sheetTag').textContent = reason;
    showSheet();
    $('propEscalate').textContent = 'Same day';
    $('propEscalate').classList.remove('muted');
    renderTable(true);
    toast.textContent = `Mapped "${reason}". The first table is running on their own accounts.`;
    opsBadge.hidden = false;
  } else {
    $('propTag').textContent = 'Exploring';
    toast.textContent = "Exploring freely. We'll come back to priorities after the first table.";
  }
  toast.hidden = false;
}

document.querySelectorAll('#reasonChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => doTag(chip.dataset.reason));
});
$('skipBtn').addEventListener('click', () => doTag(null));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !popover.hidden) { popover.hidden = true; tagBtn.focus(); }
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if ((e.key === 't' || e.key === 'T') && !typing && !panes.support.hidden && !tagBtn.disabled && !e.metaKey && !e.ctrlKey) {
    const r = panes.support.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) tagBtn.click();
  }
});

// Reset
$('protoReset').addEventListener('click', () => {
  pains = seedPains();
  selected = 'sales';
  readyDone = new Set();
  sent = new Set();
  popover.hidden = true;
  toast.hidden = true;
  tagBtn.disabled = false;
  $('startHint').hidden = false;
  $('propTag').textContent = 'Not mapped';
  $('propTag').classList.add('muted');
  $('propEscalate').textContent = '—';
  $('propEscalate').classList.add('muted');
  renderTable(false);
  $('queueTag').hidden = true;
  cancelAnimationFrame(sheet.raf);
  sheetEl.hidden = true;
  opsBadge.hidden = true;
  pmBadge.hidden = true;
  sqlBlock.hidden = true;
  sqlBtn.textContent = 'Show workflow';
  $('briefEmpty').hidden = false;
  $('briefBody').hidden = true;
  renderPains();
  renderDetail();
  renderReady();
  selectTab('support');
});

renderPains();
renderDetail();
renderReady();
renderTable(false);
moveIndicator(true);
document.fonts && document.fonts.ready.then(() => moveIndicator(true));
