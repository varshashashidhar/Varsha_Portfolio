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
  req: document.getElementById('pane-req'),
  pilot: document.getElementById('pane-pilot'),
  qa: document.getElementById('pane-qa'),
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
  if (name === 'pilot') gapBadge.hidden = true;
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

const $ = (id) => document.getElementById(id);
const flagBtn = $('flagBtn');
const popover = $('popover');
const toast = $('toast');
const layerName = $('layerName');
const planBar = $('planBar');
const propStatus = $('propStatus');
const publishBtn = $('publishBtn');
const publishToast = $('publishToast');
const devWarn = $('devWarn');
const shareBtn = $('shareBtn');
const shareToast = $('shareToast');
const devAccept = $('devAccept');
const specOriginal = $('specOriginal');
const specVendors = $('specVendors');

const setCls = (el, cls) => { el.classList.remove('ok', 'warn', 'muted', 'pend'); if (cls) el.classList.add(cls); };

function markSent(reason) {
  layerName.innerHTML = '<span class="src-icon">◐</span> Chemistry reasoning (pilot)';
  planBar.textContent = '90% agreement on the gold set';
  planBar.classList.remove('tbd');
  propStatus.textContent = 'Pilot running · 3 vendors';
  setCls(propStatus, 'pend');
  specOriginal.textContent = reason === 'Original work only' ? 'required' : 'preferred';
  flagBtn.disabled = true;
  $('startHint').hidden = true;
}

flagBtn.addEventListener('click', () => {
  $('startHint').hidden = true;
  popover.hidden = !popover.hidden;
  if (!popover.hidden) popover.querySelector('.chip').focus();
});

function doSend(reason) {
  popover.hidden = true;
  markSent(reason);
  toast.textContent = reason
    ? `Sent. "${reason}" is in the pilot brief. 3 vendors start a 50-item paid pilot this week.`
    : 'Sent. 3 vendors start a 50-item paid pilot this week.';
  toast.hidden = false;
  gapBadge.textContent = '+1';
  gapBadge.hidden = false;
}

document.querySelectorAll('#reasonChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => doSend(chip.dataset.reason));
});
$('skipBtn').addEventListener('click', () => doSend(null));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !popover.hidden) { popover.hidden = true; flagBtn.focus(); }
});

const VENDORS_HTML = '\n  - { <span class="at">name</span>: <span class="st">vendor_b</span>, <span class="at">share</span>: <span class="tk">0.8</span> }\n  - { <span class="at">name</span>: <span class="st">vendor_a</span>, <span class="at">share</span>: <span class="tk">0.2</span> }  <span class="cm"># stereochemistry</span>';

publishBtn.addEventListener('click', () => {
  if (!flagBtn.disabled) markSent(null);
  publishBtn.disabled = true;
  publishToast.textContent = 'Plan approved. Vendor B starts on 2,400 items and vendor A on the 600 stereochemistry items.';
  publishToast.hidden = false;

  devWarn.classList.add('resolved');
  $('devWarnTitle').textContent = 'First batch in.';
  $('devWarnText').textContent = '25 items sampled and reviewed with the researcher, tagged by issue type.';
  $('iss1').textContent = '3';
  $('iss2').textContent = '2';
  $('iss3').textContent = '1';
  $('iss4').textContent = '1';
  devAccept.textContent = '92%';
  setCls(devAccept, 'ok');
  specVendors.innerHTML = VENDORS_HTML;
  shareBtn.disabled = false;
});

shareBtn.addEventListener('click', () => {
  shareBtn.disabled = true;
  shareToast.textContent = 'Feedback sent with 4 annotated examples. Both vendors will apply it to the next batch.';
  shareToast.hidden = false;
});

// Copy spec
const copyBtn = $('copyBtn');
copyBtn.addEventListener('click', async () => {
  const code = $('codeSnippet');
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
$('protoReset').addEventListener('click', () => {
  popover.hidden = true;
  toast.hidden = true;
  flagBtn.disabled = false;
  $('startHint').hidden = false;
  layerName.innerHTML = '<span class="src-icon">○</span> Chemistry reasoning (draft)';
  planBar.textContent = 'To confirm';
  planBar.classList.add('tbd');
  propStatus.textContent = 'Draft';
  setCls(propStatus, 'muted');
  specOriginal.textContent = 'tbd';
  gapBadge.hidden = true;
  publishBtn.disabled = false;
  publishToast.hidden = true;
  devWarn.classList.remove('resolved');
  $('devWarnTitle').textContent = 'Waiting on plan approval.';
  $('devWarnText').textContent = 'Approve a vendor plan to start the first batch.';
  ['iss1', 'iss2', 'iss3', 'iss4'].forEach((id) => { $(id).textContent = '–'; });
  devAccept.textContent = '–';
  setCls(devAccept, 'muted');
  specVendors.innerHTML = '<span class="st">pending_pilot</span>';
  shareBtn.disabled = true;
  shareToast.hidden = true;
  selectTab('req');
});
