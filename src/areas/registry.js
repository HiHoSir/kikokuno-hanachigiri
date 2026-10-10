import {demoArea} from './demo.js';
import {outdoorArea} from './outdoor.js';
export const areas={[demoArea.id]:demoArea,[outdoorArea.id]:outdoorArea};
export function resolveArea(id){const area=areas[id];if(!area)throw new Error('Unknown area: '+id);return area}
