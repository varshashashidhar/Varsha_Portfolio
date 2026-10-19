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

// Illustrative data for the Product Ops view
const seedPains = () => ([
  {
    id: 'explain', name: 'Score explainability', tickets: 47, customers: 19, ttr: 9.5, escalated: 41,
    insight: 'Customers want to know <strong>which factors drove a high score</strong> before declining a payment. 41% of these tickets were escalated to engineering.',
    quote: 'Our risk team wants to know which factors drove it before we decline. Is there a way to see that from the API?',
    rec: 'Return the top contributing factors alongside the score, publish a "Reading your score" guide, and add a runbook so support can answer without escalating.',
    runbook: ['Pull the request_id and confirm the score and rule outcome in internal tools.', 'Share the "Reading your score" guide and the factor categories it covers.', 'If the customer needs per-transaction factors, link this ticket to the open brief.'],
  },
  {
    id: 'rules', name: 'Rule configuration', tickets: 31, customers: 14, ttr: 6.0, escalated: 22,
    insight: 'Rules saved in the Dashboard are <strong>not applied until the next request</strong>, and customers read that as a bug.',
    quote: 'We saved the rule an hour ago and it still let a risky debit through.',
    rec: 'Show "Active from" timing in the rule editor and add a test-rule flow in Sandbox.',
    runbook: ['Confirm the rule version and its activation time.', 'Explain when saved rules take effect.', 'Offer the Sandbox steps to test a rule before going live.'],
  },
  {
    id: 'webhook', name: 'Webhook timing', tickets: 22, customers: 11, ttr: 4.5, escalated: 9,
    insight: 'Developers are unsure <strong>which webhook fires on an ACH return</strong> and in what order.',
    quote: 'Which event should we listen for to know a debit was returned?',
    rec: 'Add a sequence diagram of payment events to the docs and a webhook FAQ macro for support.',
    runbook: ['Identify the event the customer is listening for.', 'Share the event-sequence doc.', 'Suggest the Sandbox endpoint to fire test webhooks.'],
  },
  {
    id: 'docs', name: 'Docs gap', tickets: 12, customers: 8, ttr: 3.0, escalated: 2,
    insight: 'Sandbox behavior differs from production, and the <strong>quickstart doesn\'t say so</strong>.',
    quote: 'Sandbox scores look random. Is that expected?',
    rec: 'Add a one-paragraph Sandbox note to the quickstart. Small fix; no PM brief needed.',
    runbook: ['Confirm the customer is testing in Sandbox.', 'Explain how Sandbox scores are generated.', 'Link the quickstart section.'],
  },
]);

const readinessItems = [
  { label: 'API reference updated with score factors', owner: 'Docs · Product' },
  { label: '"Reading your score" guide published', owner: 'Product Ops' },
  { label: 'Support runbook and macro live', owner: 'Product Ops · CES' },
  { label: '30-min CES enablement session', owner: 'Product Ops' },
  { label: 'Pain-point dashboard tracking post-fix tickets', owner: 'Product Ops' },
];

let pains = seedPains();
let selected = 'explain';
let readyDone = new Set();
let sent = new Set();

const gapList = document.getElementById('gapList');
const sendBtn = document.getElementById('sendBtn');
const sendToast = document.getElementById('sendToast');
const sqlBtn = document.getElementById('sqlBtn');
const sqlBlock = document.getElementById('sqlBlock');
const $ = (id) => document.getElementById(id);

function renderPains(bumpId) {
  const max = Math.max(...pains.map((p) => p.customers));
  gapList.innerHTML = '';
  pains.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'gap-row' + (p.id === selected ? ' active' : '') + (p.id === bumpId ? ' bump' : '');
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.innerHTML = `
      <span class="gap-name">${p.name}</span>
      <span class="gap-count">${p.customers} cust.</span>
      <span class="gap-reason">${p.tickets} tickets · ${p.escalated}% escalated</span>
      <span></span>
      <span class="gap-bar"><i style="width:${(p.customers / max) * 100}%"></i></span>`;
    const pick = () => { selected = p.id; renderPains(); renderDetail(); };
    li.addEventListener('click', pick);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    gapList.appendChild(li);
  });
}

function sqlFor(p) {
  return `<span class="cm">-- ${p.name}: volume, reach, and resolution time (last 30 days)</span>
<span class="kw">SELECT</span>
  t.pain_point_tag,
  <span class="fn">COUNT</span>(*)                       <span class="kw">AS</span> tickets,
  <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> t.customer_id)  <span class="kw">AS</span> customers,
  <span class="fn">MEDIAN</span>(t.hours_to_resolve)     <span class="kw">AS</span> median_ttr,
  <span class="fn">AVG</span>(<span class="fn">IFF</span>(t.escalated, 1, 0))    <span class="kw">AS</span> escalation_rate
<span class="kw">FROM</span> support_tickets t
<span class="kw">JOIN</span> customers c <span class="kw">ON</span> c.id = t.customer_id
<span class="kw">WHERE</span> t.product = <span class="st">'signal'</span>
  <span class="kw">AND</span> t.pain_point_tag = <span class="st">'${p.name.toLowerCase().replace(/ /g, '_')}'</span>
  <span class="kw">AND</span> <span class="kw">NOT</span> c.is_test_account
  <span class="kw">AND</span> t.resolved_at >= <span class="fn">DATEADD</span>(day, -30, <span class="fn">CURRENT_DATE</span>)
<span class="kw">GROUP BY</span> 1;`;
}

function renderDetail() {
  const p = pains.find((x) => x.id === selected);
  $('detailLabel').textContent = p.id === pains[0].id ? 'Top pain point' : 'Pain point';
  $('gapTitle').textContent = p.name;
  $('gapMeta').textContent = `Ranked by customers affected · ${p.escalated}% escalated to engineering`;
  $('kpiTickets').textContent = p.tickets;
  $('kpiCustomers').textContent = p.customers;
  $('kpiTtr').textContent = p.ttr.toFixed(1);
  $('gapInsight').innerHTML = p.insight;
  $('sqlCode').innerHTML = sqlFor(p);
  sendToast.hidden = true;
  const isSmall = p.id === 'docs';
  sendBtn.textContent = isSmall ? 'Fix in docs directly' : 'Send brief to PM';
  sendBtn.disabled = sent.has(p.id);
}

sqlBtn.addEventListener('click', () => {
  sqlBlock.hidden = !sqlBlock.hidden;
  sqlBtn.textContent = sqlBlock.hidden ? 'Show SQL' : 'Hide SQL';
  sqlBtn.setAttribute('aria-expanded', String(!sqlBlock.hidden));
});

function renderBrief(p) {
  $('briefEmpty').hidden = true;
  $('briefBody').hidden = false;
  $('briefTitle').textContent = `Signal: ${p.name.toLowerCase()} is blocking go-lives`;
  $('briefMeta').textContent = 'Signal (beta) · prepared for the Signal PM · illustrative data';
  $('briefEvidence').innerHTML = `
    <li><strong>${p.tickets}</strong> tickets from <strong>${p.customers}</strong> customers in 30 days, the #1 pain point by reach.</li>
    <li><strong>${p.escalated}%</strong> escalated to engineering; median <strong>${p.ttr.toFixed(1)} hrs</strong> to resolve.</li>
    <li>Raised most often by teams preparing to go live.</li>`;
  $('briefQuote').textContent = `"${p.quote}"`;
  $('briefRec').textContent = p.rec;
}

sendBtn.addEventListener('click', () => {
  const p = pains.find((x) => x.id === selected);
  if (p.id === 'docs') {
    sendToast.textContent = 'Docs fix filed with the docs team. Tracking repeat tickets for 30 days.';
  } else {
    renderBrief(p);
    pmBadge.hidden = false;
    sendToast.textContent = `Brief sent to the Signal PM with ${p.tickets} linked tickets and the query behind every number.`;
  }
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
  gate.textContent = pass ? 'GA gate: ready to launch ✓' : `GA gate: blocked on ${readinessItems.length - n} open item${readinessItems.length - n === 1 ? '' : 's'}`;
}

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
  const p = reason && pains.find((x) => x.name === reason);

  if (p) {
    p.tickets += 1;
    selected = p.id;
    renderPains(p.id);
    renderDetail();
    $('propTag').textContent = reason;
    $('propTag').classList.remove('muted');
    $('queueTag').textContent = reason;
    $('queueTag').hidden = false;
    $('runbookSteps').innerHTML = p.runbook.map((s) => `<li>${s}</li>`).join('');
    $('runbook').hidden = false;
    $('propEscalate').textContent = 'No, runbook covers it';
    toast.textContent = `Tagged "${reason}". Ticket linked to the Signal VoC dashboard.`;
    opsBadge.hidden = false;
  } else {
    $('propTag').textContent = 'Untagged';
    toast.textContent = 'Resolved without a tag. Logged for weekly taxonomy review.';
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
  selected = 'explain';
  readyDone = new Set();
  sent = new Set();
  popover.hidden = true;
  toast.hidden = true;
  tagBtn.disabled = false;
  $('startHint').hidden = false;
  $('propTag').textContent = 'None';
  $('propTag').classList.add('muted');
  $('propEscalate').textContent = 'Not yet';
  $('queueTag').hidden = true;
  $('runbook').hidden = true;
  opsBadge.hidden = true;
  pmBadge.hidden = true;
  sqlBlock.hidden = true;
  sqlBtn.textContent = 'Show SQL';
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
moveIndicator(true);
document.fonts && document.fonts.ready.then(() => moveIndicator(true));
