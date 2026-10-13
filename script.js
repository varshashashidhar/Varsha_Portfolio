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
  designer: document.getElementById('pane-designer'),
  owner: document.getElementById('pane-owner'),
  engineer: document.getElementById('pane-engineer'),
};

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

// Illustrative data for the System owner view
const seedGaps = () => ([
  {
    id: 'button', name: 'Button / Primary', reason: 'Missing variant', count: 63, files: 12, teams: 5,
    override: 'Designers added a <strong>leading icon</strong> in <strong>64%</strong> of detaches.',
    proposal: (n) => `Add boolean property <code>Leading icon</code> with an instance-swap slot, defaulting to off. Matches 41 of ${n} detached layers.`,
  },
  {
    id: 'input', name: 'Input / Text field', reason: "Can't override property", count: 38, files: 9, teams: 4,
    override: 'Designers changed the <strong>helper text color</strong> to show a warning state in <strong>71%</strong> of detaches.',
    proposal: (n) => `Add a <code>State = Warning</code> variant using the existing warning color variable. Matches 27 of ${n} detached layers.`,
  },
  {
    id: 'card', name: 'Card / Media', reason: 'Layout / sizing', count: 24, files: 7, teams: 3,
    override: 'Designers switched the card to a <strong>horizontal layout</strong> in <strong>58%</strong> of detaches.',
    proposal: (n) => `Add <code>Orientation</code> property (Vertical, Horizontal) using auto layout. Matches 14 of ${n} detached layers.`,
  },
  {
    id: 'toast', name: 'Toast / Inline', reason: 'Content', count: 11, files: 5, teams: 2,
    override: 'Designers added a <strong>second action link</strong> in <strong>45%</strong> of detaches.',
    proposal: (n) => `Likely intentional one-offs. Suggest leaving as-is and revisiting if volume grows (${n} detaches).`,
  },
]);

let gaps = seedGaps();
let selectedGap = 'button';

const gapList = document.getElementById('gapList');
const gapBadge = document.getElementById('gapBadge');
const gapTitle = document.getElementById('gapTitle');
const gapMeta = document.getElementById('gapMeta');
const ownerDetail = document.getElementById('ownerDetail');
const publishBtn = document.getElementById('publishBtn');
const publishToast = document.getElementById('publishToast');

function renderGaps(bumpId) {
  const max = Math.max(...gaps.map((g) => g.count));
  gapList.innerHTML = '';
  gaps.forEach((g) => {
    const li = document.createElement('li');
    li.className = 'gap-row' + (g.id === selectedGap ? ' active' : '') + (g.id === bumpId ? ' bump' : '');
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.innerHTML = `
      <span class="gap-name">${g.name}</span>
      <span class="gap-count">${g.count}</span>
      <span class="gap-reason">${g.reason}</span>
      <span></span>
      <span class="gap-bar"><i style="width:${(g.count / max) * 100}%"></i></span>`;
    const pick = () => { selectedGap = g.id; renderGaps(); renderDetail(); };
    li.addEventListener('click', pick);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    gapList.appendChild(li);
  });
}

function renderDetail() {
  const g = gaps.find((x) => x.id === selectedGap);
  gapTitle.textContent = g.name;
  gapMeta.textContent = `${g.count} detaches · ${g.files} files · ${g.teams} teams · top reason: ${g.reason}`;
  const [overrideEl, proposalEl] = ownerDetail.querySelectorAll('.insight p');
  overrideEl.innerHTML = g.override;
  proposalEl.innerHTML = g.proposal(g.count);
  ownerDetail.querySelector('.app-title').textContent = g.id === gaps[0].id ? 'Top gap' : 'Gap';
  publishToast.hidden = true;
  publishBtn.disabled = false;
  publishBtn.textContent = g.id === 'toast' ? 'Acknowledge' : 'Review & publish';
}

publishBtn.addEventListener('click', () => {
  const g = gaps.find((x) => x.id === selectedGap);
  publishToast.textContent = g.id === 'toast'
    ? 'Marked as intentional. You will be notified if volume grows.'
    : `Published to Core library v2.4. Detached layers that match can now be re-linked in one click.`;
  publishToast.hidden = false;
  publishBtn.disabled = true;
});

// Designer flow
const detachBtn = document.getElementById('detachBtn');
const popover = document.getElementById('popover');
const toast = document.getElementById('toast');
const layerName = document.getElementById('layerName');
const propsTitle = document.getElementById('propsTitle');
const propComp = document.getElementById('propComp');
const mockIcon = document.getElementById('mockIcon');
const propIcon = document.getElementById('propIcon');
const canvas = document.querySelector('.app-canvas');
const devReason = document.getElementById('devReason');

detachBtn.addEventListener('click', () => {
  document.getElementById('startHint').hidden = true;
  popover.hidden = !popover.hidden;
  if (!popover.hidden) popover.querySelector('.chip').focus();
});

function doDetach(reason) {
  popover.hidden = true;
  detachBtn.disabled = true;
  layerName.classList.add('detached');
  layerName.innerHTML = '<span class="comp-icon">#</span> Button (detached)';
  propsTitle.textContent = 'Frame';
  propComp.textContent = 'None';
  mockIcon.hidden = false;
  propIcon.textContent = 'Added manually';
  canvas.classList.add('detached-state');

  const button = gaps.find((g) => g.id === 'button');
  button.count += 1;
  selectedGap = 'button';
  renderGaps('button');
  renderDetail();

  toast.textContent = reason
    ? `Detached. "${reason}" sent to the Core design system team.`
    : 'Detached. Change summary logged for the Core design system team.';
  toast.hidden = false;
  gapBadge.textContent = '+1';
  gapBadge.hidden = false;
  devReason.textContent = reason ? `Reason: ${reason}.` : 'Reason: not given (change summary: added leading icon).';
}

document.querySelectorAll('#reasonChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => doDetach(chip.dataset.reason));
});
document.getElementById('skipBtn').addEventListener('click', () => doDetach(null));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !popover.hidden) { popover.hidden = true; detachBtn.focus(); }
});

// Engineer copy button
const copyBtn = document.getElementById('copyBtn');
copyBtn.addEventListener('click', async () => {
  const text = document.getElementById('codeSnippet').innerText;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = 'Copied';
  } catch (_) {
    copyBtn.textContent = 'Select to copy';
  }
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
});

// Reset
document.getElementById('protoReset').addEventListener('click', () => {
  gaps = seedGaps();
  selectedGap = 'button';
  popover.hidden = true;
  toast.hidden = true;
  detachBtn.disabled = false;
  document.getElementById('startHint').hidden = false;
  layerName.classList.remove('detached');
  layerName.innerHTML = '<span class="comp-icon">◇</span> Button / Primary';
  propsTitle.textContent = 'Instance';
  propComp.textContent = 'Button / Primary';
  mockIcon.hidden = true;
  propIcon.textContent = 'Not available';
  canvas.classList.remove('detached-state');
  gapBadge.hidden = true;
  devReason.textContent = 'Reason: Missing variant.';
  renderGaps();
  renderDetail();
  selectTab('designer');
});

renderGaps();
renderDetail();
