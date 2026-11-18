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
  // The metal ring's highlight follows the pointer, like a small dent where the finger is.
  btn.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
    btn.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
  });
  btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--mx'); btn.style.removeProperty('--my'); });
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

/* MCP chat: two looks (Claude, Codex) behind underline tabs. Each plays once in view: type the request, then reveal the steps. */
const chatTabs = document.querySelector('.chat-tabs');
const chatButtons = [...chatTabs.querySelectorAll('[role="tab"]')];
const chats = chatButtons.map((b) => document.getElementById(b.getAttribute('aria-controls')));
let chatTimers = [];
let chatSeen = false;
function playChat(chat) {
  chatTimers.forEach(clearTimeout);
  chatTimers = [];
  const typed = chat.querySelector('.typed');
  const steps = [...chat.querySelectorAll('.step')];
  if (reduceMotion.matches) {
    typed.textContent = typed.dataset.text;
    steps.forEach((el) => el.classList.add('shown'));
    return;
  }
  chat.classList.add('js', 'typing');
  steps.forEach((el) => el.classList.remove('shown'));
  typed.textContent = '';
  const text = typed.dataset.text;
  for (let n = 1; n <= text.length; n++) chatTimers.push(setTimeout(() => { typed.textContent = text.slice(0, n); }, n * 55));
  const done = text.length * 55;
  chatTimers.push(setTimeout(() => chat.classList.remove('typing'), done));
  steps.forEach((el, k) => chatTimers.push(setTimeout(() => el.classList.add('shown'), done + 500 + k * 550)));
}
function showChat(i, focus) {
  selectTab(chatTabs, i);
  chats.forEach((c, j) => { c.hidden = i !== j; });
  if (chatSeen) playChat(chats[i]);
  if (focus) chatButtons[i].focus();
}
chatButtons.forEach((b, i) => {
  b.addEventListener('click', () => showChat(i));
  b.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      showChat((i + (e.key === 'ArrowRight' ? 1 : -1) + chatButtons.length) % chatButtons.length, true);
    }
  });
});
if (reduceMotion.matches) {
  chatSeen = true;
  chats.forEach(playChat);
} else {
  chats.forEach((c) => c.classList.add('js'));
  const chatObserver = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    chatObserver.disconnect();
    chatSeen = true;
    playChat(chats.find((c) => !c.hidden));
  }, { threshold: 0.5 });
  chatObserver.observe(document.querySelector('.chats'));
}

/* Lineage: draw the version tree once when it scrolls in; reduced motion shows the final state */
const lineage = document.querySelector('.lineage');
if (lineage && !reduceMotion.matches) {
  lineage.classList.add('js');
  const lineageObserver = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    lineageObserver.disconnect();
    lineage.classList.add('in');
    // Once the tree is drawn, light keeps flowing along the lines and the newest version breathes.
    // Branch lights start as soon as the badges are up; the trunk light and the v5 ring start as v5 appears,
    // so there is no pause between the drawing and the light.
    const start = (...kinds) => kinds.forEach((k) => lineage.querySelectorAll(`.flow.${k} animate, .flow.${k} animateMotion`).forEach((anim) => anim.beginElement()));
    setTimeout(() => start('dg', 'wt'), 2050);
    setTimeout(() => { lineage.classList.add('flowing'); start('main'); }, 2700);
  }, { threshold: 0.4 });
  lineageObserver.observe(lineage);
}
