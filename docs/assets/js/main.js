'use strict';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* RisingLetters: split text into letters that rise one by one */
function splitLetters(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  let i = 0;
  text.split(' ').forEach((word, wi) => {
    if (wi) el.append(' ');
    const w = document.createElement('span');
    w.className = 'w';
    w.setAttribute('aria-hidden', 'true');
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'ch';
      c.style.setProperty('--i', i++);
      c.textContent = ch;
      w.append(c);
    }
    el.append(w);
  });
}

const risers = document.querySelectorAll('[data-rise]');
risers.forEach(splitLetters);
const riseObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); riseObserver.unobserve(e.target); }
  });
}, { threshold: 0.4 });
risers.forEach((el) => (el.hasAttribute('data-rise-now') ? el.classList.add('in') : riseObserver.observe(el)));

/* Copy buttons */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // file:// or older browsers: fall back to a hidden textarea
    const t = document.createElement('textarea');
    t.value = text;
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.append(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
}
document.querySelectorAll('.copy').forEach((btn) => {
  let timer;
  btn.addEventListener('click', async () => {
    await copyText(btn.dataset.copy);
    btn.classList.add('done');
    btn.setAttribute('aria-label', '설치 명령 복사됨');
    clearTimeout(timer);
    timer = setTimeout(() => {
      btn.classList.remove('done');
      btn.setAttribute('aria-label', '설치 명령 복사');
    }, 1800);
  });
});

/* Sliding lens under the selected tab */
function placeLens(tabs) {
  const sel = tabs.querySelector('[aria-selected="true"]');
  const lens = tabs.querySelector('.lens');
  if (!sel) return;
  lens.style.width = sel.offsetWidth + 'px';
  lens.style.transform = `translateX(${sel.offsetLeft}px)`;
}
function selectTab(tabs, index) {
  tabs.querySelectorAll('[role="tab"]').forEach((b, i) => {
    b.setAttribute('aria-selected', String(i === index));
    if (b.id) b.tabIndex = i === index ? 0 : -1;
  });
  placeLens(tabs);
  // A tab row wider than the screen scrolls inside itself to keep the selection in view.
  const sel = tabs.querySelectorAll('[role="tab"]')[index];
  if (sel && tabs.scrollWidth > tabs.clientWidth) {
    tabs.scrollTo({ left: sel.offsetLeft - (tabs.clientWidth - sel.offsetWidth) / 2, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }
}
const allTabs = document.querySelectorAll('.lens-tabs');
addEventListener('resize', () => allTabs.forEach(placeLens));
document.fonts && document.fonts.ready.then(() => allTabs.forEach(placeLens));
allTabs.forEach(placeLens);

/* Install tabs */
const installTabs = document.querySelector('.install-tabs');
const installButtons = [...installTabs.querySelectorAll('[role="tab"]')];
function showInstall(i, focus) {
  selectTab(installTabs, i);
  installButtons.forEach((b, j) => { document.getElementById(b.getAttribute('aria-controls')).hidden = i !== j; });
  if (focus) installButtons[i].focus();
}
installButtons.forEach((b, i) => {
  b.addEventListener('click', () => showInstall(i));
  b.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      showInstall((i + (e.key === 'ArrowRight' ? 1 : -1) + installButtons.length) % installButtons.length, true);
    }
  });
});

/* MCP chat: type the request, then reveal tool calls and the result card */
const chat = document.querySelector('.chat');
const typed = chat.querySelector('.typed');
const steps = [...chat.querySelectorAll('.tools li'), chat.querySelector('.ai'), chat.querySelector('.result')];
if (reduceMotion.matches) {
  typed.textContent = typed.dataset.text;
} else {
  chat.classList.add('js');
  const chatObserver = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    chatObserver.disconnect();
    const text = typed.dataset.text;
    let n = 0;
    chat.classList.add('typing');
    const typer = setInterval(() => {
      typed.textContent = text.slice(0, ++n);
      if (n < text.length) return;
      clearInterval(typer);
      chat.classList.remove('typing');
      steps.forEach((el, k) => setTimeout(() => el.classList.add('shown'), 500 + k * 550));
    }, 55);
  }, { threshold: 0.5 });
  chatObserver.observe(chat);
}
