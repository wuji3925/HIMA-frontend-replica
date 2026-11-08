// This file enhances the separately loaded reference application. It is never
// loaded by index.html. Native sensors/systemMaterial are not invoked by a web page.
(() => {
  const body = document.body;
  // Current operational channels observed on device, 3.0.3.300 (2026-11-02).
  channels.discover[3] = '享界V8';
  channels.select = ['推荐','双11','今日上新','R7专属'];
  const optionValues = {
    theme: ['light', 'dark', 'auto'],
    light: ['strong', 'balanced', 'weak', 'off'],
    motion: ['full', 'reduce'],
  };
  const url = new URL(location.href);
  const preferences = { theme: 'light', light: 'balanced', motion: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'full' };
  for (const key of Object.keys(preferences)) {
    if (optionValues[key].includes(url.searchParams.get(key))) preferences[key] = url.searchParams.get(key);
  }
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const defaultVehicleOrder = ['RX','V8','R7','G9','V800','S800','H5','V9','Z7','Z7T','S9','S9T','S7','M9','M8','M7','M6','M5'];
  let vehicleOrder = [...defaultVehicleOrder];
  let localDraft = '';
  const springs = new Set();
  const reduceMotion = () => body.dataset.motion === 'reduce';
  const makeSpring = (value, render) => {
    const spring = new HimaSpring(value, render, reduceMotion);
    springs.add(spring); return spring;
  };
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
  function updateReferenceLink() {
    const hasChannel = Boolean(channels[state.main]);
    const original = new URL('./index.html', location.href);
    original.searchParams.set('page', state.main);
    if (hasChannel) original.searchParams.set('channel', state.channel[state.main]);
    document.querySelector('#referenceLink').href = original.href;
  }
  function applyPreferences() {
    body.dataset.theme = preferences.theme === 'auto' ? systemTheme.matches ? 'dark' : 'light' : preferences.theme;
    body.dataset.light = preferences.light;
    body.dataset.motion = systemMotion.matches ? 'reduce' : preferences.motion;
    if (reduceMotion()) [...springs].forEach(spring => spring.finish());
    document.querySelectorAll('[data-setting]').forEach(group => {
      group.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === preferences[group.dataset.setting])));
    });
    document.querySelector('#reduceMotion').checked = body.dataset.motion === 'reduce';
    document.querySelector('#reduceMotion').disabled = systemMotion.matches;
    const current = new URL(location.href);
    // Legacy research links remain usable; unsupported grip controls are retired.
    current.searchParams.delete('grip');
    for (const [key, value] of Object.entries(preferences)) current.searchParams.set(key, value);
    history.replaceState({}, '', current);
    updateReferenceLink();
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

  function dismissOverlay(velocity = 0) {
    const closing = layer;
    if (!closing?.classList.contains('os7-overlay') || body.dataset.motion === 'reduce') { closeLayer(); return; }
    if (closing.classList.contains('is-closing')) return;
    closing.classList.add('is-closing');
    const sheet = closing.querySelector('.os7-sheet');
    if (sheet?.motion) {
      // Keep the sheet interactive: grabbing during exit cancels the dismissal.
      sheet.motion.to(sheet.offsetHeight + 30, {
        velocity: typeof velocity === 'number' ? velocity : 0,
        complete: () => { if (layer === closing) closeLayer(); else closing.remove(); },
      });
      return;
    }
    closing.style.pointerEvents = 'none';
    const duration = closing.querySelector('.os7-menu') ? 180 : 220;
    setTimeout(() => {
      if (layer === closing) closeLayer();
      else closing.remove();
    }, duration);
  }
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
    layer.querySelector('.os7-scrim').addEventListener('click', dismissOverlay);
    layer.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', dismissOverlay));
    return layer;
  }
  function openSearch() {
    const inShop = state.main === 'select';
    if (inShop && window.HimaRoutes) { if(layer&&!layer.classList.contains('category-page'))closeLayer(); window.HimaRoutes.openSearch(); return; }
    const sourceChannel = inShop ? state.channel.select : 0;
    const hint = inShop ? '搜索精选商品、软件服务' : '搜索车型、用车内容';
    const overlay = mountOverlay(`<section class="os7-sheet" role="dialog" aria-modal="true" aria-label="${inShop ? '搜索精选商品' : '搜索鸿蒙智行内容'}"><div class="sheet-handle" aria-hidden="true"></div><header><h2>搜索</h2><button data-close>取消</button></header><label class="os7-search-box">${svg('search')}<input type="search" aria-label="搜索内容" placeholder="${hint}" autocomplete="off"></label><div class="os7-search-results" aria-live="polite"></div></section>`, '搜索');
    const input = overlay.querySelector('input');
    const results = overlay.querySelector('.os7-search-results');
    const candidates = inShop ? [...new Map([...activeScroller().querySelectorAll('.product')].map(card => {
      const title = card.querySelector('p').textContent;
      return [title, {title, imageUrl:card.querySelector('img').getAttribute('src')}];
    })).values()] : feedData.map((item, index) => ({ image: item[0], title: item[1], index }));
    function renderResults() {
      const query = input.value.trim().toLowerCase();
      const matches = candidates.filter(item => !query || item.title.toLowerCase().includes(query));
      results.innerHTML = `<p>${query ? matches.length ? '搜索结果' : '暂无相关内容' : inShop ? '精选商品' : '推荐内容'}</p>`;
      matches.slice(0, 4).forEach(item => {
        const button = document.createElement('button'); button.className = 'os7-result';
        button.innerHTML = `<img alt=""><span></span>${svg('chevron')}`;
        button.querySelector('img').src = item.imageUrl || asset(item.image);
        button.querySelector('span').textContent = item.title;
        button.addEventListener('click', () => {
          const destination = inShop ? 'select' : 'discover';
          closeLayer(); switchMain(destination); pages.get(destination).setChannel(sourceChannel, false);
          const panel = activeScroller();
          const card = [...panel.querySelectorAll(inShop ? '.product' : '.feed-card')].find(card => card.querySelector(inShop ? 'p' : '.feed-body>p')?.textContent === item.title);
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
    const overlay = sheet.closest('.os7-overlay');
    const scrim = overlay.querySelector('.os7-scrim');
    const motion = makeSpring(0, y => {
      sheet.style.transform = `translate3d(0,${y}px,0)`;
      scrim.style.opacity = String(1 - Math.min(1, Math.max(0, y) / (sheet.offsetHeight + 30)));
    });
    sheet.motion = motion;
    motion.owner = sheet;
    motion.jump(reduceMotion() ? 0 : 48);
    motion.to(0);
    let drag;
    sheet.addEventListener('pointerdown', event => {
      if (event.button > 0 || event.target.closest('button,input,textarea')) return;
      const inHandle = handle.contains(event.target) || sheet.querySelector('header').contains(event.target);
      if (!inHandle && (sheet.scrollTop > 0 || event.pointerType === 'mouse')) return;
      const scale = phone.clientWidth / W;
      drag = { id:event.pointerId, y:event.clientY / scale, x:event.clientX / scale,
        start:motion.value, last:event.clientY / scale, time:performance.now(), speed:0, active:inHandle };
      if (inHandle) {
        motion.stop(); overlay.classList.remove('is-closing');
        sheet.setPointerCapture(event.pointerId);
      }
    });
    sheet.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const scale = phone.clientWidth / W, y = event.clientY / scale;
      const dy = y - drag.y, dx = event.clientX / scale - drag.x;
      if (!drag.active) {
        if (Math.abs(dx) > 7 || dy < -7) { drag = null; return; }
        if (dy < 7) return;
        drag.active = true; motion.stop(); overlay.classList.remove('is-closing');
        sheet.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      const now = performance.now();
      drag.speed = (y - drag.last) / Math.max(8, now - drag.time);
      drag.last = y; drag.time = now;
      const distance = drag.start + dy;
      motion.jump(distance < 0 ? -24 * (1 - Math.exp(distance / 72)) : distance);
    });
    const end = event => {
      if (!drag || drag.id !== event.pointerId) return;
      const last = drag; drag = null;
      if (!last.active) return;
      const speed = performance.now() - last.time < 100 ? last.speed : 0;
      const projected = motion.value + speed * 150;
      const threshold = Math.min(160, sheet.offsetHeight * .3);
      if (event.type !== 'pointercancel' && projected > threshold && speed > -.25) dismissOverlay(speed * 1000);
      else motion.to(0, { velocity:speed * 1000 });
    };
    sheet.addEventListener('pointerup', end); sheet.addEventListener('pointercancel', end);
    sheet.addEventListener('lostpointercapture', end);
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
        const preview = overlay.querySelector('.os7-code-preview');
        preview.querySelector('p').textContent = '演示识别完成 · 鸿蒙智行体验中心';
        overlay.querySelector('[data-scan-demo]').textContent = '重新模拟识别';
        preview.classList.add('scan-complete');
      });
    } else if (label === '个人二维码') {
      componentSheet('个人二维码', `<div class="os7-code-preview">${svg('qr')}<p>个人名片示意<br>此图标不是可识别二维码</p></div><p class="os7-component-note">仅用于验证弹层样式与交互，未包含账号或身份信息。</p>`);
    }
  }
  function openSort(anchor) {
    const overlay = mountOverlay(`<section class="os7-sheet vehicle-sort-sheet" role="dialog" aria-modal="true" aria-label="车型排序"><div class="sheet-handle" aria-hidden="true"></div><header><h2>按住拖动排序</h2><button data-close aria-label="关闭车型排序">×</button></header><div class="vehicle-sort-grid" aria-label="车型顺序"></div><button class="vehicle-sort-reset">恢复默认排序</button><p class="sr-only" aria-live="polite" data-order-status></p></section>`, '车型排序');
    const grid = overlay.querySelector('.vehicle-sort-grid');
    const sync = () => {
      screen.querySelectorAll('.brand-options').forEach(options => {
        const existing = [...options.querySelectorAll('.brand')];
        const selected = existing.find(b=>b.classList.contains('active'))?.textContent || '全部';
        const template = existing[1];
        if (!template) return;
        const buttons = vehicleOrder.map(name => {
          let button = existing.find(b=>b.textContent===name);
          if (!button) { button=template.cloneNode(true); button.textContent=name; button.addEventListener('click',()=>{
            options.querySelectorAll('.brand').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
            const index=[...options.children].indexOf(button);
            options.closest('.tab-panel').querySelectorAll('.feed-card').forEach(card=>card.hidden=index!==0&&Number(card.dataset.brand)!==(index-1)%3);
            button.scrollIntoView({block:'nearest',inline:'nearest'});
          }); }
          button.classList.toggle('active',name===selected);button.setAttribute('aria-pressed',String(name===selected));return button;
        });
        options.replaceChildren(existing[0],...buttons);
      });
    };
    const render = () => {grid.replaceChildren(...vehicleOrder.map(name=>{
      const button=document.createElement('button');button.textContent=name;button.dataset.vehicle=name;
      button.setAttribute('aria-label',`${name}，按住拖动排序，方向键调整位置`);return button;
    }));};
    const move = (name,target) => {
      const from=vehicleOrder.indexOf(name);if(from<0||target<0||target>=vehicleOrder.length||from===target)return;
      vehicleOrder.splice(from,1);vehicleOrder.splice(target,0,name);render();sync();
      overlay.querySelector('[data-order-status]').textContent=`${name} 已移到第 ${target+1} 位`;
    };
    let drag;
    grid.addEventListener('pointerdown',event=>{
      const button=event.target.closest('[data-vehicle]');if(!button||event.button>0)return;
      drag={name:button.dataset.vehicle,x:event.clientX,y:event.clientY};button.classList.add('is-dragging');grid.setPointerCapture(event.pointerId);
    });
    grid.addEventListener('pointermove',event=>{
      if(!drag||Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<9)return;
      event.preventDefault();const target=[...grid.children].find(button=>{const r=button.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;});
      if(target)move(drag.name,vehicleOrder.indexOf(target.dataset.vehicle));
      grid.querySelector(`[data-vehicle="${drag.name}"]`)?.classList.add('is-dragging');
    });
    const end=()=>{drag=null;grid.querySelectorAll('.is-dragging').forEach(b=>b.classList.remove('is-dragging'));};
    grid.addEventListener('pointerup',end);grid.addEventListener('pointercancel',end);
    grid.addEventListener('keydown',event=>{
      const name=event.target.dataset.vehicle,delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3}[event.key];
      if(!name||!delta)return;event.preventDefault();move(name,vehicleOrder.indexOf(name)+delta);grid.querySelector(`[data-vehicle="${name}"]`)?.focus();
    });
    overlay.querySelector('.vehicle-sort-reset').addEventListener('click',()=>{vehicleOrder=[...defaultVehicleOrder];render();sync();overlay.querySelector('[data-order-status]').textContent='已恢复默认排序';});
    render();sync();enableSheetDrag(overlay.querySelector('.os7-sheet'));overlay.querySelector('[data-close]').focus({preventScroll:true});
  }
  function syncFilterChrome(page,activePanel) {
    if(!page.os7Filters||page.hidden)return;
    const scale=page.getBoundingClientRect().width/W;
    if(!scale)return;
    const headerHeight=page.querySelector('.app-header').offsetHeight;
    let docked=false;
    for(const {panel,row,anchor} of page.os7Filters){
      const top=(anchor.getBoundingClientRect().top-page.getBoundingClientRect().top)/scale;
      const pin=panel===activePanel&&top<=headerHeight+.25;
      if(pin){
        docked=true;
        if(!row.classList.contains('is-docked')){
          anchor.style.height=row.offsetHeight+'px';
          row.classList.add('is-docked');page.insertBefore(row,page.querySelector('.tab-viewport'));
        }
      }else if(row.classList.contains('is-docked')){
        row.classList.remove('is-docked');anchor.after(row);anchor.style.height='0px';
      }
    }
    page.classList.toggle('has-docked-filter',docked);
    page.style.setProperty('--chrome-height',(headerHeight+(docked?58:0))+'px');
  }
  function bindEnhancements() {
    screen.querySelectorAll('.discover-page').forEach(page=>{
      if(page.dataset.deviceStructure)return;page.dataset.deviceStructure='true';
      const posts=page.querySelector('[data-panel="1"] .posts');
      if(posts){const wrapper=document.createElement('div');wrapper.innerHTML=feed();const grid=wrapper.firstElementChild;posts.replaceWith(grid);grid.querySelectorAll('.like').forEach(button=>button.addEventListener('click',()=>{const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));const count=button.querySelector('span');if(count)count.textContent=Number(count.textContent)+(active?1:-1);}));}
      page.os7Filters=[...page.querySelectorAll('.brand-filter')].map(row=>{
        const panel=row.closest('.tab-panel'),anchor=document.createElement('div');
        anchor.className='filter-anchor';anchor.setAttribute('aria-hidden','true');row.before(anchor);row.os7Panel=panel;
        // The real row is lifted above the shared backdrop only while docked.
        // Keeping a spacer preserves content, scroll position and existing handlers.
        row.addEventListener('wheel',event=>{
          if(!row.classList.contains('is-docked')||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
          event.preventDefault();panel.scrollTop+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?panel.clientHeight:1);
        },{passive:false});
        let drag;
        row.addEventListener('pointerdown',event=>{if(row.classList.contains('is-docked')&&event.button===0)drag={id:event.pointerId,x:event.clientX,y:event.clientY,scroll:panel.scrollTop};});
        row.addEventListener('pointermove',event=>{
          if(!drag||drag.id!==event.pointerId)return;
          const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
          if(!drag.axis&&Math.hypot(dx,dy)>8)drag.axis=Math.abs(dy)>Math.abs(dx)?'y':'x';
          if(drag.axis!=='y')return;
          event.preventDefault();if(!row.hasPointerCapture(event.pointerId))row.setPointerCapture(event.pointerId);
          panel.scrollTop=drag.scroll-dy/(page.getBoundingClientRect().width/W);
        });
        row.addEventListener('click',event=>{if(drag?.axis==='y'){event.preventDefault();event.stopImmediatePropagation();drag=null;}},true);
        row.addEventListener('pointerup',()=>{if(drag?.axis!=='y')drag=null;});
        row.addEventListener('pointercancel',()=>drag=null);
        return {panel,row,anchor};
      });
      const campaign=page.querySelector('.collection-content');
      if(campaign){campaign.classList.add('device-campaign');campaign.innerHTML=`${search()}<img class="device-campaign-hero" src="./research/20261102/assets/campaign-hero.png" alt="享界V8 家庭智慧旗舰MPV"><section class="device-campaign-more"><h2>参数配置</h2><p>车型内容展示</p><h2>探索更多</h2></section>`;}
      const actions=page.querySelector('.collection-actions');if(actions){actions.children[1].textContent='立即预订';actions.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>showToast('预览模式，未提交预约或订单')));}
    });
    screen.querySelectorAll('.service-grid').forEach(grid=>{
      if(grid.dataset.deviceStructure)return;grid.dataset.deviceStructure='true';
      const labels=['ETC服务','预约服务','道路救援','车险','预约试驾','体验中心','智选购车','金融试算器','我的家充桩','置换服务','尊出行','软件','车主指南'];
      grid.innerHTML=labels.map((label,index)=>`<button style="--service-color:${index%3?'#43b6dd':'#51c7b6'}">${svg(['book','clock','pin','shield','wheel','cube','car','grid','charger','car','people','grid','book'][index])}<span>${label}</span></button>`).join('');
    });
    screen.querySelectorAll('.category-page').forEach(category=>{
      if(category.dataset.currentCategories)return;category.dataset.currentCategories='true';
      const titles=['双11','今日上新','R7专属','新车必备','软件服务','充电补能','车内舒适','数码智能','户外出行','影音娱乐','生活周边','儿童呵护'];
      category.querySelectorAll('.category-body nav button').forEach((button,index)=>button.textContent=titles[index]||'V9专属');
    });
    screen.querySelectorAll('.brand-options').forEach(options=>{
      if(options.dataset.currentVehicleOrder)return;options.dataset.currentVehicleOrder='true';
      options.querySelectorAll('.brand').forEach((button,index)=>{if(index)button.textContent=vehicleOrder[index-1];});
    });
    for (const spring of springs) {
      if (spring.owner && !spring.owner.isConnected) { spring.stop(); springs.delete(spring); }
    }
    screen.querySelectorAll('.main-page,.category-page').forEach(page => {
      if (page.querySelector(':scope > .top-backdrop')) return;
      // A sibling surface can sample scrolling content. A header pseudo-element
      // inside its stacking context cannot reliably sample that backdrop in WebKit/Chromium.
      const backdrop = document.createElement('div'); backdrop.className = 'top-backdrop';
      backdrop.setAttribute('aria-hidden', 'true'); page.append(backdrop);
    });
    screen.querySelectorAll('.main-page').forEach(page => {
      if (page.os7Motion || !page.querySelector('.tab-track')) return;
      const track = page.querySelector('.tab-track');
      const id = page.classList.contains('select-page') ? 'select' : 'discover';
      const motion = makeSpring(-state.channel[id] * W, x => {
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
      motion.owner = page;
      track.style.transition = 'none';
      page.os7Motion = {
        position: () => motion.value,
        grab: () => { motion.stop(); return motion.value; },
        drag: x => motion.jump(Math.max(-3 * W - 48, Math.min(48, x))),
        to: (x, interaction, velocity) => interaction === 'instant' ? motion.jump(x) :
          motion.to(x, { velocity:interaction === 'swipe' ? Math.max(-2500, Math.min(2500, velocity * 1000)) : undefined }),
      };
    });
    screen.querySelectorAll('.channel-tabs').forEach(tabs => {
      if (!tabs.dataset.os7Tabs) {
        tabs.dataset.os7Tabs = 'true';
        tabs.querySelectorAll('.channel-tab').forEach((button,index) => {
          const label = document.createElement('span');
          label.textContent = channels[tabs.closest('.select-page')?'select':'discover'][index];
          button.replaceChildren(label);
        });
        setupHorizontal(tabs);
        tabs.addEventListener('scroll', () => { tabs.dataset.more = String(tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 2); }, { passive: true });
      }
      const selected = tabs.querySelector('[aria-selected="true"]');
      if (tabs.os7Selected !== selected) {
        tabs.os7Selected = selected;
        // Measure after the selected-label emphasis settles.
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
    const updateSurface = page => {
      const scroller = page.querySelector('.tab-panel:not([inert])') || page.querySelector('.plain-scroll,.category-results');
      if (!scroller) return;
      const y = Math.max(0, scroller.scrollTop);
      const t = Math.min(1, y / 120);
      page.style.setProperty('--os7-scroll', String(t * t * (3 - 2 * t)));
      page.classList.toggle('os7-scrolled', y > 8);
      syncFilterChrome(page,scroller);
    };
    screen.querySelectorAll('.main-page,.category-page').forEach(page => {
      if (!page.dataset.os7Surface) {
        page.dataset.os7Surface = 'true';
        page.addEventListener('channelchange', () => updateSurface(page));
      }
      updateSurface(page);
    });
    screen.querySelectorAll('.tab-panel,.plain-scroll,.category-results').forEach(scroller => {
      if (scroller.dataset.os7Scroll) return;
      scroller.dataset.os7Scroll = 'true';
      scroller.addEventListener('scroll', () => {
        const page = scroller.closest('.main-page,.category-page');
        if (!page || scroller.inert) return;
        updateSurface(page);
      }, { passive: true });
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
      button.setAttribute('aria-label','车型排序');
      button.addEventListener('click', () => openSort(button));
    });
    updateReferenceLink();
  }
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return; scheduled = true;
    queueMicrotask(() => { scheduled = false; bindEnhancements(); });
  }).observe(screen, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'aria-selected', 'aria-current'] });
  document.addEventListener('keydown', event => {
    if(window.HimaRoutes?.active())return;
    if (layer?.classList.contains('os7-overlay') && event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); dismissOverlay(); return;
    }
    if (!layer || event.key !== 'Tab') return;
    const elements = [...layer.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),a[href]')].filter(element => element.getClientRects().length);
    if (!elements.length) return;
    if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === elements.at(-1)) { event.preventDefault(); elements[0].focus(); }
  }, true);
  applyPreferences(); bindEnhancements();
})();
