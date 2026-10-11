import {demoArea} from './demo.js?v=0.7.0';
import {outdoorArea} from './outdoor.js?v=0.7.0';
import {hozukiArea} from './hozuki.js?v=0.16.0';
export const areas={[demoArea.id]:demoArea,[outdoorArea.id]:outdoorArea,[hozukiArea.id]:hozukiArea};
export function resolveArea(id){const area=areas[id];if(!area)throw new Error('Unknown area: '+id);return area}
