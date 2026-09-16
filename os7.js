// This file enhances the separately loaded reference application. It is never
// loaded by index.html. Native sensors/systemMaterial are not invoked by a web page.
(() => {
  const body = document.body;
  const optionValues = {
    theme: ['light', 'dark', 'auto'],
    light: ['strong', 'balanced', 'weak', 'off'],
    grip: ['left', 'both', 'right'],
    motion: ['full', 'reduce'],
  };
  const url = new URL(location.href);
  const preferences = { theme: 'light', light: 'balanced', grip: 'both', motion: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'full' };
  for (const key of Object.keys(preferences)) {
    if (optionValues[key].includes(url.searchParams.get(key))) preferences[key] = url.searchParams.get(key);
  }
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointers = new Set();
  const sorts = new WeakMap();
  const originalOrders = new WeakMap();
  let localDraft = '';
  let queuedGrip = null;
  const inkFilter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  inkFilter.setAttribute('width', '0'); inkFilter.setAttribute('height', '0');
  inkFilter.setAttribute('aria-hidden', 'true'); inkFilter.style.position = 'absolute';
  inkFilter.innerHTML = '<defs><filter id="os7-status-ink" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2126 -0.7152 -0.0722 1 0"/></filter></defs>';
  body.append(inkFilter);

  // One continuous nav material; SVG foregrounds avoid raster background seams.
  nav.querySelectorAll('[data-main]').forEach(button => {
    const id = button.dataset.main;
    button.innerHTML = `${navIcon(id)}<span>${names[id]}</span>`;
  });
  const reach = document.createElement('nav');
  reach.className = 'reach-toolbar';
  reach.setAttribute('aria-label', '单手频道操作');
  reach.innerHTML = `<button aria-label="单手上一频道">${svg('chevron')}</button><button aria-label="单手下一频道">${svg('chevron')}</button>`;
  screen.append(reach);
  reach.children[0].addEventListener('click', () => pages.get(state.main)?.setChannel?.(state.channel[state.main] - 1));
  reach.children[1].addEventListener('click', () => pages.get(state.main)?.setChannel?.(state.channel[state.main] + 1));

  function updateReach() {
    const hasChannel = Boolean(channels[state.main]);
    const hideReach = !hasChannel || state.main === 'discover' && state.channel.discover === 3;
    if (reach.hidden !== hideReach) reach.hidden = hideReach;
    reach.children[0].disabled = !hasChannel || state.channel[state.main] === 0;
    reach.children[1].disabled = !hasChannel || state.channel[state.main] === 3;
    const original = new URL('./index.html', location.href);
    original.searchParams.set('page', state.main);
    if (hasChannel) original.searchParams.set('channel', state.channel[state.main]);
    document.querySelector('#referenceLink').href = original.href;
  }
  function applyPreferences() {
    body.dataset.theme = preferences.theme === 'auto' ? systemTheme.matches ? 'dark' : 'light' : preferences.theme;
    body.dataset.light = preferences.light;
    body.dataset.motion = systemMotion.matches ? 'reduce' : preferences.motion;
    if (!pointers.size) body.dataset.grip = preferences.grip;
    else queuedGrip = preferences.grip;
    document.querySelectorAll('[data-setting]').forEach(group => {
      group.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === preferences[group.dataset.setting])));
    });
    document.querySelector('#reduceMotion').checked = body.dataset.motion === 'reduce';
    document.querySelector('#reduceMotion').disabled = systemMotion.matches;
    const current = new URL(location.href);
    for (const [key, value] of Object.entries(preferences)) current.searchParams.set(key, value);
    history.replaceState({}, '', current);
    updateReach();
  }
  document.querySelectorAll('[data-setting]').forEach(group => group.addEventListener('click', event => {
    const button = event.target.closest('[data-value]');
    if (!button) return;
    preferences[group.dataset.setting] = button.dataset.value;
    applyPreferences();
  }));
  document.querySelector('#reduceMotion').addEventListener('change', event => {
    preferences.motion = event.target.checked ? 'reduce' : 'full';
    applyPreferences();
  });
  systemTheme.addEventListener('change', applyPreferences);
  systemMotion.addEventListener('change', applyPreferences);
  window.addEventListener('pointerdown', event => pointers.add(event.pointerId), true);
  function release(event) {
    pointers.delete(event.pointerId);
    if (!pointers.size && queuedGrip) { body.dataset.grip = queuedGrip; queuedGrip = null; }
  }
  window.addEventListener('pointerup', release, true);
  window.addEventListener('pointercancel', release, true);
  window.addEventListener('blur', () => { pointers.clear(); if (queuedGrip) { body.dataset.grip = queuedGrip; queuedGrip = null; } });

  function mountOverlay(html, label) {
    closeLayer();
    modalTrigger = document.activeElement;
    layer = document.createElement('div');
    layer.className = 'os7-overlay';
    layer.innerHTML = `<div class="os7-scrim"></div>${html}`;
    layer.setAttribute('aria-label', label);
    screen.append(layer);
    host.inert = true;
    nav.inert = true;
    layer.querySelector('.os7-scrim').addEventListener('click', closeLayer);
    layer.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeLayer));
    return layer;
  }
  function openSearch() {
    const overlay = mountOverlay(`<section class="os7-sheet" role="dialog" aria-modal="true" aria-label="搜索鸿蒙智行内容"><div class="sheet-handle" aria-hidden="true"></div><header><h2>搜索</h2><button data-close>取消</button></header><label class="os7-search-box">${svg('search')}<input type="search" aria-label="搜索内容" placeholder="搜索车型、用车内容" autocomplete="off"></label><div class="os7-search-results" aria-live="polite"></div></section>`, '搜索');
    const input = overlay.querySelector('input');
    const results = overlay.querySelector('.os7-search-results');
    const candidates = feedData.map((item, index) => ({ image: item[0], title: item[1], index }));
    function renderResults() {
      const query = input.value.trim().toLowerCase();
      const matches = candidates.filter(item => !query || item.title.toLowerCase().includes(query));
      results.innerHTML = `<p>${query ? matches.length ? '搜索结果' : '暂无相关内容' : '推荐内容'}</p>`;
      matches.slice(0, 4).forEach(item => {
        const button = document.createElement('button'); button.className = 'os7-result';
        button.innerHTML = `${img(item.image, '')}<span></span>${svg('chevron')}`;
        button.querySelector('span').textContent = item.title;
        button.addEventListener('click', () => {
          closeLayer(); switchMain('discover'); pages.get('discover').setChannel(0, false);
          const panel = activeScroller();
          const card = [...panel.querySelectorAll('.feed-card')].find(card => card.querySelector('.feed-body>p')?.textContent === item.title);
          if (!card) return;
          card.hidden = false;
          const scale = phone.clientWidth / W;
          const target = panel.scrollTop + (card.getBoundingClientRect().top - panel.getBoundingClientRect().top) / scale - 176;
          panel.scrollTo({ top: target, behavior: body.dataset.motion === 'reduce' ? 'instant' : 'smooth' });
        });
        results.append(button);
      });
    }
    input.addEventListener('input', renderResults);
    renderResults();
    enableSheetDrag(overlay.querySelector('.os7-sheet'));
    input.focus({ preventScroll: true });
  }
  function enableSheetDrag(sheet) {
    const handle = sheet.querySelector('.sheet-handle');
    handle.style.touchAction = 'none';
    let drag;
    handle.addEventListener('pointerdown', event => { if (event.button > 0) return; drag = { id: event.pointerId, y: event.clientY, delta: 0 }; handle.setPointerCapture(event.pointerId); });
    handle.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      drag.delta = Math.max(0, (event.clientY - drag.y) / (phone.clientWidth / W));
      sheet.style.transform = `translateY(${drag.delta}px)`;
    });
    const end = event => {
      if (!drag || drag.id !== event.pointerId) return;
      const distance = drag.delta; drag = null;
      if (event.type !== 'pointercancel' && distance > 72) closeLayer();
      else { sheet.style.transition = 'transform 220ms ease-out'; sheet.style.transform = ''; }
    };
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  }
  function placeMenu(overlay, anchor) {
    const rect = anchor.getBoundingClientRect(), bounds = screen.getBoundingClientRect();
    overlay.querySelector('.os7-menu').style.top = `${Math.min(H - 260, (rect.bottom - bounds.top) / (phone.clientWidth / W) + 6)}px`;
  }
  function componentSheet(title, content) {
    const overlay = mountOverlay(`<section class="os7-sheet" role="dialog" aria-modal="true" aria-label="${title}"><div class="sheet-handle" aria-hidden="true"></div><header><h2>${title}</h2><button data-close aria-label="关闭${title}">完成</button></header>${content}</section>`, title);
    enableSheetDrag(overlay.querySelector('.os7-sheet'));
    overlay.querySelector('[data-close]').focus({ preventScroll: true });
    return overlay;
  }
  function openPublish(anchor) {
    const overlay = mountOverlay(`<div class="os7-menu os7-action-menu" role="menu" aria-label="发布内容"><button role="menuitem" data-compose="图文">${svg('edit')}<span>发布图文</span></button><button role="menuitem" data-compose="视频">${svg('screens')}<span>发布视频</span></button></div>`, '发布内容');
    placeMenu(overlay, anchor);
    overlay.querySelectorAll('[data-compose]').forEach(button => button.addEventListener('click', () => {
      // Keep the original menu trigger for focus restoration, not a removed menu item.
      const sheet = componentSheet(`发布${button.dataset.compose}`, `<p class="os7-component-note">本地交互演示，不会发布到社区或上传媒体。</p><textarea class="os7-draft" aria-label="分享内容" placeholder="记录你与智行的日常…" maxlength="500"></textarea><button class="os7-component-primary" data-save-draft>保存本页草稿</button>`);
      modalTrigger = anchor;
      const input = sheet.querySelector('textarea'); input.value = localDraft;
      input.addEventListener('input', () => { localDraft = input.value; });
      sheet.querySelector('[data-save-draft]').addEventListener('click', () => {
        closeLayer(); showToast('草稿已保留在本页，刷新后清空');
      });
      input.focus({ preventScroll: true });
    }));
    overlay.querySelector('button').focus({ preventScroll: true });
  }
  function openTopAction(button) {
    const label = button.getAttribute('aria-label');
    if (label === '发布') { openPublish(button); return; }
    if (label === '消息') {
      componentSheet('消息', `<p class="os7-component-note">以下为演示消息，未连接真实账号。</p><div class="os7-message-list"><article class="os7-message">${svg('bell')}<div><strong>服务通知</strong><p>欢迎体验鸿蒙智行。你可以在这里查看服务进度与提醒。</p></div></article><article class="os7-message">${svg('people')}<div><strong>互动消息</strong><p>暂时没有新的评论、点赞或关注。</p></div></article></div>`);
    } else if (label === '扫一扫') {
      const overlay = componentSheet('扫一扫', `<div class="os7-code-preview">${svg('scan')}<p>扫码区域预览<br>未调用摄像头，不读取真实二维码</p></div><button class="os7-component-primary" data-scan-demo>模拟识别</button>`);
      overlay.querySelector('[data-scan-demo]').addEventListener('click', () => {
        overlay.querySelector('.os7-code-preview p').textContent = '演示识别完成 · 鸿蒙智行体验中心';
        overlay.querySelector('[data-scan-demo]').textContent = '重新模拟识别';
      });
    } else if (label === '个人二维码') {
      componentSheet('个人二维码', `<div class="os7-code-preview">${svg('qr')}<p>个人名片示意<br>此图标不是可识别二维码</p></div><p class="os7-component-note">仅用于验证弹层样式与交互，未包含账号或身份信息。</p>`);
    }
  }
  function openSort(anchor) {
    const panel = activeScroller();
    const containers = [...panel.querySelectorAll('.feed-column,.posts')];
    if (!originalOrders.has(panel)) originalOrders.set(panel, containers.map(container => ({ container, children: [...container.children] })));
    const value = sorts.get(panel) || 'default';
    const overlay = mountOverlay(`<div class="os7-menu" role="menu" aria-label="内容排序">${[['default', '综合排序'], ['likes', '最多点赞']].map(([id, label]) => `<button role="menuitemradio" aria-checked="${value === id}" data-sort="${id}"><span>${label}</span><span>${value === id ? '✓' : ''}</span></button>`).join('')}</div>`, '内容排序');
    placeMenu(overlay, anchor);
    overlay.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => {
      const selected = button.dataset.sort; sorts.set(panel, selected);
      if (selected === 'default') {
        originalOrders.get(panel).forEach(({ container, children }) => children.forEach(child => container.append(child)));
      } else {
        const cards = [...panel.querySelectorAll('.feed-card,.post')];
        const likes = card => Number(card.querySelector('.like span')?.textContent || (card.querySelector('.like')?.getAttribute('aria-pressed') === 'true' ? 1 : 0));
        cards.sort((a, b) => likes(b) - likes(a));
        if (containers.length) cards.forEach((card, index) => containers[index % containers.length].append(card));
      }
      closeLayer();
    }));
    overlay.querySelector('button').focus({ preventScroll: true });
  }
  function bindEnhancements() {
    screen.querySelectorAll('.main-page,.category-page').forEach(page => {
      if (page.querySelector(':scope > .top-backdrop')) return;
      // A sibling surface can sample scrolling content. A header pseudo-element
      // inside its stacking context cannot reliably sample that backdrop in WebKit/Chromium.
      const backdrop = document.createElement('div'); backdrop.className = 'top-backdrop';
      backdrop.setAttribute('aria-hidden', 'true'); page.append(backdrop);
    });
    screen.querySelectorAll('.channel-tabs').forEach(tabs => {
      if (!tabs.dataset.os7Tabs) {
        tabs.dataset.os7Tabs = 'true';
        setupHorizontal(tabs);
        tabs.addEventListener('scroll', () => { tabs.dataset.more = String(tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 2); }, { passive: true });
      }
      const selected = tabs.querySelector('[aria-selected="true"]');
      if (tabs.os7Selected !== selected) {
        tabs.os7Selected = selected;
        // Wait until font-size transitions finish before measuring the active label.
        clearTimeout(tabs.os7Measure);
        tabs.os7Measure = setTimeout(() => {
          if (!selected || tabs.closest('.main-page').hidden) return;
          const start = selected.offsetLeft, end = start + selected.offsetWidth;
          if (start < tabs.scrollLeft) tabs.scrollTo({ left: Math.max(0, start - 4), behavior: body.dataset.motion === 'reduce' ? 'instant' : 'smooth' });
          else if (end > tabs.scrollLeft + tabs.clientWidth) tabs.scrollTo({ left: end - tabs.clientWidth + 4, behavior: body.dataset.motion === 'reduce' ? 'instant' : 'smooth' });
          tabs.dataset.more = String(tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 2);
        }, body.dataset.motion === 'reduce' ? 0 : 240);
      }
    });
    screen.querySelectorAll('.search-field,.header-tools button[aria-label="搜索"],.category-title button[aria-label="搜索"]').forEach(button => {
      if (button.dataset.os7Search) return; button.dataset.os7Search = 'true';
      button.setAttribute('aria-haspopup', 'dialog');
      if (button.classList.contains('search-field')) {
        const hint = document.createElement('span'); hint.className = 'search-hint'; hint.textContent = '搜索车型、用车内容'; button.append(hint);
      }
      button.addEventListener('click', openSearch);
    });
    screen.querySelectorAll('.header-tools button').forEach(button => {
      if (!['发布', '消息', '扫一扫', '个人二维码'].includes(button.getAttribute('aria-label')) || button.dataset.os7Action) return;
      button.dataset.os7Action = 'true';
      button.setAttribute('aria-haspopup', button.getAttribute('aria-label') === '发布' ? 'menu' : 'dialog');
      button.addEventListener('click', () => openTopAction(button));
    });
    screen.querySelectorAll('.filter-tools button[aria-label="内容排序"]').forEach(button => {
      if (button.dataset.os7Sort) return; button.dataset.os7Sort = 'true';
      button.addEventListener('click', () => openSort(button));
    });
    updateReach();
  }
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return; scheduled = true;
    queueMicrotask(() => { scheduled = false; bindEnhancements(); });
  }).observe(screen, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'aria-selected', 'aria-current'] });
  document.addEventListener('keydown', event => {
    if (!layer || event.key !== 'Tab') return;
    const elements = [...layer.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),a[href]')].filter(element => element.getClientRects().length);
    if (!elements.length) return;
    if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === elements.at(-1)) { event.preventDefault(); elements[0].focus(); }
  }, true);
  applyPreferences(); bindEnhancements();
})();
