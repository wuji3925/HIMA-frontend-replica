import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const evidence=path.join(root,'../output/device-research/20261102_hima/screenshots');
const target=path.join(root,'assets/device-20261102');mkdirSync(target,{recursive:true});
// Explicit, reviewed image-only regions; none include account/vehicle identities.
const crops=[
 ['discover-banner','NAV-01_04_asset-audit',50,490,1076,605,'发现首屏轮播1'],
 ['discover-banner-2','NAV-01_05_banner-second-redacted',0,0,1076,605,'发现首屏轮播2，仅保留已裁切的公开活动图片'],
 ['quick-order','NAV-01_04_asset-audit',56,1170,238,250,'立即定购RX'],
 ['quick-ota','NAV-01_04_asset-audit',332,1170,238,250,'OTA入口'],
 ['quick-hot','NAV-01_04_asset-audit',608,1170,238,250,'双11活动入口'],
 ['quick-ai','NAV-01_04_asset-audit',884,1170,238,250,'智能助手'],
 ['select-banner','NAV-02_01_select',0,290,1176,886,'精选座椅活动图，不含顶部工具'],
 ['exclusive-r7','NAV-02_01_select',50,1251,342,342,'R7专属卡'],
 ['exclusive-v9','NAV-02_01_select',418,1251,342,342,'V9专属卡'],
 ['exclusive-rx','NAV-02_01_select',786,1251,342,342,'RX专属卡'],
 ['etc-m-thumb','SEA-02_04_return-results',50,354,238,238,'M系列ETC缩略图'],
 ['etc-rx-thumb','SEA-02_04_return-results',50,718,238,238,'RX系列ETC缩略图'],
 ['etc-m-hero','DET-02_01_product',0,280,1176,820,'M系列ETC详情内容，排除导航与原生页码'],
 ['charger-hero','DET-02_04_charger-image',0,280,1176,820,'家充桩专属主图，保留完整文字宽度'],
 ['charger-gallery','DET-02_05_charger-gallery',0,320,1176,780,'同一家充桩原生第7页，仅提取完整服务对照表及脚注，排除工具覆盖的标题区'],
 ['charger-thumb','SEA-03_02_category',338,478,225,225,'家充桩商品缩略图'],
 ['mirror-thumb','SEA-03_02_category',338,803,225,225,'流媒体后视镜商品缩略图'],
 ['charging-gun-thumb','SEA-03_02_category',338,1128,225,225,'充放电一体枪商品缩略图'],
 ['seat-thumb','SEA-03_02_category',338,1453,225,225,'儿童安全座椅商品缩略图'],
 ['cooler-thumb','SEA-03_02_category',338,1778,225,225,'便携冰箱商品缩略图'],
 ['sunshade-thumb','SEA-03_02_category',338,2103,225,225,'天窗遮阳帘商品缩略图'],
 ['car-model','CAR-01_01_car',50,320,1076,640,'白色M8车模，不含状态数值与控制'],
 ['article-thumb','NAV-01_04_asset-audit',25,1736,550,566,'动态箭头寻车文章缩略图'],
 ['article-cover','DET-01_01_article',155,150,866,680,'同篇文章Hero，保留手机与文字气泡，左右排除导航图标'],
 ['article-body','DET-01_01_article',50,1807,1076,500,'同篇文章正文插图，不含评论工具条'],
 ['store','SVC-01_02_scrolled',50,290,1076,410,'服务门店照片，不含距离地址'],
 ['service-banner','SVC-01_01_service',50,440,1076,605,'充电服务宣传图'],
];
for(const [name,source,x,y,width,height,role] of crops){
 const result=spawnSync('ffmpeg',['-loglevel','error','-y','-i',path.join(evidence,source+'.png'),'-vf',`crop=${width}:${height}:${x}:${y}`,'-frames:v','1','-update','1',path.join(target,name+'.png')],{encoding:'utf8'});
 if(result.status)throw Error(`${name}: ${result.stderr}`);
}
writeFileSync(path.join(target,'manifest.json'),JSON.stringify({date:'2026-11-02',appVersion:'3.0.3.300',items:crops.map(([name,source,x,y,width,height,role])=>({name,source,crop:{x,y,width,height},role,file:name+'.png'}))},null,2)+'\n');
console.log(`Extracted ${crops.length} individually mapped image regions.`);
