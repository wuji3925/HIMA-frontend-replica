// Geometry: original screenshots 1176 × 2480, rendered at one-third scale.
const W = 392, H = 2480 / 3;
const screen = document.querySelector('#screen');
const phone = document.querySelector('#phone');
const pages = new Map();
const names = { discover:'发现', select:'精选', car:'爱车', service:'服务', mine:'我的' };
const channels = { discover:['推荐','动态','广场','尊界典藏'], select:['推荐','新车必备','今日上新','软件服务'] };
const params = new URLSearchParams(location.search);
const state = { main: names[params.get('page')] ? params.get('page') : 'discover', channel:{discover:0,select:0}, carReady:false, downloading:false };
if (channels[state.main]) state.channel[state.main] = Math.max(0,Math.min(3,Number(params.get('channel')) || 0));
let blockedClick = 0, layer, modalTrigger, toastTimer;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const asset = name => `./assets/reference/${name}.jpg`;
function svg(name) {
  const p = {
    plus:'<path d="M12 2v20M2 12h20"/>', bell:'<path d="M5 17h14c-2-2-2-5-2-8a5 5 0 0 0-10 0c0 3 0 6-2 8Z"/><path d="M10 21h4M12 2v2"/>',
    search:'<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 6 6"/>', scan:'<path d="M3 8V5q0-2 2-2h3m8 0h3q2 0 2 2v3M3 16v3q0 2 2 2h3m8 0h3q2 0 2-2v-3M3 12h18"/>',
    menu:'<path d="M5 5h17M5 12h17M5 19h17"/><path d="M1 5h.1M1 12h.1M1 19h.1"/>', sort:'<path d="M3 5h18M3 12h18M3 19h12"/>', grid:'<rect x="3" y="3" width="7" height="14" rx="1.5"/><rect x="14" y="3" width="7" height="14" rx="1.5"/><path d="M3 21h7m4 0h7"/>', single:'<rect x="6" y="3" width="12" height="14" rx="2"/><path d="M6 21h12"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>', back:'<path d="m14 4-8 8 8 8M6 12h16"/>', qr:'<rect x="2" y="2" width="8" height="8" rx="2"/><rect x="14" y="2" width="8" height="8" rx="2"/><rect x="2" y="14" width="8" height="8" rx="2"/><path d="M5 5h2v2H5zm12 0h2v2h-2zM5 17h2v2H5zm10-3v4h7m-8 4h3m5 0h.1m0-8h.1"/>',
    lock:'<rect x="8" y="10" width="13" height="11" rx="2"/><path d="M4 10V6a4 4 0 0 1 8 0v2M14.5 14v3"/>', trunk:'<path d="M3 6h9l6 4 3 7h-7m-8 0H2m10-12 6-3M12 10l-2 3"/><circle cx="10" cy="17" r="3"/>', window:'<path d="m3 9 8-6h10v18H3V9Z"/><path d="M3 11h18M15 7l3-2"/>', sound:'<path d="M3 9h4l5-4v14l-5-4H3V9Zm12-2q5 5 0 10m3-13q8 8 0 16"/>',
    power:'<path d="M12 2v10M7 5a9 9 0 1 0 10 0"/>', pin:'<path d="M12 22s8-9 8-14a8 8 0 1 0-16 0c0 5 8 14 8 14Z"/><circle cx="12" cy="8" r="2" fill="white" stroke="none"/>', bolt:'<path d="m14 1-10 13h7l-1 9 10-14h-7l1-8Z"/>',
    key:'<circle cx="12" cy="7" r="4"/><path d="M12 11v11m0-6h4m-4 3h3"/>', park:'<path d="M4 8v12m16-12v12M5 4q7-5 14 0M7 7q5-3 10 0"/><rect x="8" y="10" width="8" height="12" rx="2"/>', shield:'<path d="m12 2 9 4v7q-1 6-9 9-8-3-9-9V6l9-4Z"/><path d="m8 12 3 3 5-6"/>', cube:'<path d="m12 2 10 5v10l-10 5-10-5V7l10-5Zm0 10v10M2 7l10 5 10-5M7 5l10 5"/>',
    book:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 11h8M8 15h6"/>', bookmark:'<path d="M4 22V4q0-2 2-2h12q2 0 2 2v18l-8-5-8 5ZM8 6h8"/>', clock:'<rect x="3" y="2" width="15" height="20" rx="3"/><path d="M7 6h7"/><circle cx="18" cy="18" r="5" fill="white"/><path d="M18 15v3l2 1"/>',
    people:'<circle cx="10" cy="7" r="5"/><path d="M1 23a9 9 0 0 1 18 0M17 3q7 5 0 10m2 2q4 2 4 8"/>', coins:'<ellipse cx="12" cy="5" rx="10" ry="4"/><path d="M2 5v5c0 5 20 5 20 0V5M2 10v5c0 5 20 5 20 0v-5M2 15v4c0 5 20 5 20 0v-4"/>',
    charger:'<rect x="2" y="2" width="11" height="17" rx="5"/><path d="m9 5-4 6h5l-3 5M7 19v4m10-1v-6m0 0a4 4 0 1 1 4 0v7"/>', wheel:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="m3 7 6 4m6 0 6-4m-9 8v7"/>', edit:'<path d="m3 17 14-14 4 4L7 21H3v-4ZM3 23h18"/>', screens:'<rect x="2" y="3" width="14" height="12" rx="2"/><rect x="16" y="9" width="6" height="13" rx="1"/><path d="M7 19h6m-3-4v4"/>', diamond:'<path d="m2 8 5-6h10l5 6-10 14L2 8Zm0 0h20M8 6h8"/>',
    gear:'<path d="m9 2-1 3-3 1-3 4 2 3-1 3 4 4h3l2 2 4-2 3-1 2-4-1-3 1-3-4-4h-3l-2-3H9Z"/><circle cx="12" cy="12" r="4"/>', phone:'<path d="m3 2 5 1 2 5-3 2q2 5 7 7l2-3 5 2 1 5c-9 4-24-11-19-19Z"/>', help:'<circle cx="12" cy="12" r="10"/><path d="M8 8a4 4 0 1 1 6 4l-2 2m0 4h.1"/>', info:'<circle cx="12" cy="12" r="10"/><path d="M12 10v8m0-12h.1"/>', location:'<path d="m12 2 9 19-9-5-9 5 9-19Z"/>',
    thumb:'<path d="m8 10 4-8q4-1 2 7h7l-2 13H8V10ZM2 10h6v12H2V10Z"/>', star:'<path d="m12 2 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z"/>', comment:'<path d="M3 18a10 8 0 1 1 9 2l-6 3v-4M7 10h.1m5 0h.1m5 0h.1"/>', eye:'<path d="M1 12q11-14 22 0Q12 26 1 12Z"/><circle cx="12" cy="12" r="4"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name] || p.book}</svg>`;
}
function navIcon(id) {
  // Exact 24vp two-tone shapes from the provided APK (3.0.2.320).
  const shapes = {
    discover:'<path fill="var(--nav-primary)" fill-rule="evenodd" d="M3.953 3.953C8.13-.225 14.83-.34 19.147 3.606L14.83 7.924C12.902 6.351 10.058 6.463 8.26 8.26 6.463 10.058 6.351 12.902 7.924 14.83L3.606 19.147C-.34 14.83-.225 8.13 3.953 3.953Z"/><path fill="var(--nav-secondary)" fill-rule="evenodd" d="M19.509 19.509C15.332 23.686 8.631 23.801 4.314 19.855L8.632 15.537C10.559 17.11 13.404 16.998 15.201 15.201 16.998 13.404 17.11 10.559 15.537 8.632L19.855 4.314C23.801 8.631 23.686 15.332 19.509 19.509Z"/>',
    select:'<path fill="var(--nav-primary)" d="M5.985 1.936H18.764C19.869 1.936 20.764 2.831 20.764 3.936V19.596H3.985V3.936C3.985 2.831 4.881 1.936 5.985 1.936Z"/><path fill="var(--nav-secondary)" fill-rule="evenodd" d="M12.164 19.358C12.167 19.355 12.272 19.352 12.469 19.349L12.471 19.362 12.565 19.36V19.362H12.83L14.156 19.362C15.212 19.36 16.686 19.356 18.577 19.349 18.699 19.349 18.752 19.326 19.104 19.036 19.147 18.99 19.147 18.884 19.147 18.873V7.725H22.032C22.117 11.49 22.117 15.245 22.032 18.99 22.027 19.223 21.937 19.447 21.762 19.66L19.534 21.938C19.258 22.115 18.98 22.206 18.699 22.21 16.347 22.246 14.631 22.265 13.552 22.269H10.212C9.097 22.266 8.454 22.247 6.05 22.21 5.769 22.206 5.491 22.115 5.216 21.938L2.988 19.66C2.813 19.447 2.723 19.223 2.718 18.99 2.633 15.245 2.633 11.49 2.718 7.725H5.602V18.873C5.602 18.884 5.602 18.99 5.646 19.036 5.689 19.081 5.944 19.303 5.997 19.326 6.05 19.349 6.156 19.349 6.172 19.349 8.105 19.356 10.701 19.362 12.164 19.358Z"/><path fill="var(--nav-cutout)" d="M16.341 3.71C16.341 4.782 15.928 5.791 15.179 6.549 14.43 7.307 13.434 7.725 12.375 7.725 11.315 7.725 10.319 7.307 9.57 6.549 8.822 5.791 8.409 4.782 8.409 3.71L8.409 3.699 9.384 3.7V3.713C9.386 5.381 10.726 6.738 12.375 6.738 14.023 6.738 15.364 5.381 15.365 3.713L15.365 3.701 16.341 3.697V3.71Z"/>',
    car:'<path fill="var(--nav-primary)" d="M11.998 3.095 12.382 3.096C14.463 3.108 16.074 3.223 17.225 3.444 17.838 3.562 18.385 3.901 18.763 4.397 19.394 5.225 19.853 5.994 20.139 6.708 20.422 7.415 20.669 8.125 20.881 8.836L20.952 8.879C21.087 8.952 21.216 9.031 21.34 9.117L21.436 8.345C21.483 8.103 21.697 7.935 21.935 7.937L23.252 8.182C23.685 8.265 23.998 8.644 23.998 9.085 23.998 9.47 23.712 9.788 23.341 9.838L22.108 9.845C22.812 11.043 22.998 11.69 22.998 13.473V18.932C22.998 19.642 22.905 19.996 22.731 20.322 22.556 20.648 22.301 20.903 21.975 21.078 21.649 21.252 21.295 21.345 20.585 21.345H19.91C19.201 21.345 18.847 21.252 18.521 21.078 18.195 20.903 17.939 20.648 17.765 20.322 17.598 20.01 17.506 19.673 17.498 19.023V18.845H6.498V18.932C6.498 19.642 6.405 19.996 6.231 20.322 6.056 20.648 5.801 20.903 5.475 21.078 5.149 21.252 4.795 21.345 4.085 21.345H3.41C2.701 21.345 2.347 21.252 2.021 21.078 1.695 20.903 1.439 20.648 1.265 20.322 1.091 19.996.998 19.642.998 18.932V13.473C.998 11.825 1.157 11.147 1.532 10.391 1.637 10.196 1.756 10.013 1.889 9.844L.758 9.845C.338 9.845-.002 9.505-.002 9.085-.002 8.644.311 8.265.744 8.182L1.97 7.946C2.213 7.9 2.448 8.036 2.534 8.258L2.656 9.118C2.779 9.031 2.909 8.952 3.108 8.845 3.295 8.201 3.543 7.492 3.856 6.711 4.171 5.923 4.631 5.145 5.234 4.374 5.61 3.894 6.147 3.565 6.745 3.449 7.968 3.211 9.714 3.095 11.998 3.095Z"/><path fill="var(--nav-secondary)" d="M11.998 4.595 11.637 4.596C9.619 4.608 8.08 4.717 7.032 4.921 6.787 4.969 6.569 5.103 6.415 5.299 5.897 5.961 5.508 6.618 5.248 7.268 4.928 8.07 4.681 8.783 4.509 9.405L4.408 9.778 4.858 9.729C7.246 9.487 9.635 9.367 12.023 9.367 14.56 9.367 17.082 9.503 19.591 9.776L19.526 9.549C19.31 8.787 19.05 8.025 18.746 7.265 18.516 6.689 18.124 6.034 17.57 5.306 17.416 5.104 17.192 4.965 16.942 4.917 15.832 4.704 14.179 4.595 11.998 4.595Z"/><path fill="var(--nav-cutout)" d="M4.427 12.391C5.107 12.552 5.765 12.733 6.399 12.932 7.219 13.19 8.052 13.482 8.887 13.81A.182.182 0 0 1 8.957 14.098C8.814 14.263 8.641 14.417 8.44 14.563 8.231 14.715 7.994 14.826 7.73 14.897A1.2 1.2 0 0 1 7.249 14.932L4.765 14.633C4.548 14.606 4.471 14.581 4.391 14.537 4.247 14.459 4.166 14.313 4.067 13.997L3.843 12.963A.483.483 0 0 1 4.427 12.391ZM19.573 12.391C18.893 12.552 18.235 12.733 17.601 12.932 16.781 13.19 15.948 13.482 15.113 13.81A.182.182 0 0 0 15.043 14.098C15.186 14.263 15.359 14.417 15.56 14.563 15.769 14.715 16.006 14.826 16.27 14.897 16.427 14.939 16.59 14.951 16.751 14.932L19.235 14.633C19.452 14.606 19.529 14.581 19.609 14.537 19.753 14.459 19.834 14.313 19.933 13.997L20.157 12.963A.483.483 0 0 0 19.573 12.391Z"/>',
    service:'<path fill="var(--nav-primary)" fill-rule="evenodd" d="M2.758 5.164A5.93 5.93 0 0 1 11.145 5.164L16.193 10.212A5.93 5.93 0 0 1 16.193 18.599 5.93 5.93 0 0 1 7.807 18.599L2.758 13.551A5.93 5.93 0 0 1 2.758 5.164Z"/><path fill="var(--nav-secondary)" fill-rule="evenodd" d="M21.242 5.401A5.93 5.93 0 0 1 21.242 13.788L16.193 18.836A5.93 5.93 0 0 1 7.807 18.836 5.93 5.93 0 0 1 7.807 10.449L12.855 5.401A5.93 5.93 0 0 1 21.242 5.401Z"/>',
    mine:'<path fill="var(--nav-primary)" d="M12 1.811A9 9 0 1 1 12 19.811 9 9 0 0 1 12 1.811Z"/><path fill="var(--nav-secondary)" d="M15.826 11.626A5.2 5.2 0 1 1 15.826 22.026 5.2 5.2 0 0 1 15.826 11.626Z"/>',
  };
  return `<svg class="nav-glyph" viewBox="0 0 24 24" aria-hidden="true">${shapes[id]}</svg>`;
}
function tool(name,label,extra='') { return `<button class="icon-button" aria-label="${label}" ${extra}>${svg(name)}</button>`; }
function status() { return `<div class="status-bar"><span class="status-time">08:28</span><img class="system-apps" src="${asset('status-apps')}" alt=""><img class="system-network" src="${asset('status-network')}" alt="网络与电量"></div>`; }
const img = (name,alt='',cls='') => `<img class="${cls}" src="${asset(name)}" alt="${alt}" draggable="false">`;
function search() { return `<button class="search-field" aria-label="搜索">${svg('search')}</button>`; }
function sectionTitle(title) { return `<div class="section-title"><span>${title}</span><button class="more" data-category>${'更多'} ${svg('chevron')}</button></div>`; }
function brands(first='全部') { return `<div class="brand-filter"><div class="brand-options" data-horizontal>${[first,'V800','G9','RX','S800','H5','M6','M8','M9'].map((name,i)=>`<button class="brand${i===0?' active':''}" aria-pressed="${i===0}">${name}</button>`).join('')}</div><div class="filter-tools">${tool('sort','内容排序')}${tool('grid','切换列表布局','data-layout')}</div></div>`; }
function carousel() { return `<div class="banner-carousel" data-horizontal><div class="banner-track">${['discover-banner','discover-banner-2'].map(n=>img(n,'鸿蒙智行活动')).join('')}</div></div>`; }
function quickActions() { return `<div class="quick-rail" data-horizontal>${[['quick-order','立即定购'],['quick-ota','升级尝鲜'],['quick-hot','热门活动'],['quick-ai','智能助手'],['quick-order','体验中心']].map(([image,label])=>`<button class="quick-action">${img(image,label)}<span>${label}</span></button>`).join('')}</div>`; }
const feedData = [
  ['feed-launch','鸿蒙智行新车登场，马上分享','官方活动…','264'],
  ['feed-charge','出门在外充电，遇到大太阳暴晒或者下雨天…','一路清宁','10'],
  ['feed-autumn','今年车险续保不纠结！寻界旅途线上…','花椒大熊','6'],
  ['feed-m8','开问界M8接娃一个月，被同事夸了好几次…','一颗小透明','5'],
  ['feed-black','M6纯电上高速，续航打七折，我实测出来的…','咸鱼不想卷','7'],
];
function feedCard(item,index) { const [photo,title,user,count]=item; return `<article class="feed-card" data-brand="${index%3}">${img(photo,title)}<div class="feed-body"><p>${title}</p><div class="feed-meta"><span><i class="mini-avatar"></i>${user}<b>M6</b></span><button class="like" aria-label="点赞" aria-pressed="false">${svg('thumb')}<span>${count}</span></button></div></div></article>`; }
function topicsCard() { return `<article class="topics-card"><strong>推荐话题 <small>更多 ›</small></strong>${['我与鸿蒙智行…','暑期出行日记','爱车的七夕仪式感','我的爱车最懂我','灵感智旅还能这么…'].map((t,i)=>`<p># ${t}<small>${i+1}.2w次参与</small></p>`).join('')}<button data-topics>↻ 我也发一条</button></article>`; }
function feed() { return `<div class="feed-grid"><div class="feed-column">${feedCard(feedData[0],0)}${feedCard(feedData[2],2)}${feedCard(feedData[4],1)}${feedCard(feedData[0],0)}</div><div class="feed-column">${feedCard(feedData[1],1)}${feedCard(feedData[3],0)}${topicsCard()}${feedCard(feedData[2],2)}</div></div>`; }
function recommend() { return `<div class="recommend-content"><div class="discover-promo">${search()}${carousel()}${quickActions()}</div>${brands()}${feed()}</div>`; }
function post(name,copy,index) { return `<article class="post"><div class="post-author"><span class="avatar-placeholder">${svg('people')}</span><strong>${name}</strong><button class="follow" aria-pressed="false">关注</button></div><p class="post-copy">${copy}</p><span class="post-topic">#${index?'智界R7':'爱车随手拍'}</span><div class="post-gallery${index?' single':''}">${Array.from({length:index?1:3},()=>'<span class="media-placeholder"></span>').join('')}</div><div class="post-footer"><span>刚刚</span><div><span>${svg('eye')}浏览</span><button class="like" aria-pressed="false">${svg('thumb')}赞</button><button class="save" aria-pressed="false">${svg('star')}收藏</button><button>${svg('comment')}评论</button></div></div></article>`; }
function moments() { return `${brands('最新')}<div class="posts">${post('Vivi','偶然在路上遇见温柔落日，停下脚步，拍下问界M7的侧影。漫天霞光倾泻而下，给车身镀上一层暖金色光晕，柔和的光影勾勒出舒展流畅的车身线条，沉稳大气的…',0)}${post('雾中期盼','【求助】27 款智界 R7 到底上不上 L3？准车主纠结到失眠<br>最近准备冲 27 款 R7，续航升级、HUD 补齐、座椅…',1)}${post('官方资讯','敢这？？<br>预订智界RX → 链接',1)}</div>`; }
function plaza() { return `<div class="plaza-content">${search()}<div class="brand-cards">${['问界','智界','享界','尊界','尚界','购车攻略'].map((n,i)=>`<button>${img(`brand-${i}`,n)}<span>${n}</span></button>`).join('')}</div>${sectionTitle('热门活动')}<div class="activities">${['分享鸿蒙智行用车体验（9月）','华为家充桩，居家便捷充电','金秋焕新'].map((t,i)=>`<article class="activity">${img(`activity-${i}`,t)}<div><p>${t}</p><small>${['09月01日','08月24日','08月27日'][i]}</small><footer><span>◉◉ ${[3306,3574,1268][i]}人报名</span><button>立即报名</button></footer></div></article>`).join('')}</div>${sectionTitle('热门话题')}<div class="topic-list">${['金秋出行游记','小艺真香时刻','爱车随手拍','华为Mate XT2','华为家充桩','我的V8提车日记'].map((t,i)=>`<button># ${t}<small>${i+1}.0w次参与</small></button>`).join('')}</div>${sectionTitle('视频图集')}${img('feed-m8','车主图集','plaza-image')}</div>`; }
function collection() { return `<div class="collection-content"><div class="collection-intro"><p>尊界 S800 <em>Grand Design</em></p><h2>典 藏 大 观</h2><p>立即定购 享多重购车权益</p><button>立即定购 ›</button></div>${img('collection-car','尊界S800','collection-car')}<section class="collection-spec"><h2>参数配置</h2><div><strong>尊界 S800 Grand Design 典藏大观</strong><p>¥ 138.8万起</p><p>· 臻奢设计主题<br>· 全新一代超级途灵平台<br>· 全新一代全车身融合感知系统</p></div></section><section class="collection-story"><h2>见证不凡之旅</h2>${img('collection-car','尊界典藏')}<h2>以匠心，敬不凡</h2><p>每一处细节，皆为典藏。</p></section></div><div class="collection-actions"><button>预约试驾</button><button>立即定购</button></div>`; }
function productRail() { return `<div class="product-rail" data-horizontal>${['product-m7','product-m8','product-m9','product-m7'].map((n,i)=>`<button aria-label="M${i+7}专属">${img(n,'车型专属')}</button>`).join('')}</div>`; }
function products() { return `<div class="products">${[['product-etc1','隐藏式内置ETC V9/Z7…','499'],['product-etc2','隐藏式内置ETC M9/M…','499'],['product-charger','华为家充桩 7kW','3800'],['product-ads','ADS 高阶功能包','720']].map(([photo,title,price])=>`<article class="product">${img(photo,title)}<p>${title}</p><span>¥${price}</span></article>`).join('')}</div>`; }
function shop(index=0) { return index===0 ? `<div class="shop-content"><div class="shop-banner">${img('select-banner','开新日，多款新品上架')}</div>${productRail()}<div class="shop-section">${sectionTitle('新车必备')}${products()}${sectionTitle('今日上新')}${products()}</div></div>` : `<div class="shop-section">${sectionTitle(channels.select[index])}${products()}${products()}</div>`; }
function settings(items) { return `<div class="settings-list">${items.map(([label,ico,sub='',end=''])=>`<button class="settings-item">${svg(ico)}<span>${label}${sub?`<small>${sub}</small>`:''}</span>${end?`<em>${end}</em>`:''}${svg('chevron')}</button>`).join('')}</div>`; }
function car() { return `<div class="car-content"><div class="car-top"><span class="door-pill"><i></i>车门未关</span><button class="charge-pill">${svg('bolt')}充电服务 ${svg('chevron')}</button></div><div class="range"><strong>303</strong><span><small>SUM</small>km</span><p>电量 57%</p><i><b></b></i></div><div class="car-model">${img('car-model','问界M8纯电Max+')}<div class="car-placeholder"><svg viewBox="0 0 360 160"><path d="m35 90 47-13 47-49h111l48 48 37 22-6 28H36Z"/><path d="m90 76 46-41h98l34 40Z"/><circle cx="91" cy="119" r="25"/><circle cx="271" cy="119" r="25"/></svg><button data-download>下载车辆资源</button></div></div><div class="rail-indicator"><i></i></div><div class="car-caption">车辆不在线 更新于 03/24 18:53 <small>♧ NFC</small><br>ADS 高阶功能包（未生效） ${svg('info')}</div><div class="control-rail" data-horizontal>${[['车锁','lock'],['后备箱','trunk'],['车窗','window'],['闪灯鸣笛','sound'],['前备箱','trunk']].map(([label,ico],i)=>`<button class="control${i===0?' selected':''}" aria-label="${label}"><b>${svg(ico)}</b><span>${label}</span></button>`).join('')}</div><div class="rail-indicator control-indicator"><i></i></div><div class="info-grid"><section class="climate"><header><b class="fan">✤</b><span>空调</span><button aria-label="空调开关">${svg('power')}</button></header><div class="temperature"><button aria-label="降低温度">−</button><strong>20.5</strong><button aria-label="升高温度">＋</button></div><small>车内温度: 23.3°C</small></section><div class="info-stack"><section><header><b class="pin">${svg('pin')}</b>位置</header><small>1064km · 停泊中</small></section><section><header><b class="bolt">${svg('bolt')}</b>电量</header><small>57% · 未充电</small></section></div></div>${settings([['数字车钥匙','key','未开通'],['遥控泊车','park'],['泊车代驾辅助','park'],['哨兵模式','shield','未开启'],['智慧场景','cube'],['一键备车','car'],['冷暖箱','book'],['车辆状态','wheel']])}<div class="car-more">${img('product-m9','了解新车')}${img('product-charger','立即充电')}</div></div>`; }
function service() { return `<div class="service-content">${sectionTitle('充电服务')}<div class="charging-card">${img('service-banner','App所有充电站均可积分充电')}<div class="charging-actions">${[['scan','扫码充电'],['location','最优站点'],['people','我的充电']].map(([ico,n])=>`<button>${svg(ico)}<span>${n}</span></button>`).join('')}</div></div>${sectionTitle('维保服务')}<section class="maintenance"><div><strong>距离下次保养</strong><small>剩余18940 km/201天</small></div><div class="progress-track"><i></i></div></section>${sectionTitle('服务门店')}<article class="store">${img('store','华为旗舰店')}<div><strong>华为旗舰店 · 深圳华为坂田G区</strong><p>广东省深圳市龙岗区隆平路与冲之大道交汇处华为坂田基地G区9栋</p><button aria-label="门店导航">${svg('location')}<small>0.44km</small></button></div></article>${sectionTitle('更多服务')}<div class="service-grid">${[['book','ETC服务'],['pin','道路救援'],['wheel','预约试驾'],['cube','体验中心'],['car','智选购车'],['grid','金融试算器'],['charger','我的家充桩'],['car','置换服务'],['grid','软件'],['book','车主指南']].map(([ico,n],i)=>`<button style="--service-color:${[1,5].includes(i)?'#ffad1b':i>5?'#51c7b6':'#43b6dd'}">${svg(ico)}<span>${n}</span></button>`).join('')}</div></div>`; }
function mine() { return `<div class="mine-content"><section class="profile"><div class="profile-top">${img('profile-avatar','头像')}<div><strong>耄耋寻欢</strong><p><b>M6</b> <b>M7</b> <span>🏅</span></p></div>${svg('chevron')}</div><div class="stats">${[['7','发布'],['28','收藏'],['41','关注'],['17','粉丝']].map(([n,t])=>`<button><strong>${n}</strong><span>${t}</span></button>`).join('')}</div></section><div class="shortcuts"><button><strong>我的车辆</strong><small>问界M8纯电Ultra</small><i>${navIcon('car')}</i></button><button><strong>我的订单</strong><small>精选/充电/购车等</small><i>${svg('book')}</i></button></div>${settings([['浏览记录','clock'],['邀请好友','people'],['我的积分','coins','','0'],['我的家充桩','charger'],['我的活动','bookmark']])}${settings([['预约试驾','wheel'],['新手考试','edit'],['车屏互联','screens'],['车主权益','diamond'],['车主指南','book']])}${settings([['设置','gear'],['服务热线','phone'],['意见反馈','edit'],['帮助中心','help'],['关于我们','info']])}</div>`; }

const host = document.createElement('div'); host.className='page-host';
const nav = document.createElement('nav'); nav.className='bottom-nav'; nav.setAttribute('aria-label','一级导航');
nav.innerHTML=Object.entries(names).map(([id,name])=>`<button data-main="${id}" aria-label="切换到${name}">${navIcon(id)}<span>${name}</span></button>`).join('');
screen.append(host,nav);
function createPage(id) {
  const page=document.createElement('section'); page.className=`main-page ${id}-page`; page.dataset.page=id;
  const isChannel=!!channels[id];
  page.innerHTML=`<header class="app-header">${status()}<div class="title-bar">${isChannel?`<div class="channel-tabs" role="tablist">${channels[id].map((title,i)=>`<button class="channel-tab" data-channel="${i}" role="tab">${title}</button>`).join('')}</div>`:`<h1>${id==='car'?'问界M8纯电Max+<small>▼</small>':names[id]}</h1>${id==='car'?'<span class="compact-alert"><i></i>1项</span>':''}`}<div class="header-tools">${id==='mine'?tool('qr','个人二维码'):''}${tool(id==='discover'?'plus':id==='select'?'menu':'scan',id==='select'?'全部分类':id==='discover'?'发布':'扫一扫',id==='select'?'data-category':'')}${tool(id==='select'?'search':'bell',id==='select'?'搜索':'消息')}</div></div></header>${isChannel?`<div class="tab-viewport"><div class="tab-track">${(id==='discover'?[recommend,moments,plaza,collection]:[()=>shop(0),()=>shop(1),()=>shop(2),()=>shop(3)]).map((render,i)=>`<section class="tab-panel" role="tabpanel" data-panel="${i}"><div class="scroll-content">${render()}</div><div class="panel-loader" hidden><span class="loading-ring"></span><span>正在加载…</span></div></section>`).join('')}</div></div>`:`<div class="plain-scroll"><div class="scroll-content">${({car,service,mine})[id]()}</div></div>`}`;
  host.append(page); pages.set(id,page);
  const collectionToolbar=page.querySelector('.collection-actions');
  if(collectionToolbar) {page.append(collectionToolbar);collectionToolbar.hidden=state.channel.discover!==3;}
  if(id==='car') page.querySelector('.car-placeholder>svg').outerHTML=img('car-placeholder','车辆资源未下载');
  if(isChannel) setupChannels(page,id);
  page.querySelectorAll('.tab-panel,.plain-scroll').forEach(scroller=>setupScroller(scroller,page,id));
  page.querySelectorAll('[data-horizontal]').forEach(setupHorizontal);
  page.querySelectorAll('.banner-carousel').forEach(setupBanner);
  page.querySelectorAll('.like,.save,.follow').forEach(button=>button.addEventListener('click',()=>{
    const selected=button.getAttribute('aria-pressed')!=='true'; button.setAttribute('aria-pressed',String(selected));
    if(button.classList.contains('follow')) button.textContent=selected?'已关注':'关注';
    if(button.classList.contains('like')) {const count=button.querySelector('span'); if(count) count.textContent=Number(count.textContent)+(selected?1:-1);}
  }));
  page.querySelectorAll('.brand').forEach(button=>button.addEventListener('click',()=>{
    const row=button.closest('.brand-filter'); row.querySelectorAll('.brand').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
    button.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'nearest',inline:'nearest'});
    const panel=button.closest('.tab-panel'); const index=[...button.parentElement.children].indexOf(button);
    panel.querySelectorAll('.feed-card').forEach(card=>card.hidden=index!==0&&Number(card.dataset.brand)!==(index-1)%3);
  }));
  page.querySelectorAll('[data-layout]').forEach(button=>button.addEventListener('click',()=>{
    const panel=button.closest('.tab-panel'); const single=panel.classList.toggle('single-layout'); button.innerHTML=svg(single?'single':'grid'); button.setAttribute('aria-pressed',String(single));
  }));
  page.querySelectorAll('[data-category]').forEach(button=>{if(id==='select') button.addEventListener('click',openCategory);});
  page.querySelectorAll('[data-download]').forEach(button=>button.addEventListener('click',showDownload));
  page.querySelectorAll('.control,.climate button').forEach(button=>button.addEventListener('click',()=>showToast('车辆不在线')));
  return page;
}
function activeScroller(page=pages.get(state.main)) {return page.querySelector(channels[state.main]?`[data-panel="${state.channel[state.main]}"]`:'.plain-scroll');}
function updateChrome(page,id) {
  const scroller=page.querySelector(channels[id]?`[data-panel="${state.channel[id]}"]`:'.plain-scroll');
  const y=scroller.scrollTop;
  if(id==='select') {
    const overlay=state.channel[id]===0;
    page.classList.toggle('shop-overlay',overlay);
    page.style.setProperty('--header-fill',overlay?Math.min(1,y/130):1);
    page.classList.toggle('light-header',overlay&&y<70);
  }
  if(id==='car') page.classList.toggle('car-scrolled',y>26);
}
function switchMain(id) {
  if(!names[id]) return;
  if(id===state.main&&pages.has(id)&&!pages.get(id).hidden) return;
  closeLayer(); state.main=id;
  const page=pages.get(id)||createPage(id);
  for(const [key,value] of pages) {value.hidden=key!==id;value.inert=key!==id;}
  nav.querySelectorAll('button').forEach(button=>{const active=button.dataset.main===id;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'page':'false');});
  page.classList.toggle('car-ready',state.carReady);
  updateChrome(page,id);updateGuide();
  // Bottom-tab navigation in the recording does not translate pages sideways.
  if(id==='car'&&!state.carReady&&!state.downloading) setTimeout(()=>{if(state.main==='car')showDownload();},420);
}
function updateGuide() {
  const c=channels[state.main], i=state.channel[state.main]||0;
  document.querySelector('#pageTitle').textContent=names[state.main]+(c?` · ${c[i]}`:'');
  document.querySelector('#pageStep').textContent=c?`频道 ${i+1} / ${c.length}`:'上下滑动浏览';
  document.querySelector('#previousButton').disabled=!c||i===0;
  document.querySelector('#nextButton').disabled=!c||i===3;
  const url=new URL(location.href);url.searchParams.set('page',state.main);url.searchParams.delete('step');
  if(c)url.searchParams.set('channel',i);else url.searchParams.delete('channel');
  history.replaceState({},'',url);
}
function setupChannels(page,id) {
  const viewport=page.querySelector('.tab-viewport'),track=page.querySelector('.tab-track');
  const visited=new Set([state.channel[id]]);
  const setIndex=(next,load=true,interaction='tap',releaseSpeed=0)=>{
    const index=Math.max(0,Math.min(3,next)); const changed=index!==state.channel[id]; state.channel[id]=index;
    const swipeDuration=Math.max(150,Math.min(260,240-Math.abs(releaseSpeed)*70));
    track.style.transitionDuration=reducedMotion||interaction!=='swipe'?'0ms':`${swipeDuration}ms`;
    track.style.transitionTimingFunction='cubic-bezier(.2,.78,.2,1)';
    track.style.transform=`translate3d(${-index*W}px,0,0)`;
    page.querySelectorAll('.channel-tab').forEach((tab,i)=>{tab.classList.toggle('active',i===index);tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    page.querySelectorAll('.tab-panel').forEach((panel,i)=>panel.inert=i!==index);
    const toolbar=page.querySelector('.collection-actions');if(toolbar)toolbar.hidden=index!==3;
    if(changed&&load&&!visited.has(index)) {
      visited.add(index);
      const panel=page.querySelector(`[data-panel="${index}"]`),loader=panel.querySelector('.panel-loader');
      loader.hidden=false;loader.classList.remove('chrome-ready');panel.setAttribute('aria-busy','true');
      // The recording switches tapped channels immediately. Dynamic restores
      // its filter chrome first, while the feed remains in the loading state.
      if(id==='discover'&&index===1)setTimeout(()=>loader.classList.add('chrome-ready'),230);
      const duration=id==='discover'?(index===3?980:1080):720;
      setTimeout(()=>{loader.hidden=true;loader.classList.remove('chrome-ready');panel.removeAttribute('aria-busy');},duration);
    }
    updateChrome(page,id);if(state.main===id)updateGuide();
  };
  page.setChannel=setIndex;
  page.querySelectorAll('[data-channel]').forEach(button=>button.addEventListener('click',()=>setIndex(Number(button.dataset.channel),true,'tap')));
  let drag;
  viewport.addEventListener('pointerdown',event=>{
    if(event.button>0||event.target.closest('[data-horizontal],.collection-actions'))return;
    const scale=phone.clientWidth/W;
    drag={id:event.pointerId,x:event.clientX/scale,y:event.clientY/scale,last:event.clientX/scale,time:performance.now(),speed:0,axis:null,dx:0};
  });
  viewport.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const scale=phone.clientWidth/W,x=event.clientX/scale,y=event.clientY/scale,dx=x-drag.x,dy=y-drag.y,now=performance.now();
    if(!drag.axis&&Math.hypot(dx,dy)>7)drag.axis=Math.abs(dx)>Math.abs(dy)*1.15?'x':'y';
    if(drag.axis!=='x')return;
    event.preventDefault();viewport.setPointerCapture(event.pointerId);blockedClick=now+350;
    drag.speed=(x-drag.last)/Math.max(8,now-drag.time);drag.last=x;drag.time=now;drag.dx=dx;
    const index=state.channel[id],edge=index===0&&dx>0||index===3&&dx<0;
    const offset=edge?Math.sign(dx)*W*.16*(1-Math.exp(-Math.abs(dx)/W)):Math.max(-W,Math.min(W,dx));
    track.style.transitionDuration='0ms';track.style.transform=`translate3d(${-index*W+offset}px,0,0)`;
  });
  function end(event) {
    if(!drag||event.pointerId!==drag.id)return;
    const last=drag;drag=null;if(last.axis!=='x')return;
    const recent=performance.now()-last.time<90?last.speed:0;
    const advance=event.type!=='pointercancel'&&(Math.abs(last.dx)>W*.25||Math.abs(recent)>.45&&Math.abs(last.dx)>14);
    setIndex(state.channel[id]+(advance?(last.dx<0?1:-1):0),true,'swipe',recent);
  }
  viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
  setIndex(state.channel[id],false,'instant');
}
function setupScroller(scroller,page,id) {
  let drag,momentum,refreshTimer;
  const content=scroller.querySelector('.scroll-content');
  const canRefresh=id==='discover'&&Number(scroller.dataset.panel)<3;
  const refresh=document.createElement('div');refresh.className='pull-refresh';refresh.innerHTML='<span class="loading-ring"></span><span>下拉刷新</span>';
  if(canRefresh)scroller.prepend(refresh);
  scroller.addEventListener('scroll',()=>updateChrome(page,id),{passive:true});
  function pull(y){const offset=Math.max(0,Math.min(96,y*.42));content.style.transform=`translateY(${offset}px)`;refresh.style.height=`${offset}px`;refresh.lastElementChild.textContent=offset>57?'松开刷新':'下拉刷新';return offset;}
  scroller.addEventListener('pointerdown',event=>{
    if(event.button>0)return;cancelAnimationFrame(momentum);
    const scale=phone.clientWidth/W;
    drag={id:event.pointerId,x:event.clientX/scale,y:event.clientY/scale,last:event.clientY/scale,time:performance.now(),speed:0,axis:null,mouse:event.pointerType==='mouse',pull:0};
  });
  scroller.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const scale=phone.clientWidth/W,x=event.clientX/scale,y=event.clientY/scale,dy=y-drag.y,dx=x-drag.x;
    if(!drag.axis&&Math.hypot(dx,dy)>7)drag.axis=Math.abs(dy)>Math.abs(dx)?'y':'x';
    if(drag.axis!=='y'||!drag.mouse)return;
    event.preventDefault();scroller.setPointerCapture(event.pointerId);blockedClick=performance.now()+350;
    if(canRefresh&&scroller.scrollTop===0&&dy>0&&!refreshTimer){drag.pull=pull(dy);return;}
    const now=performance.now();drag.speed=(drag.last-y)/Math.max(8,now-drag.time);scroller.scrollTop+=drag.last-y;drag.last=y;drag.time=now;
  });
  function finishPull(offset,cancelled){
    content.style.transition='transform 240ms ease-out';refresh.style.transition='height 240ms ease-out';
    if(offset>57&&!cancelled){content.style.transform='translateY(58px)';refresh.style.height='58px';refresh.classList.add('refreshing');refresh.lastElementChild.textContent='正在刷新…';refreshTimer=setTimeout(()=>{refresh.classList.remove('refreshing');refresh.lastElementChild.textContent='✓ 刷新完成';setTimeout(()=>{content.style.transform='';refresh.style.height='0px';refreshTimer=null;},350);},650);}
    else{content.style.transform='';refresh.style.height='0px';}
    setTimeout(()=>{content.style.transition='';refresh.style.transition='';},250);
  }
  function end(event){
    if(!drag||event.pointerId!==drag.id)return;const last=drag;drag=null;
    if(last.pull){finishPull(last.pull,event.type==='pointercancel');return;}
    if(!last.mouse||last.axis!=='y'||event.type==='pointercancel')return;
    let speed=performance.now()-last.time<90?Math.max(-3,Math.min(3,last.speed)):0,previous=performance.now();
    const tick=now=>{const dt=Math.min(32,now-previous);previous=now;const before=scroller.scrollTop;scroller.scrollTop+=speed*dt;speed*=Math.exp(-dt/240);if(Math.abs(speed)>.02&&before!==scroller.scrollTop&&!page.hidden)momentum=requestAnimationFrame(tick);};
    momentum=requestAnimationFrame(tick);
  }
  scroller.addEventListener('pointerup',end);scroller.addEventListener('pointercancel',end);
  scroller.addEventListener('wheel',()=>cancelAnimationFrame(momentum),{passive:true});
  // Touch gets browser-native inertia; intercept only an outward pull at top.
  let touch;
  scroller.addEventListener('touchstart',event=>{if(canRefresh&&scroller.scrollTop===0&&!refreshTimer&&event.touches.length===1){touch={x:event.touches[0].clientX,y:event.touches[0].clientY,offset:0};}else touch=null;},{passive:true});
  scroller.addEventListener('touchmove',event=>{if(!touch)return;const dx=event.touches[0].clientX-touch.x,dy=event.touches[0].clientY-touch.y;if(dy>7&&dy>Math.abs(dx)*1.2&&scroller.scrollTop===0){if(event.cancelable)event.preventDefault();touch.offset=pull(dy/(phone.clientWidth/W));blockedClick=performance.now()+350;}},{passive:false});
  scroller.addEventListener('touchend',()=>{if(touch?.offset)finishPull(touch.offset,false);touch=null;},{passive:true});
  scroller.addEventListener('touchcancel',()=>{if(touch?.offset)finishPull(touch.offset,true);touch=null;},{passive:true});
}
function setupHorizontal(element) {
  if(element.classList.contains('banner-carousel'))return;
  let drag;
  element.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button===0)drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:element.scrollLeft};});
  element.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x;if(Math.abs(dx)<7||Math.abs(event.clientY-drag.y)>Math.abs(dx))return;element.setPointerCapture(event.pointerId);event.preventDefault();blockedClick=performance.now()+350;element.scrollLeft=drag.left-dx/(phone.clientWidth/W);});
  element.addEventListener('pointerup',()=>drag=null);element.addEventListener('pointercancel',()=>drag=null);
}
function setupBanner(banner) {
  const track=banner.firstElementChild;let index=0,drag,lastInteraction=0;
  function settle(next){index=Math.max(0,Math.min(1,next));track.style.transitionDuration=reducedMotion?'0ms':'280ms';track.style.transform=`translateX(${-index*359}px)`;}
  banner.addEventListener('pointerdown',event=>{if(event.button>0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0};lastInteraction=performance.now();});
  banner.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=(event.clientX-drag.x)/(phone.clientWidth/W);if(Math.abs(dx)<7||Math.abs(event.clientY-drag.y)>Math.abs(dx))return;event.preventDefault();banner.setPointerCapture(event.pointerId);blockedClick=performance.now()+350;drag.dx=dx;track.style.transitionDuration='0ms';track.style.transform=`translateX(${-index*359+dx*.8}px)`;});
  function end(event){if(!drag)return;const dx=drag.dx;drag=null;settle(event.type==='pointercancel'?index:index+(Math.abs(dx)>50?(dx<0?1:-1):0));}
  banner.addEventListener('pointerup',end);banner.addEventListener('pointercancel',end);
  if(!reducedMotion)setInterval(()=>{if(!drag&&performance.now()-lastInteraction>6500&&!document.hidden&&state.main==='discover'&&state.channel.discover===0)settle(1-index);},6500);
}
function showToast(text){clearTimeout(toastTimer);const toast=document.querySelector('#toast');toast.textContent=text;toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),1600);}
function closeLayer(){if(!layer)return;layer.remove();layer=null;host.inert=false;nav.inert=false;modalTrigger?.focus({preventScroll:true});modalTrigger=null;}
function showDownload(){
  if(state.carReady||state.downloading||state.main!=='car')return;closeLayer();modalTrigger=document.activeElement;
  layer=document.createElement('div');layer.className='modal-layer';layer.innerHTML=`<div class="scrim"></div><section class="resource-sheet" role="dialog" aria-modal="true" aria-label="下载车辆资源包"><p>请下载车辆资源包</p><div><button data-later>下次再说</button><button data-now>现在下载</button></div></section>`;
  screen.append(layer);host.inert=true;nav.inert=true;
  layer.querySelector('[data-later]').addEventListener('click',closeLayer);layer.querySelector('.scrim').addEventListener('click',closeLayer);
  layer.querySelector('[data-now]').addEventListener('click',()=>{state.downloading=true;closeLayer();const page=pages.get('car');const button=page.querySelector('[data-download]');let percent=0;const timer=setInterval(()=>{percent+=10;button.textContent=`下载中 ${percent}%`;if(percent>=100){clearInterval(timer);state.downloading=false;state.carReady=true;page.classList.add('car-ready');}},110);});
  layer.querySelector('[data-later]').focus({preventScroll:true});
}
function openCategory(){
  closeLayer();modalTrigger=document.activeElement;layer=document.createElement('section');layer.className='category-page';layer.setAttribute('aria-label','全部分类');
  const categories=['新车必备','今日上新','软件服务','充电补能','车内舒适','数码智能','户外出行','影音娱乐','生活周边','儿童呵护','M7专属','M8专属'];
  layer.innerHTML=`<header>${status()}<div class="category-title">${tool('back','返回','data-back')}<strong>全部分类</strong>${tool('search','搜索')}</div></header><div class="category-body"><nav>${categories.map((name,i)=>`<button class="${i===0?'active':''}">${name}</button>`).join('')}</nav><div class="category-results"><h2>新车必备 <small>软件服务</small></h2>${products()}${products()}</div></div>`;
  screen.append(layer);host.inert=true;nav.inert=true;layer.querySelector('[data-back]').addEventListener('click',closeLayer);layer.querySelector('[data-back]').focus({preventScroll:true});
  layer.querySelectorAll('.category-body nav button').forEach(button=>button.addEventListener('click',()=>{layer.querySelectorAll('.category-body nav button').forEach(b=>b.classList.toggle('active',b===button));layer.querySelector('.category-results h2').textContent=button.textContent;layer.querySelector('.category-results').scrollTop=0;}));
}
screen.addEventListener('click',event=>{if(performance.now()<blockedClick){event.preventDefault();event.stopImmediatePropagation();}},true);
screen.addEventListener('dragstart',event=>event.preventDefault());
nav.addEventListener('click',event=>{const button=event.target.closest('[data-main]');if(button)switchMain(button.dataset.main);});
document.querySelector('#previousButton').addEventListener('click',()=>pages.get(state.main).setChannel?.(state.channel[state.main]-1));
document.querySelector('#nextButton').addEventListener('click',()=>pages.get(state.main).setChannel?.(state.channel[state.main]+1));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){closeLayer();return;}
  if(layer||/INPUT|TEXTAREA/.test(event.target.tagName))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();pages.get(state.main).setChannel?.(state.channel[state.main]+(event.key==='ArrowRight'?1:-1));}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();activeScroller()?.scrollBy({top:event.key==='ArrowDown'?260:-260,behavior:reducedMotion?'instant':'smooth'});}
});
const resize=()=>{screen.style.transform=`scale(${phone.clientWidth/W})`;};new ResizeObserver(resize).observe(phone);resize();
switchMain(state.main);
