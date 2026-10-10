import {demoArea} from './demo.js?v=0.6.1';
import {outdoorArea} from './outdoor.js?v=0.6.1';
export const areas={[demoArea.id]:demoArea,[outdoorArea.id]:outdoorArea};
export function resolveArea(id){const area=areas[id];if(!area)throw new Error('Unknown area: '+id);return area}
