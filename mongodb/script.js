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
  analyst: document.getElementById('pane-analyst'),
  owner: document.getElementById('pane-owner'),
  engineer: document.getElementById('pane-engineer'),
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
  if (name === 'owner') gapBadge.hidden = true;
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

// Illustrative data for the data product owner view
const seedIssues = () => ([
  {
    id: 'consumption', name: 'Atlas consumption (daily)', reason: "Numbers don't match", count: 23, reports: 11, teams: 4,
    cause: 'Manual pulls apply <strong>credits at invoice date</strong>; the gold dataset applies them at <strong>usage date</strong>. That explains <strong>$1.2M</strong> of the $1.3M September gap.',
    fix: () => 'Certify one definition of Atlas consumption revenue in <code>fin.atlas_consumption</code> with credits at usage date, retire 3 manual pulls, and notify the owners of 11 downstream reports and forecasts.',
    action: 'Review & certify',
    done: 'Certified fin.atlas_consumption v3. All 11 reports and forecasts now use the same number.',
  },
  {
    id: 'commit', name: 'Commitment drawdown', reason: 'Definition unclear', count: 14, reports: 6, teams: 3,
    cause: 'Sales Ops and FP&amp;A count <strong>unused committed spend</strong> differently when a customer renews early.',
    fix: () => 'Draft one drawdown schedule for Finance leadership to approve, and add a <code>commit_status</code> field so both views come from one table.',
    action: 'Send for approval',
    done: 'Sent to the Controller and FP&A leads for sign-off.',
  },
  {
    id: 'marketplace', name: 'Marketplace billing', reason: 'Data looks stale', count: 9, reports: 4, teams: 2,
    cause: 'AWS, Google Cloud, and Azure marketplace reports arrive up to <strong>3 days</strong> after usage, so the most recent days look low.',
    fix: () => 'Show usage-based estimates for days the marketplaces have not reported, labeled as estimates, and true them up when billing lands.',
    action: 'Add estimates',
    done: 'Estimates added. Unreported days now show as labeled estimates on every dashboard.',
  },
  {
    id: 'wfp', name: 'Headcount plan (WFP)', reason: 'Missing field', count: 5, reports: 2, teams: 1,
    cause: 'Workforce planning models need <strong>cost center</strong>, which only exists in the HR system today.',
    fix: () => 'Add <code>cost_center</code> to the certified headcount dataset, with access limited to Finance and HR.',
    action: 'Add to backlog',
    done: 'Added to the Internal Data backlog for next sprint planning.',
  },
]);

let issues = seedIssues();
let selected = 'consumption';
let flagged = false;

const gapList = document.getElementById('gapList');
const gapTitle = document.getElementById('gapTitle');
const gapMeta = document.getElementById('gapMeta');
const ownerDetail = document.getElementById('ownerDetail');
const publishBtn = document.getElementById('publishBtn');
const publishToast = document.getElementById('publishToast');

function renderIssues(bumpId) {
  const max = Math.max(...issues.map((g) => g.count));
  gapList.innerHTML = '';
  issues.forEach((g) => {
    const li = document.createElement('li');
    li.className = 'gap-row' + (g.id === selected ? ' active' : '') + (g.id === bumpId ? ' bump' : '');
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.innerHTML = `
      <span class="gap-name">${g.name}</span>
      <span class="gap-count">${g.count}</span>
      <span class="gap-reason">${g.reason}</span>
      <span class="gap-state">${g.resolved ? 'Resolved' : ''}</span>
      <span class="gap-bar"><i style="width:${(g.count / max) * 100}%"></i></span>`;
    const pick = () => { selected = g.id; renderIssues(); renderDetail(); };
    li.addEventListener('click', pick);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    gapList.appendChild(li);
  });
}

function renderDetail() {
  const g = issues.find((x) => x.id === selected);
  gapTitle.textContent = g.name;
  gapMeta.textContent = `${g.count} flags · ${g.reports} reports · ${g.teams} teams · top reason: ${g.reason}`;
  const [causeEl, fixEl] = ownerDetail.querySelectorAll('.insight p');
  causeEl.innerHTML = g.cause;
  fixEl.innerHTML = g.fix();
  ownerDetail.querySelector('.app-title').textContent = g.id === issues[0].id ? 'Top issue' : 'Issue';
  publishBtn.textContent = g.action;
  publishBtn.disabled = !!g.resolved;
  publishToast.hidden = !g.resolved;
  publishToast.textContent = g.resolved ? g.done : '';
}

// Analyst flow
const flagBtn = document.getElementById('flagBtn');
const popover = document.getElementById('popover');
const toast = document.getElementById('toast');
const layerName = document.getElementById('layerName');
const propDataset = document.getElementById('propDataset');
const propFresh = document.getElementById('propFresh');
const propCert = document.getElementById('propCert');
const deltaChip = document.getElementById('deltaChip');
const modelVal = document.getElementById('modelVal');
const modelBar = document.getElementById('modelBar');
const devWarn = document.getElementById('devWarn');
const devWarnTitle = document.getElementById('devWarnTitle');
const devWarnText = document.getElementById('devWarnText');
const devTests = document.getElementById('devTests');
const devRecon = document.getElementById('devRecon');

const setCls = (el, cls) => { el.classList.remove('ok', 'warn', 'muted', 'pend'); if (cls) el.classList.add(cls); };

function setEngineer(reason) {
  devWarn.classList.remove('resolved');
  devWarnTitle.textContent = 'Open trust issue.';
  devWarnText.innerHTML = `Flagged by FP&amp;A on <code>fin.atlas_consumption</code>. ${reason}`;
}

flagBtn.addEventListener('click', () => {
  document.getElementById('startHint').hidden = true;
  popover.hidden = !popover.hidden;
  if (!popover.hidden) popover.querySelector('.chip').focus();
});

function doFlag(reason) {
  flagged = true;
  popover.hidden = true;
  flagBtn.disabled = true;
  layerName.classList.add('linked');
  layerName.innerHTML = '<span class="src-icon">Σ</span> Atlas usage (gold)';
  propDataset.textContent = 'fin.atlas_consumption';
  propFresh.textContent = '2 hours ago';
  setCls(propFresh, null);
  propCert.textContent = 'Pending review';
  setCls(propCert, 'pend');
  deltaChip.textContent = 'Flagged · switched to gold source';
  deltaChip.className = 'delta pending';

  const c = issues.find((g) => g.id === 'consumption');
  c.count += 1;
  selected = 'consumption';
  renderIssues('consumption');
  renderDetail();

  toast.textContent = reason
    ? `Flagged. "${reason}" sent to the Internal Data team with lineage attached.`
    : 'Flagged. Lineage and both numbers sent to the Internal Data team.';
  toast.hidden = false;
  gapBadge.textContent = '+1';
  gapBadge.hidden = false;
  setEngineer(reason ? `Reason: ${reason}.` : 'Reason: not given (values differ by $1.3M).');
}

document.querySelectorAll('#reasonChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => doFlag(chip.dataset.reason));
});
document.getElementById('skipBtn').addEventListener('click', () => doFlag(null));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !popover.hidden) { popover.hidden = true; flagBtn.focus(); }
});

publishBtn.addEventListener('click', () => {
  const g = issues.find((x) => x.id === selected);
  g.resolved = true;
  renderIssues();
  renderDetail();
  if (g.id === 'consumption') {
    devWarn.classList.add('resolved');
    devWarnTitle.textContent = 'Resolved.';
    devWarnText.innerHTML = 'Credits now applied at usage date in <code>fin.atlas_consumption</code> v3.';
    devTests.textContent = '42 of 42 passing';
    devRecon.textContent = 'Within 0.1%';
    setCls(devRecon, 'ok');
    propCert.textContent = 'Yes';
    setCls(propCert, 'ok');
    modelVal.textContent = '$48.2M';
    modelBar.querySelector('i').style.width = '100%';
    deltaChip.textContent = 'Matches certified source';
    deltaChip.className = 'delta ok';
    if (!flagged) {
      flagBtn.disabled = true;
      document.getElementById('startHint').hidden = true;
    }
  }
});

// Engineer copy button
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
  issues = seedIssues();
  selected = 'consumption';
  flagged = false;
  popover.hidden = true;
  toast.hidden = true;
  flagBtn.disabled = false;
  document.getElementById('startHint').hidden = false;
  layerName.classList.remove('linked');
  layerName.innerHTML = '<span class="src-icon">Σ</span> Atlas usage (export)';
  propDataset.textContent = 'Manual export';
  propFresh.textContent = '6 days ago';
  setCls(propFresh, 'muted');
  propCert.textContent = 'No';
  setCls(propCert, 'warn');
  modelVal.textContent = '$46.9M';
  modelBar.querySelector('i').style.width = '97.3%';
  deltaChip.textContent = 'Δ $1.3M unexplained';
  deltaChip.className = 'delta';
  gapBadge.hidden = true;
  setEngineer("Reason: Numbers don't match.");
  devTests.textContent = '41 of 42 passing';
  devRecon.textContent = 'Off by 2.7%';
  setCls(devRecon, 'warn');
  renderIssues();
  renderDetail();
  selectTab('analyst');
});

renderIssues();
renderDetail();
