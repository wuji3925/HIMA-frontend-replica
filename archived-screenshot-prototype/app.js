const imagePath = (number) => `./assets/original/${number}.jpg`;
const MOTION_MS = 360;

const tabs = [
  { id: "discover", label: "发现" },
  { id: "select", label: "精选" },
  { id: "car", label: "爱车" },
  { id: "service", label: "服务" },
  { id: "mine", label: "我的" },
];

const routes = {
  discover: {
    label: "发现 · 推荐",
    frames: [128, 129, 130, 131, 132],
    bottomNav: true,
    hotspots: [
      { x: 5, y: 12, w: 90, h: 17, action: "openProduct", label: "查看问界车型", frames: [0] },
      { x: 4, y: 30, w: 22, h: 9, action: "toast", message: "进入立即控车", frames: [0] },
      { x: 28, y: 30, w: 22, h: 9, action: "toast", message: "查看升级尝鲜", frames: [0] },
      { x: 52, y: 30, w: 22, h: 9, action: "toast", message: "查看热门活动", frames: [0] },
      { x: 76, y: 30, w: 20, h: 9, action: "toast", message: "打开智能助手", frames: [0] },
    ],
  },
  select: {
    label: "精选 · 新车必备",
    frames: [133, 134],
    bottomNav: true,
    hotspots: [
      { x: 80, y: 5.8, w: 9, h: 7, action: "openCategories", label: "全部分类" },
      { x: 7, y: 12, w: 86, h: 24, action: "openProduct", label: "查看车型详情", frames: [0] },
      { x: 5, y: 44, w: 43, h: 26, action: "toast", message: "商品详情 Demo 待接入" },
      { x: 52, y: 44, w: 43, h: 26, action: "toast", message: "商品详情 Demo 待接入" },
    ],
  },
  categories: {
    label: "精选 · 全部分类",
    frames: [135],
    bottomNav: false,
    backTo: "select",
    hotspots: [
      { x: 0, y: 4, w: 14, h: 9, action: "back", label: "返回精选" },
      { x: 84, y: 4, w: 14, h: 9, action: "toast", message: "搜索商品" },
      { x: 27, y: 13, w: 68, h: 13, action: "toast", message: "商品详情 Demo 待接入" },
    ],
  },
  car: {
    label: "爱车 · 问界 M8",
    frames: [136, 137],
    bottomNav: true,
    hotspots: [
      { x: 18, y: 18, w: 70, h: 34, action: "openProduct", label: "查看问界 M9", frames: [0] },
      { x: 2, y: 57, w: 96, h: 11, action: "carControl", label: "车辆控制", frames: [0] },
      { x: 4, y: 69, w: 44, h: 12, action: "toast", message: "空调已进入演示状态", frames: [0] },
      { x: 52, y: 69, w: 44, h: 12, action: "toast", message: "车辆位置：静安中", frames: [0] },
    ],
  },
  service: {
    label: "服务 · 充电与维保",
    frames: [138, 139],
    bottomNav: true,
    hotspots: [
      { x: 6, y: 15, w: 88, h: 25, action: "toast", message: "正在查找附近充电站", frames: [0] },
      { x: 5, y: 56, w: 90, h: 28, action: "setFrame", frame: 1, label: "查看服务门店", frames: [0] },
    ],
  },
  mine: {
    label: "我的 · 车主中心",
    frames: [140, 141],
    bottomNav: true,
    hotspots: [
      { x: 5, y: 13, w: 90, h: 17, action: "toast", message: "个人资料页 Demo 待接入", frames: [0] },
      { x: 4, y: 33, w: 92, h: 52, action: "toast", message: "已记录入口，后续可接入完整流程" },
    ],
  },
  product: {
    label: "车型 · 问界 M9",
    frames: [142],
    bottomNav: true,
    backTo: "car",
    hotspots: [
      { x: 82, y: 5, w: 13, h: 8, action: "toast", message: "分享面板已唤起", frames: [0] },
      { x: 4, y: 87.5, w: 44, h: 5, action: "toast", message: "预约试驾流程已启动", frames: [0] },
      { x: 51, y: 87.5, w: 45, h: 5.5, action: "openBenefits", label: "立即购车", frames: [0] },
    ],
  },
  benefits: {
    label: "购车 · 专属权益",
    frames: [143],
    bottomNav: true,
    backTo: "product",
    hotspots: [
      { x: 53, y: 3.5, w: 22, h: 5.5, action: "toast", message: "预约试驾流程已启动" },
      { x: 77, y: 3.5, w: 21, h: 5.5, action: "toast", message: "订购流程 Demo 待接入" },
    ],
  },
};

const screen = document.querySelector("#screen");
const hotspotsLayer = document.querySelector("#hotspots");
const phone = document.querySelector("#phone");
const toast = document.querySelector("#toast");
const loading = document.querySelector("#loading");
const pageTitle = document.querySelector("#pageTitle");
const pageStep = document.querySelector("#pageStep");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");
const scrollHint = document.querySelector("#scrollHint");

let activeRoute = "discover";
let activeFrame = 0;
let transitionDirection = "down";
let toastTimer;
let motionLocked = false;
let gesture = null;
let suppressClicksUntil = 0;

function loadInitialRoute() {
  const params = new URLSearchParams(location.search);
  const route = params.get("page");
  if (route && routes[route]) activeRoute = route;
  const frame = Number(params.get("step"));
  if (Number.isInteger(frame) && frame >= 0 && frame < routes[activeRoute].frames.length) {
    activeFrame = frame;
  }
}

function updateAddress() {
  const url = new URL(location.href);
  url.searchParams.set("page", activeRoute);
  url.searchParams.set("step", String(activeFrame));
  history.replaceState({ activeRoute, activeFrame }, "", url);
}

function makeHotspot(item, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `hotspot ${className}`;
  button.style.left = `${item.x}%`;
  button.style.top = `${item.y}%`;
  button.style.width = `${item.w}%`;
  button.style.height = `${item.h}%`;
  button.setAttribute("aria-label", item.label || item.message || "页面操作");
  button.addEventListener("click", (event) => {
    if (Date.now() < suppressClicksUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    handleAction(item);
  });
  return button;
}

function renderHotspots(route) {
  hotspotsLayer.replaceChildren();
  route.hotspots
    ?.filter((item) => !item.frames || item.frames.includes(activeFrame))
    .forEach((item) => hotspotsLayer.append(makeHotspot(item)));

  if (route.bottomNav) {
    tabs.forEach((tab, index) => {
      hotspotsLayer.append(makeHotspot({
        x: index * 20,
        y: 93.5,
        w: 20,
        h: 6.5,
        action: "goTab",
        route: tab.id,
        label: `切换到${tab.label}`,
      }, "bottom-tab"));
    });
  }
}

function createScreenFrame(route, frameIndex, className = "") {
  const frame = document.createElement("div");
  frame.className = `screen-frame ${className}`.trim();
  frame.dataset.frame = String(frameIndex);

  const image = document.createElement("img");
  image.className = "screen-image";
  image.src = imagePath(route.frames[frameIndex]);
  image.alt = `${route.label}，第 ${frameIndex + 1} 屏`;
  image.draggable = false;
  frame.append(image);
  return frame;
}

function createFixedChrome(route, position) {
  const chrome = document.createElement("div");
  chrome.className = `fixed-chrome is-${position}`;
  chrome.setAttribute("aria-hidden", "true");
  const image = document.createElement("img");
  image.className = "screen-image";
  image.src = imagePath(route.frames[activeFrame]);
  image.alt = "";
  image.draggable = false;
  chrome.append(image);
  return chrome;
}

function updatePageChrome(route) {
  renderHotspots(route);
  pageTitle.textContent = route.label;
  pageStep.textContent = `${activeFrame + 1} / ${route.frames.length}`;
  previousButton.disabled = activeFrame === 0;
  nextButton.disabled = activeFrame === route.frames.length - 1;
  scrollHint.classList.toggle("is-visible", route.frames.length > 1 && activeFrame === 0);
  updateAddress();
}

function render(animateRoute = false) {
  const route = routes[activeRoute];
  const scrollable = route.frames.length > 1;
  const frameClasses = ["is-current"];
  if (animateRoute) frameClasses.push("is-entering");
  if (scrollable) frameClasses.push("is-scroll-content");
  const frame = createScreenFrame(route, activeFrame, frameClasses.join(" "));
  frame.dataset.direction = transitionDirection;
  if (scrollable) {
    screen.replaceChildren(frame, createFixedChrome(route, "top"), createFixedChrome(route, "bottom"));
  } else {
    screen.replaceChildren(frame);
  }
  updatePageChrome(route);
}

function ensurePreview(targetFrame) {
  let preview = screen.querySelector(".screen-frame.is-preview");
  if (preview?.dataset.frame === String(targetFrame)) return preview;
  preview?.remove();
  preview = createScreenFrame(routes[activeRoute], targetFrame, "is-preview is-scroll-content");
  screen.append(preview);
  return preview;
}

function setFrameProgress(targetFrame, progress, direction, animate = false) {
  const current = screen.querySelector(".screen-frame.is-current");
  const preview = ensurePreview(targetFrame);
  const sign = direction === "down" ? 1 : -1;
  const easing = `transform ${MOTION_MS}ms cubic-bezier(0.2, 0.75, 0.18, 1), opacity ${MOTION_MS}ms ease-out`;
  const transition = animate ? easing : "none";
  const safeProgress = Math.max(0, Math.min(1, progress));

  current.style.transition = transition;
  preview.style.transition = transition;
  current.style.transform = `translate3d(0, ${-sign * safeProgress * 3.5}%, 0) scale(${1 - safeProgress * 0.004})`;
  current.style.opacity = String(1 - safeProgress);
  preview.style.transform = `translate3d(0, ${sign * (1 - safeProgress) * 8}%, 0) scale(${0.996 + safeProgress * 0.004})`;
  preview.style.opacity = String(safeProgress);
}

function resetCurrentFrame(animate = true) {
  const current = screen.querySelector(".screen-frame.is-current");
  if (!current) return;
  current.style.transition = animate
    ? `transform 260ms cubic-bezier(0.22, 0.72, 0.2, 1), opacity 260ms ease-out`
    : "none";
  current.style.transform = "translate3d(0, 0, 0) scale(1)";
  current.style.opacity = "1";
}

function settleFrame(targetFrame, direction, startProgress = 0, commit = true) {
  if (motionLocked) return;
  motionLocked = true;
  setFrameProgress(targetFrame, startProgress, direction, false);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    setFrameProgress(targetFrame, commit ? 1 : 0, direction, true);
  }));

  window.setTimeout(() => {
    if (commit) {
      activeFrame = targetFrame;
      transitionDirection = direction;
      render(false);
    } else {
      screen.querySelector(".screen-frame.is-preview")?.remove();
      resetCurrentFrame(false);
    }
    motionLocked = false;
  }, MOTION_MS + 30);
}

function changeFrame(nextFrame, direction = "down") {
  if (motionLocked) return;
  const route = routes[activeRoute];
  const bounded = Math.max(0, Math.min(route.frames.length - 1, nextFrame));
  if (bounded === activeFrame) {
    showToast(nextFrame < 0 ? "已经到达页面顶部" : "已经到达页面底部");
    return;
  }
  settleFrame(bounded, direction, 0, true);
}

function goTo(routeName, frame = 0, direction = "left") {
  if (!routes[routeName]) return;
  transitionDirection = direction;
  activeRoute = routeName;
  activeFrame = Math.max(0, Math.min(routes[routeName].frames.length - 1, frame));
  motionLocked = false;
  render(true);
}

function handleAction(item) {
  switch (item.action) {
    case "goTab":
      goTo(item.route, 0, "left");
      break;
    case "openCategories":
      goTo("categories", 0, "left");
      break;
    case "openProduct":
      goTo("product", 0, "left");
      break;
    case "openBenefits":
      goTo("benefits", 0, "left");
      break;
    case "back":
      goBack();
      break;
    case "setFrame":
      changeFrame(item.frame, item.frame > activeFrame ? "down" : "up");
      break;
    case "carControl":
      showToast("车辆控制仅作交互演示，未连接真实车辆");
      break;
    case "toast":
      showToast(item.message);
      break;
  }
}

function goBack() {
  const route = routes[activeRoute];
  if (route.backTo) goTo(route.backTo, 0, "right");
  else if (activeFrame > 0) changeFrame(activeFrame - 1, "up");
  else showToast("当前已是一级页面");
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function onWheel(event) {
  event.preventDefault();
  if (motionLocked || Math.abs(event.deltaY) < 12) return;
  if (event.deltaY > 0) changeFrame(activeFrame + 1, "down");
  else changeFrame(activeFrame - 1, "up");
}

function onPointerDown(event) {
  if (motionLocked || (event.pointerType === "mouse" && event.button !== 0)) return;
  gesture = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startAt: performance.now(),
    axis: null,
    targetFrame: null,
    direction: null,
    progress: 0,
  };
}

function onPointerMove(event) {
  if (!gesture || gesture.id !== event.pointerId) return;
  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  if (!gesture.axis && Math.hypot(dx, dy) > 8) {
    gesture.axis = Math.abs(dy) >= Math.abs(dx) ? "vertical" : "horizontal";
  }
  if (gesture.axis !== "vertical") return;

  event.preventDefault();
  if (!phone.hasPointerCapture?.(event.pointerId)) {
    phone.setPointerCapture?.(event.pointerId);
  }
  phone.classList.add("is-dragging");
  hotspotsLayer.classList.add("is-disabled");
  scrollHint.classList.remove("is-visible");
  gesture.direction = dy < 0 ? "down" : "up";
  gesture.targetFrame = activeFrame + (dy < 0 ? 1 : -1);
  const route = routes[activeRoute];

  if (gesture.targetFrame < 0 || gesture.targetFrame >= route.frames.length) {
    const current = screen.querySelector(".screen-frame.is-current");
    const resisted = Math.max(-22, Math.min(22, dy * 0.16));
    current.style.transition = "none";
    current.style.transform = `translate3d(0, ${resisted}px, 0)`;
    return;
  }

  gesture.progress = Math.min(0.98, Math.abs(dy) / (phone.clientHeight * 0.32));
  setFrameProgress(gesture.targetFrame, gesture.progress, gesture.direction, false);
}

function endPointerGesture(event, cancelled = false) {
  if (!gesture || gesture.id !== event.pointerId) return;
  const finishedGesture = gesture;
  gesture = null;
  phone.classList.remove("is-dragging");
  hotspotsLayer.classList.remove("is-disabled");

  const dx = event.clientX - finishedGesture.startX;
  const elapsed = Math.max(1, performance.now() - finishedGesture.startAt);
  const velocity = Math.abs((event.clientY - finishedGesture.startY) / elapsed);

  if (finishedGesture.axis === "vertical") {
    suppressClicksUntil = Date.now() + 450;
    const validTarget = finishedGesture.targetFrame !== null
      && finishedGesture.targetFrame >= 0
      && finishedGesture.targetFrame < routes[activeRoute].frames.length;
    if (!validTarget) {
      resetCurrentFrame(true);
      return;
    }
    const commit = !cancelled && (finishedGesture.progress >= 0.24 || velocity >= 0.48);
    settleFrame(
      finishedGesture.targetFrame,
      finishedGesture.direction,
      finishedGesture.progress,
      commit,
    );
    return;
  }

  if (!cancelled && finishedGesture.axis === "horizontal" && dx > 74) {
    suppressClicksUntil = Date.now() + 450;
    goBack();
  }
}

phone.addEventListener("wheel", onWheel, { passive: false });
phone.addEventListener("pointerdown", onPointerDown);
phone.addEventListener("pointermove", onPointerMove);
phone.addEventListener("pointerup", (event) => endPointerGesture(event));
phone.addEventListener("pointercancel", (event) => endPointerGesture(event, true));
previousButton.addEventListener("click", () => changeFrame(activeFrame - 1, "up"));
nextButton.addEventListener("click", () => changeFrame(activeFrame + 1, "down"));

document.addEventListener("keydown", (event) => {
  if (["ArrowDown", "PageDown"].includes(event.key)) changeFrame(activeFrame + 1, "down");
  if (["ArrowUp", "PageUp"].includes(event.key)) changeFrame(activeFrame - 1, "up");
  if (event.key === "ArrowLeft" || event.key === "Escape") goBack();
  if (event.key === "ArrowRight") changeFrame(activeFrame + 1, "down");
});

async function preload() {
  const numbers = [...new Set(Object.values(routes).flatMap((route) => route.frames))];
  await Promise.all(numbers.map((number) => new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = imagePath(number);
  })));
  loading.classList.add("is-hidden");
}

loadInitialRoute();
render();
preload();
