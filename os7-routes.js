// Device evidence: SEA-02_02–05, DET-02_01–03. Demo data, no commerce backend.
(() => {
  const stack=[];
  const historyWords=[];
  const hot=['Mate 90','G9车顶帐篷','ETC','手机','充电桩','香氛','手表','头枕','耳机','车衣','小桌板','麦克风','充电','MagLink','ADS智驾包'];
  const catalog=[
    {title:'隐藏式内置ETC M9/M8/M7/M6专享',price:'499',image:'product-etc2'},
    {title:'隐藏式内置ETC RX/R7/V800/G9/V9专享',price:'499',image:'product-etc1'},
    {title:'华为家充桩 7kW',price:'3800',image:'product-charger'},
    {title:'ADS 高阶功能包',price:'720',image:'product-ads'},
  ];
  const initialURL=new URL(location.href);initialURL.searchParams.delete('view');
  history.replaceState({...history.state,himaDepth:0},'',initialURL);
  let spec;
  function clearSpec(){if(!spec)return;spec.remove();spec=null;const top=stack.at(-1);if(top){top.node.inert=false;top.focus?.focus({preventScroll:true});}}
  function refresh(){
    stack.forEach((entry,index)=>{entry.node.hidden=index!==stack.length-1;entry.node.inert=index!==stack.length-1;});
    host.inert=nav.inert=stack.length>0||Boolean(layer);screen.classList.toggle('has-route',stack.length>0);
    stack.at(-1)?.onResume?.();
    if(!stack.length)stack.trigger?.focus({preventScroll:true});
  }
  function popTo(depth){clearSpec();let focus;while(stack.length>depth){const entry=stack.pop();focus=entry.trigger;entry.node.remove();}refresh();if(focus?.isConnected)focus.focus({preventScroll:true});}
  window.addEventListener('popstate',event=>popTo(event.state?.himaDepth||0));
  function back(){if(spec){clearSpec();return;}if(stack.length)history.back();}
  function route(label,content){
    if(!stack.length)stack.trigger=document.activeElement;
    const node=document.createElement('section');node.className='replica-route';node.setAttribute('role','region');node.setAttribute('aria-label',label);
    node.innerHTML=content;const trigger=document.activeElement;screen.append(node);stack.push({node,trigger});refresh();
    const url=new URL(location.href);url.searchParams.set('view',label.includes('详情')?'product':label.includes('结果')?'results':'search');
    history.pushState({himaDepth:stack.length},'',url);
    node.querySelectorAll('[data-route-back]').forEach(button=>button.addEventListener('click',back));
    return node;
  }
  const header=(title='')=>`<header class="replica-route-header">${status()}<div class="replica-route-bar"><button data-route-back aria-label="返回">${svg('back')}</button>${title}</div></header>`;
  function searchHeader(){return header(`<form class="replica-query">${svg('search')}<input type="search" aria-label="搜索精选商品" autocomplete="off"><button type="submit">搜索</button></form>`);}
  function bindQuery(node,initial=''){
    const input=node.querySelector('input');input.value=initial;
    node.querySelector('form').addEventListener('submit',event=>{event.preventDefault();if(input.value.trim())results(input.value.trim());});
    return input;
  }
  function results(query){
    if(!historyWords.includes(query))historyWords.unshift(query);
    const matches=catalog.filter(item=>item.title.toLowerCase().includes(query.toLowerCase())||(query==='充电桩'&&item.image==='product-charger'));
    const node=route('精选搜索结果',`${searchHeader()}<div class="replica-route-scroll replica-search-results"></div>`);
    bindQuery(node,query);
    const list=node.querySelector('.replica-search-results');
    matches.forEach(item=>{const button=document.createElement('button');button.className='replica-product-result';
      button.innerHTML=`<img src="${asset(item.image)}" alt=""><span><strong></strong><small>¥${item.price}</small></span>`;
      button.querySelector('strong').textContent=item.title;button.addEventListener('click',()=>product(item));list.append(button);
    });
    const end=document.createElement('p');end.className='replica-end';end.textContent=matches.length?'— 没有更多精选了 —':'暂无相关精选';list.append(end);
    node.querySelector('input').blur();
  }
  function openSearch(){
    const node=route('精选搜索',`${searchHeader()}<div class="replica-route-scroll replica-hot"></div>`);
    const input=bindQuery(node),area=node.querySelector('.replica-hot');
    const render=()=>{
      area.replaceChildren();
      if(historyWords.length){const row=document.createElement('div');row.className='replica-history';
        const words=document.createElement('div');historyWords.forEach(word=>{const b=document.createElement('button');b.textContent=word;b.onclick=()=>results(word);words.append(b);});
        const clear=document.createElement('button');clear.textContent='清空';clear.onclick=()=>{historyWords.length=0;render();};row.append(words,clear);area.append(row);
      }
      const title=document.createElement('h2');title.textContent='大家正在搜';const tags=document.createElement('div');tags.className='replica-hot-tags';
      hot.forEach(word=>{const button=document.createElement('button');button.textContent=word;button.onclick=()=>{input.blur();results(word);};tags.append(button);});area.append(title,tags);
    };
    stack.at(-1).onResume=render;render();input.focus({preventScroll:true});
  }
  function product(item){
    const node=route('精选商品详情',`${header('<span class="replica-product-nav" hidden>商品详情</span>')}<div class="replica-route-scroll replica-product-body"><div class="replica-gallery" aria-label="商品图集">${[item.image,'product-etc1',item.image].map((name,index)=>`<img src="${asset(name)}" alt="商品展示 ${index+1}" draggable="false">`).join('')}</div><div class="replica-gallery-dots"><i class="active"></i><i></i><i></i></div><section class="replica-product-info"><h1></h1><div class="replica-price">¥${item.price}<small>最多可使用积分抵扣</small></div><div class="replica-benefits"><span>内置美观</span><span>无需安装</span><span>长期有效</span><span>支持微信扣费</span></div><button class="replica-fact" data-spec><small>已选</small><span>一次性购买</span>${svg('chevron')}</button><button class="replica-fact" data-service><small>服务</small><span>使用提示：购买完成后需先激活再上车使用</span>${svg('chevron')}</button><details><summary>适配车型</summary><p>M9、M8、M7、M6等，以商品支持范围为准。</p></details></section><section class="replica-product-description"><h2>商品介绍</h2><img src="${asset(item.image)}" alt="商品介绍"><h2>使用与服务</h2><p>此处展示商品详情内容。购买前请确认车型与服务适用范围。</p></section></div><footer class="replica-purchase"><button data-spec>立即购买</button></footer>`);
    node.querySelector('h1').textContent=item.title;
    node.querySelectorAll('[data-spec]').forEach(button=>button.onclick=()=>openSpec(node,item,button));
    node.querySelector('[data-service]').onclick=()=>{node.querySelector('.replica-product-description').scrollIntoView({behavior:bodyMotion()?'smooth':'instant',block:'start'});};
    const gallery=node.querySelector('.replica-gallery');
    setupHorizontal(gallery);
    gallery.addEventListener('scroll',()=>{const index=Math.round(gallery.scrollLeft/gallery.clientWidth);node.querySelectorAll('.replica-gallery-dots i').forEach((dot,i)=>dot.classList.toggle('active',i===index));},{passive:true});
    node.querySelector('.replica-product-body').addEventListener('scroll',event=>node.classList.toggle('route-scrolled',event.target.scrollTop>180),{passive:true});
  }
  const bodyMotion=()=>document.body.dataset.motion!=='reduce';
  function article(card){
    const title=card.querySelector('.feed-body>p')?.textContent||'智行日常';
    const photo=card.querySelector('img')?.getAttribute('src')||asset('discover-banner');
    const node=route('发现内容详情',`${header('<span>内容详情</span>')}<div class="replica-route-scroll replica-article-scroll"><img class="replica-article-cover" alt="内容配图"><section class="replica-article-body"><h1></h1><p class="replica-article-summary">记录智行生活，分享每一程的发现。</p><div class="replica-author"><span>智行体验官</span><button data-follow aria-pressed="false">关注</button></div><p>从出发前的准备，到旅途中的点滴，每一段经历都值得被记录。这里展示文章正文，用于体验内容阅读、滚动和返回。</p><p>图片与文字共同组成长内容，顶部导航随内容重叠保持清晰，底部互动区域固定在安全范围内。</p><img class="replica-article-inline" alt="正文配图"><h2 id="replica-comments">评论</h2><div class="replica-comments"><p>一起分享你的智行故事。</p></div></section></div><footer class="replica-article-actions"><button class="replica-write">写评论…</button><button data-like aria-label="点赞" aria-pressed="false">${svg('thumb')}<span>21</span></button><button data-save aria-label="收藏" aria-pressed="false">${svg('star')}<span>10</span></button><button data-comments aria-label="查看评论">${svg('comment')}<span>28</span></button></footer>`);
    node.querySelector('h1').textContent=title;node.querySelectorAll('.replica-article-cover,.replica-article-inline').forEach(image=>image.src=photo);
    ['like','save','follow'].forEach(kind=>node.querySelector(`[data-${kind}]`).onclick=event=>{const button=event.currentTarget;const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));const count=button.querySelector('span');if(count)count.textContent=Number(count.textContent)+(active?1:-1);if(kind==='follow')button.textContent=active?'已关注':'关注';});
    node.querySelector('[data-comments]').onclick=()=>node.querySelector('#replica-comments').scrollIntoView({behavior:bodyMotion()?'smooth':'instant'});
    node.querySelector('.replica-write').onclick=()=>{
      const saved=node.querySelector('.replica-comment-form');if(saved){saved.hidden=false;saved.querySelector('textarea').focus();return;}
      const form=document.createElement('form');form.className='replica-comment-form';form.innerHTML='<label>本页评论草稿<textarea aria-label="评论草稿" maxlength="300" placeholder="写下你的想法…"></textarea></label><button type="submit">保留草稿</button><button type="button">取消</button><p>仅本页演示，不会发布</p>';
      node.append(form);form.onsubmit=event=>{event.preventDefault();form.hidden=true;node.querySelector('.replica-write').textContent='草稿已保留';};form.querySelector('[type=button]').onclick=()=>form.remove();form.querySelector('textarea').focus();
    };
  }
  function openSpec(parent,item,trigger){
    if(spec)return;stack.at(-1).focus=trigger;parent.inert=true;
    spec=document.createElement('div');spec.className='replica-spec-overlay';spec.innerHTML=`<div class="replica-spec-scrim"></div><section class="replica-spec" role="dialog" aria-modal="true" aria-label="选择商品规格"><button class="replica-spec-close" aria-label="关闭商品规格">×</button><div class="replica-spec-heading"><img src="${asset(item.image)}" alt=""><div><strong>¥${item.price}</strong><p></p></div></div><div class="replica-selected">已选：一次性购买</div><h2>规格</h2><button class="replica-sku" aria-pressed="true">一次性购买</button><div class="replica-demo-car">演示车辆 <span>未关联真实车辆</span></div><p class="replica-purchase-note" role="status">交互预览，不会创建订单或扣费</p><button class="replica-buy-confirm">立即购买</button></section>`;
    spec.querySelector('.replica-spec-heading p').textContent=item.title;screen.append(spec);
    spec.querySelector('.replica-spec-close').onclick=clearSpec;spec.querySelector('.replica-spec-scrim').onclick=clearSpec;
    spec.querySelector('.replica-buy-confirm').onclick=()=>{spec.querySelector('.replica-purchase-note').textContent='已到达购买演示边界，未提交订单';};
    spec.querySelector('.replica-spec-close').focus({preventScroll:true});
  }
  document.addEventListener('keydown',event=>{if(!stack.length)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();const form=stack.at(-1).node.querySelector('.replica-comment-form:not([hidden])');if(form){form.hidden=true;return;}back();}
    if(event.key==='Tab'){const root=spec||stack.at(-1).node;const elements=[...root.querySelectorAll('button,input,summary,[href]')].filter(e=>!e.disabled&&e.getClientRects().length);if(event.shiftKey&&document.activeElement===elements[0]){event.preventDefault();elements.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===elements.at(-1)){event.preventDefault();elements[0]?.focus();}}
  },true);
  screen.addEventListener('click',event=>{if(stack.length)return;
    if(state.main==='discover'&&!event.target.closest('button')){const card=event.target.closest('.feed-card');if(card){article(card);return;}}
    if(state.main!=='select')return;const card=event.target.closest('.product');if(!card)return;
    const image=card.querySelector('img'),title=card.querySelector('p')?.textContent;
    product(catalog.find(item=>title?.includes('ETC')&&item.image===image?.getAttribute('src')?.split('/').at(-1)?.replace('.jpg',''))||catalog.find(item=>item.title.includes(title?.replace('…','')||'---'))||{title:title||catalog[0].title,price:card.querySelector('span')?.textContent.replace('¥','')||'499',image:image?.getAttribute('src')?.split('/').at(-1)?.replace('.jpg','')||'product-etc1'});
  });
  function bindCards(){screen.querySelectorAll('.product,.feed-card').forEach(card=>{
    if(card.dataset.routeCard)return;card.dataset.routeCard='true';card.tabIndex=0;card.setAttribute('role','link');
    card.addEventListener('keydown',event=>{if(event.target===card&&event.key==='Enter'){event.preventDefault();card.click();}});
  });}
  new MutationObserver(bindCards).observe(host,{childList:true,subtree:true});bindCards();
  window.HimaRoutes={openSearch,active:()=>stack.length>0};
})();
