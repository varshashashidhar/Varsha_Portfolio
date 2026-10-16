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

// ---------- Scroll progress ----------
const progress = document.getElementById('progress');
const onScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
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

// ---------- Prototype ----------
const tabs = Array.from(document.querySelectorAll('.proto-tab'));
const panes = {
  trainer: document.getElementById('pane-trainer'),
  pgm: document.getElementById('pane-pgm'),
  researcher: document.getElementById('pane-researcher'),
};
const gapBadge = document.getElementById('gapBadge');

function selectTab(name) {
  tabs.forEach((t) => {
    const on = t.dataset.pane === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  });
  Object.entries(panes).forEach(([key, pane]) => {
    pane.hidden = key !== name;
    pane.classList.toggle('active', key === name);
  });
  if (name === 'pgm') gapBadge.hidden = true;
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

// Illustrative data for the program manager view
const seedHotspots = () => ([
  {
    id: 's4', name: '§4 Concise vs. complete', count: 37, agree: 58, vendors: 3,
    split: 'When both responses are correct, <strong>52%</strong> of trainers prefer the shorter one and <strong>48%</strong> the longer one. The researcher\'s intent is completeness first.',
    draft: () => 'Add to §4: <em>If both responses are correct, prefer the one that fully answers the question, even if it is longer. Use length only to break a tie.</em> Includes 2 worked examples.',
    action: 'Publish & recalibrate',
    done: 'Published instructions v1.3 to 3 vendors. 412 trainers get a 5-question calibration quiz before their next task.',
  },
  {
    id: 's2', name: '§2 Partly correct code', count: 21, agree: 71, vendors: 3,
    split: 'Trainers disagree on whether code that runs but has a <strong>subtle bug</strong> counts as correct.',
    draft: () => 'Add a third correctness level, <em>Runs with a bug</em>, ranked below fully correct and above broken. Includes 3 worked examples.',
    action: 'Send to researcher',
    done: 'Sent to the researcher for approval before it reaches vendors.',
  },
  {
    id: 's6', name: '§6 Unsafe requests', count: 9, agree: 84, vendors: 2,
    split: 'Most disagreement comes from <strong>one vendor</strong>, on prompts that ask for security testing code.',
    draft: () => 'No rule change needed. Schedule a 15-minute calibration session with that vendor\'s team leads using the 6 flagged tasks.',
    action: 'Schedule session',
    done: 'Calibration session requested with the vendor\'s team leads.',
  },
  {
    id: 'ex', name: 'Example missing: refactors', count: 4, agree: 90, vendors: 1,
    split: 'Trainers asked for an example of a response that <strong>refactors</strong> the user\'s code instead of answering directly.',
    draft: () => 'Agreement is already above target. Add one worked example to the appendix in the next scheduled update.',
    action: 'Add to next update',
    done: 'Queued for the next scheduled instruction update.',
  },
]);

let hotspots = seedHotspots();
let selected = 's4';
let flagged = false;

const gapList = document.getElementById('gapList');
const gapTitle = document.getElementById('gapTitle');
const gapMeta = document.getElementById('gapMeta');
const ownerDetail = document.getElementById('ownerDetail');
const publishBtn = document.getElementById('publishBtn');
const publishToast = document.getElementById('publishToast');

function renderHotspots(bumpId) {
  const max = Math.max(...hotspots.map((g) => g.count));
  gapList.innerHTML = '';
  hotspots.forEach((g) => {
    const li = document.createElement('li');
    li.className = 'gap-row' + (g.id === selected ? ' active' : '') + (g.id === bumpId ? ' bump' : '');
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.innerHTML = `
      <span class="gap-name">${g.name}</span>
      <span class="gap-count">${g.count}</span>
      <span class="gap-reason">${g.resolved ? 'Resolved' : `Agreement <span class="agree${g.agree >= 80 ? ' ok' : ''}">${g.agree}%</span>`}</span>
      <span></span>
      <span class="gap-bar"><i style="width:${(g.count / max) * 100}%"></i></span>`;
    const pick = () => { selected = g.id; renderHotspots(); renderDetail(); };
    li.addEventListener('click', pick);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    gapList.appendChild(li);
  });
}

function renderDetail() {
  const g = hotspots.find((x) => x.id === selected);
  gapTitle.textContent = g.name;
  gapMeta.textContent = `${g.count} flags · ${g.vendors} vendors · gold-task agreement ${g.agree}%`;
  const [splitEl, draftEl] = ownerDetail.querySelectorAll('.insight p');
  splitEl.innerHTML = g.split;
  draftEl.innerHTML = g.draft();
  ownerDetail.querySelector('.app-title').textContent = g.id === hotspots[0].id ? 'Top hotspot' : 'Hotspot';
  publishBtn.textContent = g.action;
  publishBtn.disabled = !!g.resolved;
  publishToast.hidden = !g.resolved;
  publishToast.textContent = g.resolved ? g.done : '';
}

// Trainer flow
const flagBtn = document.getElementById('flagBtn');
const popover = document.getElementById('popover');
const toast = document.getElementById('toast');
const layerName = document.getElementById('layerName');
const prefBtns = Array.from(document.querySelectorAll('#pref button'));
const guide = document.getElementById('guide');
const guideText = document.getElementById('guideText');
const propVersion = document.getElementById('propVersion');
const devWarn = document.getElementById('devWarn');
const devWarnTitle = document.getElementById('devWarnTitle');
const devWarnText = document.getElementById('devWarnText');
const devAgree = document.getElementById('devAgree');
const devAccept = document.getElementById('devAccept');
const devVersion = document.getElementById('devVersion');
const specVersion = document.getElementById('specVersion');

const setCls = (el, cls) => { el.classList.remove('ok', 'warn', 'muted', 'pend'); if (cls) el.classList.add(cls); };
let choice = null;

prefBtns.forEach((b) => b.addEventListener('click', () => {
  choice = b.dataset.v;
  prefBtns.forEach((x) => x.classList.toggle('on', x === b));
}));

flagBtn.addEventListener('click', () => {
  document.getElementById('startHint').hidden = true;
  popover.hidden = !popover.hidden;
  if (!popover.hidden) popover.querySelector('.chip').focus();
});

function doFlag(reason) {
  flagged = true;
  popover.hidden = true;
  flagBtn.disabled = true;
  layerName.innerHTML = '<span class="src-icon">⚑</span> Task 214 (flagged)';

  const s4 = hotspots.find((g) => g.id === 's4');
  s4.count += 1;
  selected = 's4';
  renderHotspots('s4');
  renderDetail();

  const rating = choice ? `Your rating (${choice === 'Tie' ? 'Tie' : 'Prefer ' + choice}) was saved.` : 'Rate the task whenever you are ready.';
  toast.textContent = reason
    ? `Flagged "${reason}". ${rating}`
    : `Flagged for review. ${rating}`;
  toast.hidden = false;
  gapBadge.textContent = '+1';
  gapBadge.hidden = false;
}

document.querySelectorAll('#reasonChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => doFlag(chip.dataset.reason));
});
document.getElementById('skipBtn').addEventListener('click', () => doFlag(null));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !popover.hidden) { popover.hidden = true; flagBtn.focus(); }
});

publishBtn.addEventListener('click', () => {
  const g = hotspots.find((x) => x.id === selected);
  g.resolved = true;
  if (g.id === 's4') g.agree = 86;
  renderHotspots();
  renderDetail();
  if (g.id === 's4') {
    devWarn.classList.add('resolved');
    devWarnTitle.textContent = 'Back on target.';
    devWarnText.textContent = 'After v1.3 and recalibration, gold-task agreement on §4 is 86%. Batches 7–9 released.';
    devAgree.textContent = '86%';
    setCls(devAgree, 'ok');
    devAccept.textContent = '94%';
    setCls(devAccept, 'ok');
    devVersion.textContent = 'v1.3';
    specVersion.textContent = 'v1.3';
    propVersion.textContent = 'v1.3';
    guide.classList.add('ok');
    guideText.textContent = 'If both are correct, prefer the complete answer. Length only breaks ties.';
    if (!flagged) {
      flagBtn.disabled = true;
      document.getElementById('startHint').hidden = true;
    }
  }
});

// Researcher copy button
const copyBtn = document.getElementById('copyBtn');
copyBtn.addEventListener('click', async () => {
  const code = document.getElementById('codeSnippet');
  try {
    await navigator.clipboard.writeText(code.innerText);
    copyBtn.textContent = 'Copied';
  } catch (_) {
    const range = document.createRange();
    range.selectNodeContents(code);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    copyBtn.textContent = 'Selected';
  }
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
});

// Reset
document.getElementById('protoReset').addEventListener('click', () => {
  hotspots = seedHotspots();
  selected = 's4';
  flagged = false;
  choice = null;
  prefBtns.forEach((x) => x.classList.remove('on'));
  popover.hidden = true;
  toast.hidden = true;
  flagBtn.disabled = false;
  document.getElementById('startHint').hidden = false;
  layerName.innerHTML = '<span class="src-icon">●</span> Task 214';
  gapBadge.hidden = true;
  devWarn.classList.remove('resolved');
  devWarnTitle.textContent = 'Below target.';
  devWarnText.textContent = 'Gold-task agreement on §4 is 58% (target 80%). Batches 7–9 held for review.';
  devAgree.textContent = '58%';
  setCls(devAgree, 'warn');
  devAccept.textContent = '71%';
  setCls(devAccept, 'warn');
  devVersion.textContent = 'v1.2';
  specVersion.textContent = 'v1.2';
  propVersion.textContent = 'v1.2';
  guide.classList.remove('ok');
  guideText.textContent = 'Prefer concise responses.';
  renderHotspots();
  renderDetail();
  selectTab('trainer');
});

renderHotspots();
renderDetail();
