const screen = document.querySelector("#screen");
const phone = document.querySelector("#phone");
const toast = document.querySelector("#toast");
const pageTitle = document.querySelector("#pageTitle");
const pageStep = document.querySelector("#pageStep");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");

const mainTabs = [
  { id: "discover", label: "发现", icon: "discover" },
  { id: "select", label: "精选", icon: "bag" },
  { id: "car", label: "爱车", icon: "car" },
  { id: "service", label: "服务", icon: "heart" },
  { id: "mine", label: "我的", icon: "person" },
];

const channelDefinitions = {
  discover: {
    tabs: ["推荐", "动态", "广场", "尊界典藏"],
    panels: [renderRecommend, renderMoments, renderPlaza, renderCollection],
    actions: ["plus", "bell"],
  },
  select: {
    tabs: ["推荐", "金秋焕新", "G9专属", "新车必备"],
    panels: [renderSelectHome, renderAutumn, renderG9, renderEssentials],
    actions: ["menu", "search"],
  },
};

const state = {
  activeMain: "discover",
  channelIndex: { discover: 0, select: 0 },
  carReady: false,
  sheetOpen: false,
};

let pageHost;
let bottomNav;
let toastTimer;
let transitionToken = 0;
const pageCache = new Map();
let suppressClickUntil = 0;

function icon(name) {
  const paths = {
    discover: '<circle cx="12" cy="12" r="8"/><path d="m14.8 9.2-1.7 3.9-3.9 1.7 1.7-3.9 3.9-1.7Z"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    car: '<path d="m4 14 1.7-5h12.6l1.7 5v5h-2v-2H6v2H4v-5Z"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
    heart: '<path d="M20.7 5.7a5 5 0 0 0-7.1 0L12 7.3l-1.6-1.6a5 5 0 0 0-7.1 7.1L12 21l8.7-8.2a5 5 0 0 0 0-7.1Z"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4.8 21a7.2 7.2 0 0 1 14.4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
    scan: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    arrow: '<path d="m6 9 6 6 6-6"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.discover}</svg>`;
}

function statusBar() {
  return `<div class="status-bar"><span class="status-time">12:11</span><span class="status-icons">N&nbsp;⌁&nbsp;◔&nbsp;4G&nbsp;▮▮▮<i></i></span></div>`;
}

function renderBottomNav() {
  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "一级导航");
  nav.innerHTML = mainTabs.map((tab) => `
    <button type="button" data-main="${tab.id}" aria-label="切换到${tab.label}">
      ${icon(tab.icon)}<span>${tab.label}</span>
    </button>
  `).join("");
  nav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-main]");
    if (button) switchMain(button.dataset.main);
  });
  return nav;
}

function updateBottomNav() {
  bottomNav.querySelectorAll("button").forEach((button) => {
    const active = button.dataset.main === state.activeMain;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function renderChannelPage(id) {
  const definition = channelDefinitions[id];
  const currentIndex = state.channelIndex[id];
  const page = document.createElement("section");
  page.className = `main-page channel-page ${id}-page`;
  page.dataset.page = id;
  page.style.setProperty("--tab-count", definition.tabs.length);
  page.style.setProperty("--tab-position", currentIndex);
  page.innerHTML = `
    <header class="channel-header">
      ${statusBar()}
      <div class="channel-nav">
        <div class="channel-tabs" role="tablist">
          ${definition.tabs.map((tab, index) => `<button class="channel-tab${index === currentIndex ? " is-active" : ""}" type="button" role="tab" aria-selected="${index === currentIndex}" data-channel="${index}">${tab}</button>`).join("")}
          <div class="channel-indicator"></div>
        </div>
        <div class="header-actions">
          ${definition.actions.map((action) => `<button class="icon-button" type="button" data-action="${action}" aria-label="${action === "search" ? "搜索" : action === "bell" ? "消息" : "更多操作"}">${icon(action)}</button>`).join("")}
        </div>
      </div>
    </header>
    <div class="tab-viewport">
      <div class="tab-track">
        ${definition.panels.map((panel, index) => `<section class="tab-panel" role="tabpanel" data-panel="${index}">${panel()}${loaderMarkup()}</section>`).join("")}
      </div>
    </div>
    <button class="scroll-top" type="button" aria-label="回到顶部">↑</button>
  `;
  setupChannelInteractions(page, id, definition.tabs.length);
  if (id === "discover") {
    const grid = page.querySelector('[data-panel="0"] .feed-grid');
    const originals = [...grid.children];
    for (let section = 0; section < 2; section++) originals.forEach(card => grid.append(card.cloneNode(true)));
  }
  return page;
}

function loaderMarkup() {
  return `<div class="panel-loader" aria-hidden="true"><span class="loading-ring"></span><span>正在加载…</span></div>`;
}

function setupChannelInteractions(page, id, count) {
  const viewport = page.querySelector(".tab-viewport");
  const track = page.querySelector(".tab-track");
  const header = page.querySelector(".channel-header");
  const scrollTopButton = page.querySelector(".scroll-top");
  let gesture = null;
  const loaded = new Set([state.channelIndex[id]]);

  const syncTrack = (animate = true) => {
    const index = state.channelIndex[id];
    track.classList.toggle("is-dragging", !animate);
    track.style.transform = `translate3d(${-index * viewport.clientWidth}px, 0, 0)`;
    page.style.setProperty("--tab-position", index);
  };

  const showLoader = (index) => {
    if (loaded.has(index)) return;
    loaded.add(index);
    const loader = page.querySelector(`[data-panel="${index}"] .panel-loader`);
    loader.classList.add("is-visible");
    window.setTimeout(() => loader.classList.remove("is-visible"), 460);
  };

  const setIndex = (next, { loading = true } = {}) => {
    const bounded = Math.max(0, Math.min(count - 1, next));
    const changed = bounded !== state.channelIndex[id];
    state.channelIndex[id] = bounded;
    const activePanel = page.querySelector(`[data-panel="${bounded}"]`);
    header.classList.toggle("is-scrolled", activePanel.scrollTop > 8);
    scrollTopButton.classList.toggle("is-visible", activePanel.scrollTop > 280);
    track.classList.remove("is-dragging");
    syncTrack(true);
    page.querySelectorAll(".channel-tab").forEach((tab, index) => {
      const active = index === bounded;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    page.querySelectorAll(".tab-panel").forEach((panel, index) => { panel.inert = index !== bounded; });
    if (changed && loading) showLoader(bounded);
    updateGuide();
    updateAddress();
  };

  page._setChannelIndex = setIndex;
  page.querySelector(".channel-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-channel]");
    if (button) setIndex(Number(button.dataset.channel));
  });
  page.querySelector(".header-actions").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (button) showToast(button.dataset.action === "search" ? "搜索面板已打开" : "操作入口已响应");
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest(".product-rail, .chip-row, .control-rail")) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now(), axis: null, dx: 0 };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.axis && Math.hypot(dx, dy) > 8) gesture.axis = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    if (gesture.axis !== "horizontal") return;
    event.preventDefault();
    viewport.setPointerCapture?.(event.pointerId);
    gesture.dx = dx;
    suppressClickUntil = performance.now() + 400;
    const index = state.channelIndex[id];
    const atEdge = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
    const adjusted = atEdge ? dx * .22 : dx;
    track.classList.add("is-dragging");
    page.classList.add("is-swiping");
    track.style.transform = `translate3d(${(-index * viewport.clientWidth) + adjusted}px, 0, 0)`;
    const floatingIndex = Math.max(0, Math.min(count - 1, index - adjusted / viewport.clientWidth));
    page.style.setProperty("--tab-position", floatingIndex);
  });

  const endGesture = (event, cancelled = false) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const finished = gesture;
    gesture = null;
    page.classList.remove("is-swiping");
    if (finished.axis !== "horizontal") return;
    const velocity = finished.dx / Math.max(1, performance.now() - finished.at);
    const shouldMove = !cancelled && (Math.abs(finished.dx) > viewport.clientWidth * .18 || Math.abs(velocity) > .45);
    const direction = finished.dx < 0 ? 1 : -1;
    setIndex(state.channelIndex[id] + (shouldMove ? direction : 0));
  };
  viewport.addEventListener("pointerup", (event) => endGesture(event));
  viewport.addEventListener("pointercancel", (event) => endGesture(event, true));

  page.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.addEventListener("scroll", () => {
      if (Number(panel.dataset.panel) !== state.channelIndex[id]) return;
      header.classList.toggle("is-scrolled", panel.scrollTop > 8);
      scrollTopButton.classList.toggle("is-visible", panel.scrollTop > 280);
      const hero = panel.querySelector(".hero-card img");
      if (hero) hero.style.transform = `translateY(${Math.min(18, panel.scrollTop * .06)}px) scale(1.04)`;
    }, { passive: true });
  });
  scrollTopButton.addEventListener("click", () => {
    page.querySelector(`[data-panel="${state.channelIndex[id]}"]`).scrollTo({ top: 0, behavior: "smooth" });
  });
  new ResizeObserver(() => syncTrack(false)).observe(viewport);
  requestAnimationFrame(() => syncTrack(false));
  page.querySelectorAll(".tab-panel").forEach((panel, index) => { panel.inert = index !== state.channelIndex[id]; setupMouseScroll(panel); });
}

// Native touch scrolling is retained; desktop dragging gets release momentum.
function setupMouseScroll(scroller) {
  let drag;
  let momentum;
  scroller.addEventListener("pointerdown", event => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    cancelAnimationFrame(momentum);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, last: event.clientY, time: performance.now(), velocity: 0, axis: null };
  });
  scroller.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.axis && Math.hypot(dx, dy) > 8) drag.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
    if (drag.axis !== "y") return;
    event.preventDefault();
    scroller.setPointerCapture(event.pointerId);
    const now = performance.now();
    drag.velocity = (drag.last - event.clientY) / Math.max(8, now - drag.time);
    scroller.scrollTop += drag.last - event.clientY;
    drag.last = event.clientY; drag.time = now;
    suppressClickUntil = now + 400;
  });
  const finish = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const last = drag; drag = null;
    if (last.axis !== "y" || event.type === "pointercancel") return;
    let speed = performance.now() - last.time < 90 ? Math.max(-2.8, Math.min(2.8, last.velocity)) : 0;
    let previous = performance.now();
    const tick = now => {
      const dt = Math.min(32, now - previous); previous = now;
      const before = scroller.scrollTop;
      scroller.scrollTop += speed * dt;
      speed *= Math.exp(-dt / 210);
      if (Math.abs(speed) > .025 && scroller.scrollTop !== before) momentum = requestAnimationFrame(tick);
    };
    momentum = requestAnimationFrame(tick);
  };
  scroller.addEventListener("pointerup", finish);
  scroller.addEventListener("pointercancel", finish);
  scroller.addEventListener("wheel", () => cancelAnimationFrame(momentum), { passive: true });
}

function renderPlainPage(id) {
  const page = document.createElement("section");
  page.className = `main-page plain-page ${id}-page${id === "car" && state.carReady ? " car-ready" : ""}`;
  page.dataset.page = id;
  const labels = { car: "问界M8纯电Max+", service: "服务", mine: "我的" };
  const content = id === "car" ? renderCar() : id === "service" ? renderService() : renderMine();
  page.innerHTML = `
    <header class="plain-header">
      ${statusBar()}
      <div class="plain-titlebar">
        <h2 class="${id === "car" ? "vehicle-title" : ""}">${labels[id]}${id === "car" ? "⌄" : ""}</h2>
        <div class="header-actions"><button class="icon-button" type="button" aria-label="扫码">${icon("scan")}</button><button class="icon-button" type="button" aria-label="消息">${icon("bell")}</button></div>
      </div>
    </header>
    <div class="plain-scroll"><div class="plain-content">${content}</div></div>
    <button class="scroll-top" type="button" aria-label="回到顶部">↑</button>
  `;
  setupPlainInteractions(page, id);
  return page;
}

function setupPlainInteractions(page, id) {
  const scroller = page.querySelector(".plain-scroll");
  setupMouseScroll(scroller);
  const header = page.querySelector(".plain-header");
  const scrollTopButton = page.querySelector(".scroll-top");
  scroller.addEventListener("scroll", () => {
    const y = scroller.scrollTop;
    header.classList.toggle("is-scrolled", y > 8);
    scrollTopButton.classList.toggle("is-visible", y > 280);
    if (id === "car") {
      page.style.setProperty("--car-shift", `${Math.min(34, y * .12)}px`);
      page.style.setProperty("--car-scale", Math.max(.87, 1 - y * .00035));
      page.style.setProperty("--caption-opacity", Math.max(0, 1 - y / 260));
    }
  }, { passive: true });
  scrollTopButton.addEventListener("click", () => scroller.scrollTo({ top: 0, behavior: "smooth" }));
  page.querySelector(".header-actions").addEventListener("click", () => showToast("工具入口已响应"));
  page.addEventListener("click", (event) => {
    const control = event.target.closest(".control-button");
    if (control) {
      control.classList.toggle("is-active");
      showToast(`${control.dataset.label}${control.classList.contains("is-active") ? "已开启" : "已关闭"}`);
      return;
    }
  });
}

function switchMain(id, animate = true) {
  if (!mainTabs.some((tab) => tab.id === id)) id = "discover";
  if (id === state.activeMain && pageHost.firstElementChild) {
    const current = pageCache.get(id);
    const scroller = current?.querySelector(`.tab-panel[data-panel="${state.channelIndex[id] || 0}"], .plain-scroll`);
    scroller?.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const oldPage = pageCache.get(state.activeMain) || pageHost.firstElementChild;
  const oldIndex = Math.max(0, mainTabs.findIndex((tab) => tab.id === state.activeMain));
  const newIndex = mainTabs.findIndex((tab) => tab.id === id);
  state.activeMain = id;
  const newPage = pageCache.get(id) || (channelDefinitions[id] ? renderChannelPage(id) : renderPlainPage(id));
  pageCache.set(id, newPage);
  for (const page of pageHost.children) { page.getAnimations().forEach(animation => animation.cancel()); page.hidden = true; }
  if (!newPage.isConnected) pageHost.append(newPage);
  newPage.hidden = false;
  newPage.inert = false;
  if (animate && oldPage) {
    const direction = newIndex >= oldIndex ? 1 : -1;
    const token = ++transitionToken;
    newPage.animate([
      { transform: `translateX(${direction * 12}%)`, opacity: .5 },
      { transform: "translateX(0)", opacity: 1 },
    ], { duration: 300, easing: "cubic-bezier(.2,.75,.18,1)", fill: "both" });
  }
  updateClock();
  updateBottomNav();
  updateGuide();
  updateAddress();
  if (id === "car" && !state.carReady) window.setTimeout(showDownloadSheet, 520);
  else closeDownloadSheet();
}

function updateGuide() {
  const main = mainTabs.find((tab) => tab.id === state.activeMain);
  const definition = channelDefinitions[state.activeMain];
  if (definition) {
    const index = state.channelIndex[state.activeMain];
    pageTitle.textContent = `${main.label} · ${definition.tabs[index]}`;
    pageStep.textContent = `频道 ${index + 1} / ${definition.tabs.length}`;
    previousButton.disabled = index === 0;
    nextButton.disabled = index === definition.tabs.length - 1;
  } else {
    pageTitle.textContent = main.label;
    pageStep.textContent = "上下滚动页面";
    previousButton.disabled = true;
    nextButton.disabled = true;
  }
}

function updateAddress() {
  const url = new URL(location.href);
  url.searchParams.set("page", state.activeMain);
  url.searchParams.delete("step");
  if (channelDefinitions[state.activeMain]) url.searchParams.set("channel", state.channelIndex[state.activeMain]);
  else url.searchParams.delete("channel");
  history.replaceState({}, "", url);
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1700);
}

function showDownloadSheet() {
  closeDownloadSheet();
  if (state.activeMain !== "car" || state.carReady) return;
  state.sheetOpen = true;
  const layer = document.createElement("div");
  layer.className = "download-layer";
  layer.innerHTML = `<div class="sheet-scrim"></div><section class="download-sheet" role="dialog" aria-label="下载车辆资源包"><strong>请下载车辆资源包</strong><p>完成后展示车辆模型与完整控制组件</p><div class="sheet-actions"><button class="ghost-button" type="button">下次再说</button><button class="solid-button" type="button">现在下载</button></div><div class="download-progress"><i></i></div></section>`;
  screen.append(layer);
  requestAnimationFrame(() => layer.classList.add("is-visible"));
  layer.querySelector(".sheet-scrim").addEventListener("click", closeDownloadSheet);
  layer.querySelector(".ghost-button").addEventListener("click", closeDownloadSheet);
  layer.querySelector(".solid-button").addEventListener("click", () => {
    const sheet = layer.querySelector(".download-sheet");
    sheet.classList.add("is-downloading");
    sheet.querySelector("strong").textContent = "正在下载车辆资源包…";
    window.setTimeout(() => {
      state.carReady = true;
      pageHost.querySelector(".car-page")?.classList.add("car-ready");
      closeDownloadSheet();
      showToast("车辆资源加载完成");
    }, 1050);
  });
}

function closeDownloadSheet() {
  state.sheetOpen = false;
  const layer = screen.querySelector(".download-layer");
  if (!layer) return;
  layer.classList.remove("is-visible");
  window.setTimeout(() => layer.remove(), 360);
}

function renderRecommend() {
  return `<div class="panel-inner"><div class="search-field">⌕&nbsp; 搜索鸿蒙智行内容</div><div class="hero-card"><img src="./assets/components/discover-hero.jpg" alt="鸿蒙智行活动"><div class="hero-dots"><i></i><i></i><i></i><i></i></div></div>${quickActions()}<div class="chip-row"><button class="chip is-active">全部</button><button class="chip">G9</button><button class="chip">RX</button><button class="chip">M6</button><button class="chip">V8</button><button class="chip">S800</button></div>${feedGrid()}</div>`;
}

function quickActions() {
  return `<div class="quick-row"><button class="quick-action"><b class="quick-visual" style="--quick-color:#f3eadf">🚙</b><span>立即定购</span></button><button class="quick-action"><b class="quick-visual" style="--quick-color:#e7e5f5">▣</b><span>官方公告</span></button><button class="quick-action"><b class="quick-visual" style="--quick-color:#f7e2dc">♨</b><span>热门活动</span></button><button class="quick-action"><b class="quick-visual" style="--quick-color:#e1f0f6">◉</b><span>智能助手</span></button></div>`;
}

function feedGrid() {
  return `<div class="feed-grid"><article class="feed-card"><div class="feed-cover" data-mark="问界 M8" style="--card-bg:linear-gradient(145deg,#6a554b,#bea886)"></div><div class="feed-body"><p class="feed-title">新车登场，分享体验赢积分</p><div class="feed-meta"><span>鸿蒙智行</span><span>♡ 218</span></div></div></article><article class="feed-card"><div class="feed-cover" data-mark="充电指南" style="--card-bg:linear-gradient(145deg,#758ba9,#c0d1e4)"></div><div class="feed-body"><p class="feed-title">出门在外，补能体验全攻略</p><div class="feed-meta"><span>车主分享</span><span>♡ 96</span></div></div></article><article class="feed-card"><div class="feed-cover" data-mark="秋日出行" style="--card-bg:linear-gradient(145deg,#8c6d4d,#efc278)"></div><div class="feed-body"><p class="feed-title">周末适合开车去哪里？</p><div class="feed-meta"><span>发现</span><span>♡ 73</span></div></div></article><article class="feed-card"><div class="feed-cover" data-mark="OTA" style="--card-bg:linear-gradient(145deg,#453b77,#b3a7d8)"></div><div class="feed-body"><p class="feed-title">本月功能更新清单</p><div class="feed-meta"><span>升级尝鲜</span><span>♡ 166</span></div></div></article></div>`;
}

function renderMoments() {
  return `<div class="panel-inner"><div class="chip-row"><button class="chip is-active">最新</button><button class="chip">G9</button><button class="chip">RX</button><button class="chip">M6</button><button class="chip">V8</button></div>${postCard("Vivi", "偶然在路上遇见温柔落日，停下脚步，给车与旅途都留一点时间。")}${postCard("雾中鹏影", "周末短途体验，座舱安静、路线从容，分享给正在选车的朋友。")}${postCard("官方资讯", "新版本体验开放，欢迎车主在评论区分享真实感受。")}</div>`;
}

function postCard(name, copy) {
  return `<article class="post-card"><div class="post-author"><i class="avatar"></i><span>${name}</span></div><p>${copy}</p><div class="post-gallery"><i></i><i></i><i></i></div><div class="post-actions"><span>◉ 浏览</span><span>♡ 点赞</span><span>◇ 评论</span></div></article>`;
}

function renderPlaza() {
  return `<div class="panel-inner"><div class="search-field">⌕&nbsp; 搜索广场话题</div><div class="feature-banner"><strong>发现车主的精彩生活</strong><span>参与话题，记录每一次出发</span></div><div class="section-title">推荐话题 <small>更多 ›</small></div><div class="settings-list"><div class="settings-item"># 金秋出行游记 <i>2.2w 次参与</i></div><div class="settings-item"># 小艺真香时刻 <i>1.0w 次参与</i></div><div class="settings-item"># 爱车随手拍 <i>3.7w 次参与</i></div><div class="settings-item"># 华为家充桩 <i>586 次参与</i></div></div><div class="section-title">视频图集 <small>更多 ›</small></div>${feedGrid()}</div>`;
}

function renderCollection() {
  return `<div class="panel-inner" style="background:#151515;color:#fff"><div class="hero-card" style="height:255px;background:linear-gradient(155deg,#171410,#78634f)"><div class="hero-copy" style="top:34px"><strong>尊界典藏大观</strong><span>以时间沉淀设计，以体验连接生活</span></div></div><div class="section-title">典藏故事 <small style="color:#aaa">更多 ›</small></div><article class="post-card" style="background:#262626;color:#fff"><p style="color:#ddd">见证不凡之旅：从材质、工艺到每一个座舱细节。</p><div class="post-gallery"><i></i><i></i><i></i></div></article><article class="post-card" style="background:#262626;color:#fff"><p style="color:#ddd">车主专享活动与私享服务持续更新。</p></article></div>`;
}

function renderSelectHome() {
  return `<div class="panel-inner"><div class="hero-card" style="height:245px"><img src="./assets/components/select-hero.jpg" alt="精选新品"></div><div class="section-title">专属好物 <small>更多 ›</small></div>${productRail()}<div class="section-title">新品推荐 <small>更多 ›</small></div>${feedGrid()}</div>`;
}

function productRail() {
  return `<div class="product-rail"><div class="product-mini"><strong>M7</strong><span>专属好物</span></div><div class="product-mini" style="--product-bg:#dcebe5"><strong>M8</strong><span>专属好物</span></div><div class="product-mini" style="--product-bg:#dddff0"><strong>M9</strong><span>专属好物</span></div><div class="product-mini" style="--product-bg:#eee5dd"><strong>G9</strong><span>专属好物</span></div></div>`;
}

function renderAutumn() { return `<div class="panel-inner"><div class="feature-banner"><strong>金秋焕新</strong><span>车载好物限时上新</span></div><div class="section-title">焕新专区 <small>更多 ›</small></div>${feedGrid()}<div class="section-title">出行装备 <small>更多 ›</small></div>${productRail()}</div>`; }
function renderG9() { return `<div class="panel-inner"><div class="feature-banner" style="background:linear-gradient(135deg,#3d506b,#7893ad)"><strong>G9 专属</strong><span>智享出行，专属精选</span></div><div class="section-title">车载精品 <small>更多 ›</small></div>${feedGrid()}${productRail()}</div>`; }
function renderEssentials() { return `<div class="panel-inner"><div class="feature-banner"><strong>新车必备</strong><span>把新车生活一次准备齐</span></div><div class="section-title">热门套装 <small>更多 ›</small></div>${productRail()}<div class="section-title">补能与养护 <small>更多 ›</small></div>${feedGrid()}</div>`; }

function renderCar() {
  return `<div class="car-summary"><div class="range"><strong>303<small> km</small></strong><span>电量 57%</span></div><div class="charge-pill">⚡ 充电服务 ›</div></div><div class="car-hero"><img src="./assets/components/car-hero.jpg" alt="问界 M8"><div class="car-caption">车辆不在线 · 更新于 03/24 18:53<br>ADS 高阶功能包（未生效）</div></div><div class="control-rail"><button class="control-button is-active" data-label="车锁"><b class="control-circle">▣</b><span>车锁</span></button><button class="control-button" data-label="后备箱"><b class="control-circle">⌁</b><span>后备箱</span></button><button class="control-button" data-label="车窗"><b class="control-circle">▤</b><span>车窗</span></button><button class="control-button" data-label="鸣笛"><b class="control-circle">◖</b><span>闪灯鸣笛</span></button><button class="control-button" data-label="前备箱"><b class="control-circle">⌒</b><span>前备箱</span></button></div><div class="info-grid"><div class="info-card"><strong>✤ 空调</strong><div class="value">−&nbsp; 20.5 &nbsp;+</div><small>车内温度 23.3℃</small></div><div><div class="info-card"><strong>📍 位置</strong><div class="value" style="font-size:14px">1064km · 停泊中</div></div><div class="info-card" style="margin-top:10px"><strong>⚡ 电量</strong><div class="value" style="font-size:14px">57% · 未充电</div></div></div></div><div class="settings-list"><div class="settings-item">数字车钥匙 <i>未开通 ›</i></div><div class="settings-item">遥控泊车 <i>›</i></div><div class="settings-item">泊车代驾辅助 <i>›</i></div><div class="settings-item">哨兵模式 <i>未开启 ›</i></div><div class="settings-item">智慧场景 <i>›</i></div><div class="settings-item">一键备车 <i>›</i></div><div class="settings-item">冷暖箱 <i>›</i></div><div class="settings-item">车辆状态 <i>›</i></div></div>`;
}

function renderService() {
  return `<div class="section-title" style="margin-top:4px">充电服务</div><div class="service-hero"><strong>App 所有充电站均可积分充电</strong><span>积分全额抵扣，充电 0 元起</span><div class="service-number">180万+</div></div><div class="service-actions"><button>▣<br>扫码充电</button><button>△<br>最优站点</button><button>♧<br>我的充电</button></div><div class="section-title">维保服务 <small>更多 ›</small></div><div class="maintenance-card"><strong>距离下次保养</strong><small style="float:right;color:#888">剩余 18940 km/201天</small><div class="progress-track"><i></i></div></div><div class="section-title">服务门店 <small>更多 ›</small></div><div class="store-card"><img src="./assets/components/service-store.jpg" alt="华为旗舰店"><div class="store-info"><strong>华为旗舰店 · 深圳华为坂田 G区</strong><p>广东省深圳市龙岗区 · 距离 0.44km</p></div></div><div class="section-title">更多服务</div><div class="service-grid">${["ETC服务","道路救援","预约试驾","体验中心","智选购车","金融试算器","我的家充桩","置换服务","软件"].map((item, index) => `<div><i>${["▰","▲","◉","⌂","▱","▦","⚡","↻","▣"][index]}</i><span>${item}</span></div>`).join("")}</div>`;
}

function renderMine() {
  return `<div class="profile-card"><div class="profile-main"><i class="profile-avatar"></i><div class="profile-name"><strong>德善寻欢</strong><span>问界车主 · 蓝钻会员</span></div><span>›</span></div><div class="stats"><div><strong>7</strong><span>发布</span></div><div><strong>30</strong><span>收藏</span></div><div><strong>41</strong><span>关注</span></div><div><strong>17</strong><span>粉丝</span></div></div></div><div class="shortcut-pair"><div class="shortcut-card">我的车辆 <i>🚙</i></div><div class="shortcut-card">我的订单 <i>▣</i></div></div><div class="settings-list"><div class="settings-item">▢&nbsp; 浏览记录 <i>›</i></div><div class="settings-item">♙&nbsp; 邀请好友 <i>›</i></div><div class="settings-item">▤&nbsp; 我的积分 <i>0 ›</i></div><div class="settings-item">♧&nbsp; 我的家充桩 <i>›</i></div><div class="settings-item">▯&nbsp; 我的活动 <i>›</i></div></div><div class="settings-list"><div class="settings-item">◉&nbsp; 预约试驾 <i>›</i></div><div class="settings-item">◇&nbsp; 新手考试 <i>›</i></div><div class="settings-item">▣&nbsp; 车屏互联 <i>›</i></div><div class="settings-item">♡&nbsp; 车主权益 <i>›</i></div><div class="settings-item">▤&nbsp; 车主指南 <i>›</i></div></div><div class="settings-list"><div class="settings-item">⚙&nbsp; 设置 <i>›</i></div><div class="settings-item">⌕&nbsp; 服务热线 <i>›</i></div><div class="settings-item">□&nbsp; 意见反馈 <i>›</i></div><div class="settings-item">?&nbsp; 帮助中心 <i>›</i></div><div class="settings-item">ⓘ&nbsp; 关于我们 <i>›</i></div></div>`;
}

function initialize() {
  const params = new URLSearchParams(location.search);
  const requestedPage = params.get("page");
  if (mainTabs.some((tab) => tab.id === requestedPage)) state.activeMain = requestedPage;
  const requestedChannel = Number(params.get("channel"));
  if (channelDefinitions[state.activeMain] && Number.isInteger(requestedChannel)) {
    state.channelIndex[state.activeMain] = Math.max(0, Math.min(channelDefinitions[state.activeMain].tabs.length - 1, requestedChannel));
  }
  pageHost = document.createElement("div");
  pageHost.className = "page-host";
  bottomNav = renderBottomNav();
  screen.append(pageHost, bottomNav);
  const initial = channelDefinitions[state.activeMain] ? renderChannelPage(state.activeMain) : renderPlainPage(state.activeMain);
  pageHost.append(initial);
  pageCache.set(state.activeMain, initial);
  updateBottomNav();
  updateGuide();
  updateAddress();
  if (state.activeMain === "car") window.setTimeout(showDownloadSheet, 520);
  updateClock();
}

function updateClock() {
  const time = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  document.querySelectorAll(".status-time").forEach((element) => { element.textContent = time; });
}

previousButton.addEventListener("click", () => {
  const page = pageCache.get(state.activeMain);
  page?._setChannelIndex?.(state.channelIndex[state.activeMain] - 1);
});
nextButton.addEventListener("click", () => {
  const page = pageCache.get(state.activeMain);
  page?._setChannelIndex?.(state.channelIndex[state.activeMain] + 1);
});

document.addEventListener("keydown", (event) => {
  const definition = channelDefinitions[state.activeMain];
  const page = pageCache.get(state.activeMain);
  if (definition && event.key === "ArrowLeft") page?._setChannelIndex?.(state.channelIndex[state.activeMain] - 1);
  if (definition && event.key === "ArrowRight") page?._setChannelIndex?.(state.channelIndex[state.activeMain] + 1);
  if (["ArrowUp", "ArrowDown"].includes(event.key)) {
    const scroller = definition ? page.querySelector(`[data-panel="${state.channelIndex[state.activeMain]}"]`) : page.querySelector(".plain-scroll");
    scroller?.scrollBy({ top: event.key === "ArrowDown" ? 260 : -260, behavior: "smooth" });
  }
  if (event.key === "Escape" && state.sheetOpen) closeDownloadSheet();
});

initialize();
screen.addEventListener("click", event => {
  if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);
screen.addEventListener("dragstart", event => event.preventDefault());
screen.addEventListener("click", event => {
  const chip = event.target.closest(".chip");
  if (chip) {
    chip.parentElement.querySelectorAll(".chip").forEach(item => item.classList.toggle("is-active", item === chip));
    const panel = chip.closest(".tab-panel");
    const cards = panel.querySelectorAll(".feed-card, .post-card");
    cards.forEach((card, index) => { card.hidden = !["全部", "最新"].includes(chip.textContent) && index % 2 !== [...chip.parentElement.children].indexOf(chip) % 2; });
  }
});
window.setInterval(updateClock, 30000);
