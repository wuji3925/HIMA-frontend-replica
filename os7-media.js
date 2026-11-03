// Explicit media ownership. Unknown gallery pages are omitted, never borrowed.
(() => {
  const url=name=>`./assets/device-20261102/${name}.png`;
  const products=[
    {id:'etc-m',image:'product-etc2',title:'隐藏式内置ETC M9/M8/M7/M6专享',price:'499',thumb:url('etc-m-thumb'),gallery:[url('etc-m-hero')],sku:'一次性购买',service:'使用提示：购买完成后需先激活再上车使用',fit:'M9、M8、M7、M6',benefits:['内置美观','无需安装','长期有效','支持微信扣费']},
    {id:'etc-rx',image:'product-etc1',title:'隐藏式内置ETC RX/R7/V800/G9/V9专享',price:'499',thumb:url('etc-rx-thumb'),gallery:[url('etc-rx-thumb')],sku:'一次性购买',service:'使用提示：购买完成后需先激活再上车使用',fit:'RX、R7、V800、G9、V9',benefits:['内置美观','无需安装','长期有效']},
    {id:'charger',image:'product-charger',title:'华为家充桩 7kW',price:'3800',thumb:url('charger-thumb'),gallery:[url('charger-hero'),url('charger-gallery')],sku:'0米挂装包＋上门安装＋4年流量',service:'已满48元包邮',fit:'全系车型',benefits:['3C认证','原厂正品','免费勘测','全国上门安装']},
    {id:'ads',image:'product-ads',title:'ADS 高阶功能包',price:'720',thumb:asset('product-ads'),gallery:[asset('product-ads')],sku:'功能包',service:'使用前请确认车辆支持范围',fit:'以车辆功能支持范围为准',benefits:[],provenance:'历史截图134，非本轮实时运营内容'},
    {id:'mirror',title:'流媒体后视镜 适配R7',price:'2299',thumb:url('mirror-thumb'),gallery:[url('mirror-thumb')],sku:'R7适配款',fit:'R7',benefits:[]},
    {id:'charging-gun',title:'充放电一体枪 适配全系',price:'1280',thumb:url('charging-gun-thumb'),gallery:[url('charging-gun-thumb')],sku:'全系适配款',fit:'全系车型',benefits:[]},
    {id:'seat',title:'鸿蒙智行儿童安全座椅',price:'2899',thumb:url('seat-thumb'),gallery:[url('seat-thumb')],sku:'默认款',fit:'以商品适配范围为准',benefits:[]},
    {id:'cooler',title:'便携移动冰箱 适配全系',price:'908',thumb:url('cooler-thumb'),gallery:[url('cooler-thumb')],sku:'默认款',fit:'全系车型',benefits:[]},
    {id:'sunshade',title:'天窗遮阳帘 适配Z7/Z7T',price:'188',thumb:url('sunshade-thumb'),gallery:[url('sunshade-thumb')],sku:'Z7/Z7T适配款',fit:'Z7、Z7T',benefits:[]},
  ];
  const byLegacy=new Map(products.filter(p=>p.image).map(p=>[p.image,p]));
  const imageMap=Object.fromEntries(['discover-banner','discover-banner-2','quick-order','quick-ota','quick-hot','quick-ai','select-banner','car-model','service-banner','store'].map(name=>[name,url(name)]));
  imageMap['feed-launch']=url('article-thumb');
  function bind(){
    screen.querySelectorAll('img').forEach(image=>{
      const key=image.dataset.legacyMedia||image.getAttribute('src')?.match(/\/([^/]+)\.jpg(?:\?.*)?$/)?.[1];
      if(!key)return;image.dataset.legacyMedia=key;
      if(imageMap[key]&&image.getAttribute('src')!==imageMap[key])image.src=imageMap[key];
    });
    screen.querySelectorAll('.product').forEach(card=>{
      if(card.dataset.productId)return;
      const image=card.querySelector('img'),item=byLegacy.get(image?.dataset.legacyMedia);
      if(!item)return;card.dataset.productId=item.id;image.src=item.thumb;image.alt=item.title;
      card.querySelector('p').textContent=item.title;card.querySelector('span').textContent=`¥${item.price}`;
    });
    screen.querySelectorAll('.product-rail').forEach(rail=>{
      if(rail.dataset.mediaMapped)return;rail.dataset.mediaMapped='true';
      const entries=[['r7','R7'],['v9','V9'],['rx','RX']];
      [...rail.children].forEach((button,index)=>{if(!entries[index]){button.remove();return;}const [key,label]=entries[index];button.setAttribute('aria-label',label+'专属');const image=button.querySelector('img');image.src=url('exclusive-'+key);image.alt=label+'专属';});
    });
    screen.querySelectorAll('.category-page .category-results').forEach(results=>{
      if(results.dataset.mediaMapped)return;results.dataset.mediaMapped='true';
      results.querySelectorAll('.products').forEach(grid=>grid.remove());
      const grid=document.createElement('div');grid.className='products';
      ['charger','mirror','charging-gun','seat','cooler','sunshade'].forEach(id=>{const item=products.find(p=>p.id===id),card=document.createElement('article');card.className='product';card.dataset.productId=id;card.tabIndex=0;card.setAttribute('role','link');card.innerHTML=`<img src="${item.thumb}" alt="${item.title}"><p>${item.title}</p><span>¥${item.price}</span>`;card.onkeydown=event=>{if(event.key==='Enter'&&event.target===card){event.preventDefault();card.click();}};grid.append(card);});results.append(grid);
    });
    screen.querySelectorAll('.feed-card').forEach(card=>{
      const image=card.querySelector('img');if(image?.dataset.legacyMedia!=='feed-launch'||card.dataset.articleId)return;
      card.dataset.articleId='arrow-finding';card.querySelector('.feed-body>p').textContent='App功能介绍第23期：动态箭头寻车';
    });
  }
  window.HimaMedia={url,products,byId:id=>products.find(item=>item.id===id),article:{id:'arrow-finding',cover:url('article-cover'),body:url('article-body')},bind};
  new MutationObserver(bind).observe(screen,{childList:true,subtree:true});bind();
})();
