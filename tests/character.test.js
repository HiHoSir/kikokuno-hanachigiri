import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateCharacter} from '../src/map/renderer.js';
const original=()=>JSON.parse(fs.readFileSync(new URL('../assets/characters/hizuki-v35/character.json',import.meta.url)));
test('replacement character cannot contain an empty walking or directional idle animation',()=>{
 for(const change of [c=>c.animations.walk={front_right:[]},c=>c.animations.idle.front_right=[],c=>c.anchor=[200,100],c=>c.animations.idle.default[0].durationMs=0]){
  const c=original();change(c);assert.throws(()=>validateCharacter(c));
 }
 assert.equal(validateCharacter(original()).id,'hizuki-v35-normal');
});
