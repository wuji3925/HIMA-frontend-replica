import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const sources = path.join(root, '..', '鸿蒙智行截图');
// Crop coordinates use the 392px-wide reference canvas. Only promotional images,
// photos and individual image icons are extracted; navigation and UI are DOM.
const crops = [
  ['discover-banner',128,16,163,359,202], ['discover-banner-2',129,16,88,359,202],
  ['quick-order',128,16,390,84,84], ['quick-ota',128,109,390,84,84],
  ['quick-hot',128,202,390,84,84], ['quick-ai',128,293,390,84,84],
  ['feed-launch',130,8,348,184,245], ['feed-charge',130,202,348,182,139],
  ['feed-m8',130,202,593,182,138], ['feed-autumn',131,8,213,184,96], ['feed-black',131,8,415,184,245],
  ['select-banner',133,0,96,392,296],
  ['product-m7',134,16,211,115,115], ['product-m8',134,139,211,115,115], ['product-m9',134,263,211,115,115],
  ['product-etc1',134,17,397,175,175], ['product-etc2',134,202,397,174,175],
  ['product-charger',134,17,639,175,127], ['product-ads',134,202,639,174,127],
  ['car-model',136,0,218,392,233],
  ['service-banner',138,16,146,359,202], ['store',139,16,98,359,209],
  ['profile-avatar',140,29,122,50,50],
  ['status-apps',128,49,11,101,18], ['status-network',128,189,11,153,18],
  ['nav-discover',133,26,777,27,28], ['nav-discover-active',128,26,777,27,28],
  ['nav-select',128,104,777,27,28], ['nav-select-active',133,104,777,27,28],
  ['nav-car',128,182,777,28,28], ['nav-car-active',136,182,777,28,28],
  ['nav-service',128,260,777,29,28], ['nav-service-active',138,260,777,29,28],
  ['nav-mine',128,339,777,28,28], ['nav-mine-active',140,339,777,28,28],
];
for (const [name,id,x,y,w,h] of crops) {
  const file = readdirSync(sources).find(file => file.includes(`_${id}_`));
  const result = spawnSync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-i',path.join(sources,file),'-vf',`crop=${w*3}:${h*3}:${x*3}:${y*3}`,'-frames:v','1',path.join(root,'assets/reference',`${name}.jpg`)], {encoding:'utf8'});
  if (result.status) throw new Error(`${name}: ${result.stderr}`);
}
console.log(`Extracted ${crops.length} source image assets.`);
