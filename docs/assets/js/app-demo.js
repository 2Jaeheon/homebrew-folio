'use strict';

/*
 * SHOWCASE: the app demo's script and timing, all in one place (milliseconds).
 * Each scene is one scroll step on desktop. Its `steps` are things the pointer clicks, in order; a click does
 * exactly what that control does in the app (see `act`). A step can carry its own `hold`.
 *   lead:  pause after a scene starts, before the pointer moves
 *   move:  pointer travel time to the next target
 *   press: pointer down before the click lands
 *   hold:  wait after a click before the next step
 *   loopRest: on phones the scenes play as one loop; the pause before it starts over
 */
const SHOWCASE = {
  lead: 450,
  move: 750,
  press: 160,
  hold: 1100,
  loopRest: 2600,
  scenes: [
    { tab: '내 문서', title: '내 문서', text: '계속 다듬는 이력서와 포트폴리오는 내 문서에 둡니다. 고르면 버전 목록과 문서가 바로 열립니다.',
      steps: [{ at: 'row:resume' }] },
    { tab: '버전', title: '버전', text: '고칠 때마다 v1, v2… 새 버전과 메모가 쌓입니다. 예전 버전도 그대로 열어 볼 수 있습니다.',
      steps: [{ at: 'ver:resume:3' }, { at: 'ver:resume:2' }] },
    { tab: '공고', title: '공고', text: '공고 URL을 붙여 넣으면 본문과 아이콘을 저장합니다. 공고가 내려가도 남아 있습니다.',
      steps: [{ at: 'row:webtoon', hold: 1400 }] },
    { tab: '비교', title: '맞춤 이력서와 비교', text: '내 문서의 한 버전을 공고로 가져와 그 공고에 맞게 고칩니다. 이전 버전과 나란히 놓으면 더한 글은 초록, 지운 글은 빨간색입니다.',
      steps: [{ at: 'ver:tailored:2' }, { at: 'tb:compare', hold: 2200 }] },
    { tab: '보기', title: '나란히, 또는 한 화면', text: '두 버전을 나란히 보거나, 바뀐 곳을 한 화면에 모아 봅니다. 다 봤으면 비교를 끕니다.',
      steps: [{ at: 'tb:inline', hold: 1500 }, { at: 'tb:split', hold: 1200 }, { at: 'tb:compare' }] },
    { tab: '공고별', title: '공고마다 다른 맞춤본', text: '같은 이력서에서 시작해도 공고마다 따로 다듬습니다. 당근에는 당근용, 네이버웹툰에는 웹툰용 버전이 따로 남습니다.',
      steps: [{ at: 'row:daangn', hold: 2000 }, { at: 'row:webtoon', hold: 900 }, { at: 'ver:tailored:2', hold: 2000 }] },
    { tab: '제출', title: '제출 완료', text: '냈으면 제출 완료로 표시합니다. 그 공고의 문서는 더 바뀌지 않게 잠깁니다.',
      steps: [{ at: 'status:submit', hold: 1600 }] },
  ],
};

(() => {
  const frame = document.getElementById('app-demo');
  if (!frame) return;

  /* Data: the demo library. Notes come from assets/docs/<doc>/notes.json; these are the fallback (file://). */
  const DOCS = 'assets/docs/';
  const NOTES = {
    resume: ['첫 정리', '출시 성과 숫자 추가', '모아장 프로젝트와 Kotlin 추가', '소개 문장 다듬고 위젯 성과 추가'],
    portfolio: ['사례 두 개로 첫 구성', '모아장 사례와 숫자 추가', '제목 바꾸고 위젯 지표 추가'],
    tailored: ['이력서 v4에서 서버 경험 중심으로 맞춤', '캐시 수치와 부하 테스트 추가'],
    daangn: ['이력서 v4에서 당근 공고에 맞춤'],
  };
  const DATES = {
    resume: [[10, 2], [10, 19], [11, 3], [11, 12]],
    portfolio: [[10, 5], [10, 28], [11, 10]],
    tailored: [[11, 16], [11, 17]],
    daangn: [[10, 27]],
  };
  const MASTERS = { resume: { title: '이력서', icon: 'person' }, portfolio: { title: '포트폴리오', icon: 'stack' } };
  const APPS = [
    ['webtoon', 'NAVER WEBTOON', 'preparing'], ['naver', 'NAVER', 'preparing'], ['kakao', '카카오', 'preparing'],
    ['line', 'LINE', 'preparing'], ['baemin', '배달의민족', 'submitted'], ['daangn', '당근', 'submitted'], ['toss', '토스', 'submitted'],
  ];
  // Applications a click can open. `doc` is the folder under assets/docs/ holding that application's resume.
  const APPINFO = {
    webtoon: { name: 'NAVER WEBTOON', role: '[2027 상반기 채용연계형 인턴십] 네이버웹툰 백엔드 서버 개발', host: 'recruit.webtoonscorp.com', doc: 'tailored' },
    // No saved posting page for this one, so opening it shows its resume instead of the posting.
    daangn: { name: '당근', role: '백엔드 엔지니어', host: 'about.daangn.com', doc: 'daangn', noPosting: true },
  };
  const STATUS = { preparing: '준비 중', submitted: '제출 완료' };
  const SUBMITTED_ON = '11월 18일';
  const diffCount = { ins: 5, del: 3 };

  const day = ([m, d]) => `${m}월 ${d}일`;
  const stamp = (md) => `${day(md)} 오후 7:00`;
  const fullDay = ([m, d]) => `2026. ${m}. ${d}.`;

  const I = {
    person: '<rect x="1.5" y="3" width="13" height="10" rx="2"/><circle cx="5.5" cy="6.8" r="1.4"/><path d="M3.4 11c.4-1.1 1.2-1.7 2.1-1.7s1.7.6 2.1 1.7M9.6 6.5h3M9.6 9h3"/>',
    stack: '<rect x="2" y="5.5" width="12" height="8" rx="1.6"/><path d="M3.6 3.6h8.8M5.2 1.8h5.6"/>',
    plus: '<path d="M8 3v10M3 8h10"/>',
    trash: '<path d="M2.8 4.4h10.4M6.3 4.4V2.8h3.4v1.6M4.3 4.4l.7 8.8h6l.7-8.8"/>',
    sidebar: '<rect x="1.5" y="2.5" width="13" height="11" rx="2.5"/><path d="M6 2.5v11M3.2 5h1.2M3.2 7h1.2M3.2 9h1.2"/>',
    pencil: '<path d="M10.6 2.6l2.8 2.8-7.6 7.6H3v-2.8z"/>',
    plane: '<path class="solid-ic" d="M14.2 1.8 1.6 7.1l5.1 2.1 2.1 5.1z"/>',
    page: '<path d="M4 1.8h5.4l3 3v9.4H4z"/><path d="M6 7.2h4.4M6 9.6h4.4M6 12h2.8"/>',
    branch: '<path d="M4 2.2v3c0 2.4 4 2.4 4 4.8v3.8M12 2.2v3c0 2.4-4 2.4-4 4.8"/>',
    more: '<path d="M3.5 8h.01M8 8h.01M12.5 8h.01"/>',
    chevron: '<path d="M4 6l4 4 4-4"/>',
    split: '<rect x="1.5" y="2.5" width="13" height="11" rx="2"/><path d="M8 2.5v11"/>',
    pdf: '<path d="M4 1.8h5.4l3 3v9.4H4z"/><path d="M8.2 12.2V7.4M6.3 9.2l1.9-1.9 1.9 1.9"/>',
    open: '<rect x="2" y="2" width="12" height="12" rx="2.6"/><path d="M6.3 9.7l4-4M7 5.6h3.4V9"/>',
  };
  const ic = (name) => `<svg viewBox="0 0 16 16" aria-hidden="true">${I[name]}</svg>`;

  /* Markup */
  const vrow = (doc, n, latest) => `
    <div class="vrow" data-at="ver:${doc}:${n}" data-item="${doc}:${n}">
      <div class="vsum"><span class="vn">v${n}</span>
        <span class="vbody"><span class="note">${NOTES[doc][n - 1] || '메모 없음'}</span><span class="date">${stamp(DATES[doc][n - 1])}</span></span>
        ${latest ? '<span class="latest">최신</span>' : ''}</div>
      <span class="more">${ic('more')}</span>
    </div>`;
  const appRows = (k) => {
    const { doc } = APPINFO[k];
    const n = DATES[doc].length;
    return `
      <div class="dochead">이력서<span>${ic('branch')}이력서 v4에서 시작</span></div>
      <div class="fold"><div><div class="slot">${ic('plus')}새 버전으로 이력서 업데이트</div></div></div>
      ${vrow(doc, n, true)}
      ${n > 1 ? `<div class="older">이전 버전 ${n - 1}개 보기${ic('chevron')}</div>` : ''}
      <div class="fold"><div><p class="sec">포트폴리오</p><div class="slot">${ic('plus')}포트폴리오 추가…</div></div></div>`;
  };
  const lensbox = (rows, cls = '') => `<div class="lensbox ${cls}"><span class="glass"></span><div class="rows">${rows}</div><div class="lcopy"></div></div>`;
  const masterList = (doc) => {
    const n = DATES[doc].length;
    let rows = `<p class="sec">버전 ${n}개</p><div class="slot">${ic('plus')}새 버전으로 ${MASTERS[doc].title} 업데이트</div>`;
    for (let v = n; v >= 1; v--) rows += vrow(doc, v, v === n);
    return lensbox(rows);
  };

  frame.innerHTML = `
  <div class="app" data-kind="none" data-comparing="false" data-mode="split">
    <aside class="sb">
      ${lensbox(`
        <p class="sec">내 문서</p>
        ${Object.entries(MASTERS).map(([k, m]) => `<div class="row" data-at="row:${k}" data-item="${k}">${ic(m.icon)}<span class="t">${m.title}</span><span class="meta">v${DATES[k].length}</span></div>`).join('')}
        <div class="add">${ic('plus')}문서 추가</div>
        <p class="sec gap">공고</p>
        ${APPS.map(([k, name, st]) => `<div class="row"${APPINFO[k] ? ` data-at="row:${k}"` : ''} data-item="${k}"><img src="assets/app/${k}.png" alt=""><span class="t">${name}</span><span class="meta" data-status-of="${k}">${STATUS[st]}</span></div>`).join('')}
        <div class="add">${ic('plus')}공고 추가</div>`)}
      <span class="trash">${ic('trash')}</span>
    </aside>

    <section class="detail">
      <div class="dview empty"><svg viewBox="0 0 16 13" aria-hidden="true"><rect x=".8" y=".8" width="14.4" height="11.4" rx="2.4"/><path d="M5.6.8v11.4M2.6 3.6h1.4M2.6 5.6h1.4M2.6 7.6h1.4"/></svg><p>왼쪽에서 문서나 공고를 골라 주세요</p></div>
      <div class="dview doc backdrop"><div class="paper">
        ${['resume', 'portfolio', 'tailored', 'daangn'].flatMap((d) => DATES[d].map((_, i) => `<iframe data-doc="${d}:${i + 1}" src="${DOCS}${d}/v${i + 1}/index.html" loading="lazy" tabindex="-1" aria-hidden="true" title=""></iframe>`)).join('')}
      </div></div>
      <div class="dview posting"><img src="assets/app/posting.png" alt="" width="838" height="2000" loading="lazy"></div>
      <div class="dview cmp">
        <div class="split">
          <div class="cpane" style="left:0"><div class="phead">이전 버전 · v1 · ${day(DATES.tailored[0])}</div><div class="backdrop"></div><div class="paper"><iframe class="on" src="${DOCS}tailored/v1/index.html" loading="lazy" tabindex="-1" aria-hidden="true" title=""></iframe></div></div>
          <div class="cpane"><div class="phead">선택한 버전 · v2 · ${day(DATES.tailored[1])}</div><div class="backdrop"></div><div class="paper"><iframe class="on" src="${DOCS}tailored/diff.html" loading="lazy" tabindex="-1" aria-hidden="true" title=""></iframe></div></div>
        </div>
        <div class="inline">
          <div class="cpane"><div class="backdrop"></div><div class="paper"><iframe class="on" src="${DOCS}tailored/diff.html" loading="lazy" tabindex="-1" aria-hidden="true" title=""></iframe></div></div>
        </div>
        <div class="bbar"><span>v1 → v2</span><span class="counts"><span><b class="sw i">가</b><em data-count="ins"></em></span><span><b class="sw d">가</b><em data-count="del"></em></span></span></div>
      </div>
      <div class="prep"><span class="orb"></span>바뀐 곳을 찾는 중…</div>
    </section>

    <section class="col">
      <div class="cview master"></div>
      <div class="cview application" data-status="preparing">
        ${lensbox(`
          <div class="ahead">
            <div class="aname"><img src="assets/app/webtoon.png" alt=""><div><b></b><span></span></div></div>
            <div class="track"><div class="steps-in"><span class="disc"></span>
              <div class="stp s0"><span class="ic">${ic('pencil')}</span><b>준비 중</b></div>
              <span class="line"><i></i></span>
              <div class="stp s1"><span class="ic">${ic('plane')}</span><b>제출 완료</b><small>${SUBMITTED_ON}</small></div>
            </div></div>
            <button class="solid" type="button" tabindex="-1" data-at="status:submit"><span>제출 완료로 표시</span></button>
          </div>
          <p class="sec">공고</p>
          <div class="row jd" data-at="app:jd" data-item="jd">${ic('page')}<span class="t">공고 내용</span><span class="host"></span></div>`, 'pinned')}
        ${lensbox('', 'list')}
      </div>
    </section>

    <header class="tb">
      <div class="tb-lead"><span class="tb-toggle">${ic('sidebar')}</span><div class="tb-title"><b></b><span></span></div></div>
      <div class="tb-trail">
        <div class="cap base-cap" hidden><span class="btn-in base">기준: v1${ic('chevron')}</span></div>
        <div class="cap cmp-cap" hidden>
          <div class="picker" hidden><span class="plens"></span><span class="btn-in" data-at="tb:split" data-mode="split">나란히</span><span class="btn-in" data-at="tb:inline" data-mode="inline">한 화면</span></div>
          <span class="btn-in toggle" data-at="tb:compare">${ic('split')}<span class="label"><span style="visibility:hidden">이전 버전과 비교</span></span></span>
        </div>
        <div class="cap pdf-cap" hidden><span class="btn-in">${ic('pdf')}PDF로 저장</span></div>
        <div class="cap web-cap" hidden><span class="btn-in">${ic('open')}브라우저에서 열기</span></div>
      </div>
    </header>

    <span class="pointer"><svg viewBox="0 0 26 26" aria-hidden="true" style="stroke:none"><path d="M5 2.5v18.2l4.4-4.3 2.9 6.6 3-1.3-2.9-6.5h6.2z" fill="#000" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg><i></i></span>
  </div>`;

  const app = frame.querySelector('.app');
  const $ = (sel, root = app) => root.querySelector(sel);
  const $$ = (sel, root = app) => [...root.querySelectorAll(sel)];
  const pointer = $('.pointer');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* State: what the window shows. `act` is every control the demo (or a visitor) can press. */
  const INITIAL = {
    sel: null, ver: { resume: 4, portfolio: 3 }, item: 'jd', comparing: false, mode: 'split',
    status: Object.fromEntries(APPS.map(([k, , s]) => [k, s])),
  };
  const clone = (s) => JSON.parse(JSON.stringify(s));
  let state = clone(INITIAL);

  function act(s, at) {
    const [kind, a, b] = at.split(':');
    if (kind === 'row') { s.sel = a; s.comparing = false; if (APPINFO[a]) s.item = APPINFO[a].noPosting ? DATES[APPINFO[a].doc].length : 'jd'; }
    if (kind === 'ver' && MASTERS[a]) s.ver[a] = +b;
    else if (kind === 'ver') s.item = +b;
    if (kind === 'app' && !APPINFO[s.sel]?.noPosting) s.item = a;
    // Only the NAVER WEBTOON resume has an earlier version to compare with.
    if (at === 'tb:compare' && s.sel === 'webtoon' && s.item === 2) s.comparing = !s.comparing;
    if (at === 'tb:split' || at === 'tb:inline') s.mode = a;
    if (at === 'status:submit' && APPINFO[s.sel]) s.status[s.sel] = s.status[s.sel] === 'preparing' ? 'submitted' : 'preparing';
    return s;
  }
  const startOf = (i) => SHOWCASE.scenes.slice(0, i).flatMap((sc) => sc.steps).reduce((s, st) => act(s, st.at), clone(INITIAL));

  /* Lens: one glass surface per list, plus an accent copy of the rows cut to the same rect. */
  function copyRows(box) {
    const copy = box.querySelector('.lcopy');
    const rows = box.querySelector('.rows').cloneNode(true);
    rows.querySelectorAll('[data-at]').forEach((el) => el.removeAttribute('data-at'));
    copy.replaceChildren(rows);
  }
  function placeLens(box, target, instant) {
    if (!target) { box.classList.remove('on'); return; }
    const rows = box.querySelector('.rows');
    const x = target.offsetLeft + rows.offsetLeft;
    const y = target.offsetTop + rows.offsetTop;
    const w = target.offsetWidth;
    const h = target.offsetHeight;
    const set = () => Object.entries({ x, y, w, h, ct: y, cl: x, cr: box.offsetWidth - x - w, cb: box.offsetHeight - y - h })
      .forEach(([k, v]) => box.style.setProperty('--' + k, v + 'px'));
    if (!box.classList.contains('on') || instant) {
      // A first selection settles in on its row, growing from 0.9 with the glass, instead of sliding in from elsewhere.
      box.classList.remove('on');
      const parts = [box.querySelector('.glass'), box.querySelector('.lcopy')];
      parts.forEach((p) => { p.style.transition = 'none'; });
      set();
      void box.offsetWidth;
      parts.forEach((p) => { p.style.transition = ''; });
      if (instant) parts.forEach((p) => { p.style.transition = 'none'; });
      box.classList.add('on');
      if (instant) { void box.offsetWidth; parts.forEach((p) => { p.style.transition = ''; }); }
    } else {
      set();
    }
  }

  /* RisingLetters: new words rise letter by letter out of a blur; the old ones fade at once. */
  function rise(host, text) {
    const old = host.querySelector('.rise:not(.out)');
    if (old && old.dataset.t === text) return;
    if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 100); }
    const span = document.createElement('span');
    span.className = 'rise';
    span.dataset.t = text;
    [...text].forEach((ch, i) => { const c = document.createElement('i'); c.style.setProperty('--i', i); c.textContent = ch; span.append(c); });
    host.append(span);
  }

  /* Render: apply `state` to the window. `instant` jumps without motion. */
  let shown = { kind: null, doc: null, app: null, comparing: false, dw: null };
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function geometry(layoutComparing) {
    const lead = layoutComparing ? 0 : 282;
    const colShown = state.sel && !layoutComparing;
    const dx = lead + (colShown ? 300 : 0);
    app.dataset.comparing = String(layoutComparing);
    app.style.setProperty('--lead', lead + 'px');
    app.style.setProperty('--cx', lead + 'px');
    app.style.setProperty('--dx', dx + 'px');
    const dw = 1512 - dx;
    // The document resizes once, not on every frame; only its position moves. Shrinking waits for the slide.
    if (shown.dw === null || dw >= shown.dw || app.classList.contains('instant')) app.style.setProperty('--dw', dw + 'px');
    else later(() => app.style.setProperty('--dw', dw + 'px'), 500);
    shown.dw = dw;
  }

  function render(instant = false) {
    timers.forEach(clearTimeout);
    timers = [];
    if (instant || reduce.matches) app.classList.add('instant');
    const s = state;
    const kind = !s.sel ? 'none' : MASTERS[s.sel] ? 'master' : 'app';
    app.dataset.kind = kind;
    app.dataset.mode = s.mode;

    // Sidebar
    APPS.forEach(([k]) => { $(`.rows [data-status-of="${k}"]`).textContent = STATUS[s.status[k]]; });
    const sbBox = $('.sb .lensbox');
    copyRows(sbBox);
    placeLens(sbBox, s.sel && $(`.sb .rows [data-item="${s.sel}"]`), instant);

    // Version column
    if (kind === 'master' && shown.doc !== s.sel) {
      $('.cview.master').innerHTML = masterList(s.sel);
      shown.doc = s.sel;
    }
    const appView = $('.cview.application');
    const info = APPINFO[s.sel];
    if (info && shown.app !== s.sel) {
      $('.aname img', appView).src = `assets/app/${s.sel}.png`;
      $('.aname b', appView).textContent = info.name;
      $('.aname span', appView).textContent = info.role;
      $('.host', appView).textContent = info.host;
      $('.list .rows', appView).innerHTML = appRows(s.sel);
      shown.app = s.sel;
    }
    if (info) {
      appView.dataset.status = s.status[s.sel];
      $('.solid span').textContent = s.status[s.sel] === 'preparing' ? '제출 완료로 표시' : '준비 중으로 되돌리기';
    }
    let docKey = null;
    if (kind === 'master') {
      const box = $('.cview.master .lensbox');
      copyRows(box);
      placeLens(box, $(`.rows [data-item="${s.sel}:${s.ver[s.sel]}"]`, box), instant || shown.kind !== 'master');
      docKey = `${s.sel}:${s.ver[s.sel]}`;
    }
    if (kind === 'app') {
      const [pinned, list] = $$('.lensbox', appView);
      [pinned, list].forEach(copyRows);
      const fresh = instant || shown.kind !== 'app' || shown.lensApp !== s.sel;
      shown.lensApp = s.sel;
      // A lens covers only its own rows: moving between the pinned and the scrolling rows makes it appear anew.
      placeLens(pinned, s.item === 'jd' ? $('.rows [data-item="jd"]', pinned) : null, fresh);
      const pick = () => placeLens(list, s.item === 'jd' ? null : $(`.rows [data-item="${info.doc}:${s.item}"]`, list), fresh);
      pick();
      later(pick, 300); // the add slots fold away when submitted, and the row moves up
      if (s.item !== 'jd') docKey = `${info.doc}:${s.item}`;
    }
    $$('.paper iframe[data-doc]').forEach((f) => f.classList.toggle('on', f.dataset.doc === docKey));

    // Detail views
    const view = kind === 'none' ? 'empty' : docKey ? 'doc' : 'posting';
    ['empty', 'doc', 'posting'].forEach((v) => $('.dview.' + v).classList.toggle('on', v === view));
    $('.dview.cmp').classList.toggle('on', s.comparing);

    // Toolbar
    const title = kind === 'master' ? MASTERS[s.sel].title : kind === 'app' ? info.name : 'Folio';
    const sub = kind === 'master' ? `v${s.ver[s.sel]} · ${fullDay(DATES[s.sel][s.ver[s.sel] - 1])}` : kind === 'app' ? info.role : '';
    $('.tb-title b').textContent = title;
    $('.tb-title span').textContent = sub;
    $('.base-cap').hidden = !s.comparing;
    $('.picker').hidden = !s.comparing;
    $('.cmp-cap').hidden = view !== 'doc' || (kind === 'app' && DATES[info.doc].length < 2);
    $('.pdf-cap').hidden = view !== 'doc';
    $('.web-cap').hidden = view !== 'posting';
    const toggle = $('.toggle');
    toggle.classList.toggle('on', s.comparing);
    rise($('.label', toggle), s.comparing ? '비교 끄기' : '이전 버전과 비교');
    if (s.comparing) {
      const on = $(`.picker [data-mode="${s.mode}"]`);
      $$('.picker .btn-in').forEach((b) => b.classList.toggle('on', b === on));
      $('.picker').style.setProperty('--px', on.offsetLeft + 'px');
      $('.picker').style.setProperty('--pw', on.offsetWidth + 'px');
    }

    // Comparing: the toolbar changes now; the orb covers the page, then the panels slide away and it lifts.
    const prep = $('.prep');
    if (s.comparing && !shown.comparing && !instant && !reduce.matches) {
      prep.classList.add('on');
      geometry(false);
      later(() => geometry(true), 450);
      later(() => prep.classList.remove('on'), 450 + 340);
    } else {
      prep.classList.remove('on');
      geometry(s.comparing);
    }

    shown.kind = kind;
    shown.comparing = s.comparing;
    if (app.classList.contains('instant')) { void app.offsetWidth; app.classList.remove('instant'); }
  }

  /* Scale: the window is 1512x949 points, drawn at the frame's width. Each page fits its pane's width. */
  new ResizeObserver(() => app.style.setProperty('--k', frame.clientWidth / 1512)).observe(frame);
  const paperRO = new ResizeObserver((entries) => entries.forEach(({ target: p }) => {
    const s = p.clientWidth / 900;
    p.style.setProperty('--s', s);
    p.style.setProperty('--fh', p.clientHeight / s + 'px');
  }));
  $$('.paper').forEach((p) => paperRO.observe(p));

  /* Pointer */
  function pointAt(el) {
    const a = app.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const k = a.width / 1512;
    return { x: (r.left - a.left) / k + Math.min(r.width / k / 2, 70), y: (r.top - a.top + r.height / 2) / k };
  }
  async function click(at, token) {
    const el = $(`.rows [data-at="${at}"], .tb [data-at="${at}"]`);
    if (!el) return;
    const p = pointAt(el);
    pointer.style.setProperty('--move', SHOWCASE.move + 'ms');
    pointer.style.setProperty('--mx', p.x + 'px');
    pointer.style.setProperty('--my', p.y + 'px');
    pointer.classList.add('on');
    await wait(SHOWCASE.move);
    if (token !== playing) return;
    pointer.classList.add('down');
    await wait(SHOWCASE.press);
    if (token !== playing) return;
    state = act(state, at);
    render();
    setTimeout(() => pointer.classList.remove('down'), 300);
  }

  /* Player */
  let playing = 0;
  let scene = -1;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  async function playScene(i) {
    const token = ++playing;
    scene = i;
    setCaption(i);
    app.removeAttribute('data-live');
    if (reduce.matches) {
      state = startOf(i + 1);
      render(true);
      app.setAttribute('data-live', '');
      return;
    }
    const start = startOf(i);
    if (!same(state, start)) { state = start; render(true); }
    await wait(SHOWCASE.lead);
    for (const step of SHOWCASE.scenes[i].steps) {
      if (token !== playing) return;
      await click(step.at, token);
      await wait(step.hold ?? SHOWCASE.hold);
    }
    if (token === playing) app.setAttribute('data-live', '');
  }

  // Visitors can press the same controls once a scene has played.
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-at]');
    if (!el || !app.hasAttribute('data-live') || el.closest('.lcopy')) return;
    pointer.classList.remove('on');
    state = act(state, el.dataset.at);
    render();
  });

  /* Captions and scene tabs */
  const showcase = frame.closest('.showcase');
  const caption = showcase.querySelector('.caption');
  const tabs = showcase.querySelector('.scene-tabs');
  SHOWCASE.scenes.forEach((sc) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', 'false');
    b.textContent = sc.tab;
    tabs.append(b);
  });
  const tabButtons = [...tabs.querySelectorAll('[role="tab"]')];
  function setCaption(i) {
    if (typeof selectTab === 'function') selectTab(tabs, i);
    const sc = SHOWCASE.scenes[i];
    caption.classList.add('swap');
    setTimeout(() => {
      caption.innerHTML = `<strong>${sc.title}.</strong> ${sc.text}`;
      caption.classList.remove('swap');
    }, 160);
  }

  const sticky = matchMedia('(min-width: 761px)');
  const progressScene = () => {
    const rect = showcase.getBoundingClientRect();
    const total = showcase.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -rect.top / total));
    return Math.min(SHOWCASE.scenes.length - 1, Math.floor(p * SHOWCASE.scenes.length));
  };

  // Desktop: the window sticks and each scroll step plays one scene.
  // Scroll events already arrive once per frame, and this only reads two rects.
  function onScroll() {
    if (!sticky.matches) return;
    // Above the showcase: back to the empty window, so scene one plays again on the way down.
    if (showcase.getBoundingClientRect().top > innerHeight * 0.3) {
      if (scene !== -1) { playing++; scene = -1; state = clone(INITIAL); render(true); pointer.classList.remove('on'); }
      return;
    }
    const i = progressScene();
    if (i !== scene) playScene(i);
  }

  // Phones: no sticky scroll; the scenes play in a loop while the window is on screen.
  let visible = false;
  let loopStarts = 0;

  async function runLoop(from) {
    const mine = ++loopStarts;
    for (let i = from, first = true; ; i = (i + 1) % SHOWCASE.scenes.length, first = false) {
      if (!first && i === 0) await wait(SHOWCASE.loopRest);
      if (mine !== loopStarts || !visible || sticky.matches) return;
      await playScene(i);
      if (mine !== loopStarts || reduce.matches) return;
    }
  }

  tabButtons.forEach((b, i) => b.addEventListener('click', () => {
    if (sticky.matches) {
      const total = showcase.offsetHeight - innerHeight;
      scrollTo({ top: showcase.offsetTop + total * (i + 0.5) / SHOWCASE.scenes.length, behavior: reduce.matches ? 'auto' : 'smooth' });
    } else {
      runLoop(i);
    }
  }));

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (sticky.matches) return;
    if (visible) runLoop(Math.max(0, scene === SHOWCASE.scenes.length - 1 ? 0 : scene));
    else { loopStarts++; playing++; }
  }, { threshold: 0.35 }).observe(frame);

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  sticky.addEventListener('change', () => { scene = -1; loopStarts++; playing++; if (sticky.matches) onScroll(); else if (visible) runLoop(0); });

  /* First paint, then real notes and diff counts when served over HTTP. */
  function counts() { $$('[data-count]').forEach((el) => { el.textContent = `${el.dataset.count === 'ins' ? '추가' : '삭제'} ${diffCount[el.dataset.count]}곳`; }); }
  counts();
  render(true);
  setCaption(0);
  onScroll();

  Promise.all(Object.keys(NOTES).map((d) => fetch(`${DOCS}${d}/notes.json`).then((r) => (r.ok ? r.json() : Promise.reject())).then((n) => { NOTES[d] = n; })))
    .then(() => {
      shown.doc = null;
      shown.app = null;
      render(true);
    })
    .catch(() => {});
  fetch(`${DOCS}tailored/diff.html`).then((r) => (r.ok ? r.text() : Promise.reject())).then((html) => {
    diffCount.ins = (html.match(/<ins\b/g) || []).length;
    diffCount.del = (html.match(/<del\b/g) || []).length;
    counts();
  }).catch(() => {});
})();
