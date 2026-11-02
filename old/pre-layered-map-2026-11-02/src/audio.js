// Shared music and dialogue synthesis. No per-line audio files.
const VOICES={
 child:{pitch:470,shape:'triangle',gain:.042,cut:1600,speed:65},
 woman:{pitch:330,shape:'sine',gain:.056,cut:1450,speed:75},
 man:{pitch:210,shape:'triangle',gain:.042,cut:900,speed:82},
 elder:{pitch:235,shape:'sawtooth',gain:.018,cut:620,speed:112},
 enemy:{pitch:170,shape:'sawtooth',gain:.020,cut:740,speed:75},
 boss:{pitch:125,shape:'triangle',gain:.054,cut:490,speed:115}
};
const audioPaths={village:'./assets/audio/hozuki_village_v13.ogg?v=20261015',field:'./assets/audio/field_journey_v10.ogg?v=20261015'};
const intro={village:4.8,field:7.74193548};
function voiceFor(text){if(/村長|長老|老人/.test(text))return 'elder';if(/子供|こども|ぼく|あそぼ/.test(text))return 'child';if(/ボス|魔王|大鬼/.test(text))return 'boss';if(/敵|悪鬼/.test(text))return 'enemy';if(/女|おかみ/.test(text))return 'woman';return 'man'}
const vowels=['あかがさざただなはばぱまやらわぁゃ','いきぎしじちぢにひびぴみりぃ','うくぐすずつづぬふぶぷむゆるぅゅ','えけげせぜてでねへべぺめれぇ','おこごそぞとどのほぼぽもよろをぉょ'];
function vowelOf(char){if(char==='ん'||char==='ン')return -1;const cp=char.codePointAt(0);if(cp>=0x30a1&&cp<=0x30f6)char=String.fromCodePoint(cp-0x60);for(let i=0;i<5;i++)if(vowels[i].includes(char))return i;return 2}
export function createGameAudio(){
 let ctx,musicGain,fxGain,current=null,selected=null,mute=false,started=false;
 const buffers=new Map();let dialogueSerial=0,voiceEnabled=true;
 function init(){if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();musicGain=ctx.createGain();musicGain.gain.value=.34;musicGain.connect(ctx.destination);fxGain=ctx.createGain();fxGain.gain.value=.8;fxGain.connect(ctx.destination);}return ctx;}
 async function unlock(){try{init();await ctx.resume();started=true;if(selected)await setArea(selected);return true}catch(error){console.warn('Audio unlock:',error);return false}}
 async function load(which){if(buffers.has(which))return buffers.get(which);const res=await fetch(audioPaths[which]);if(!res.ok)throw Error('BGM HTTP '+res.status);const data=await res.arrayBuffer();const sound=await init().decodeAudioData(data);buffers.set(which,sound);return sound}
 async function setArea(areaId){const which=areaId==='hozuki-village'?'village':'field';selected=which;if(!started||mute||current?.name===which)return;
  let sound;try{sound=await load(which)}catch(e){console.warn('BGM load failed:',e);return}
  if(selected!==which||mute)return;
  const at=ctx.currentTime;const old=current;const gain=ctx.createGain();gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.85,at+.65);gain.connect(musicGain);
  const source=ctx.createBufferSource();source.buffer=sound;source.loop=true;source.loopStart=Math.min(intro[which],sound.duration-.15);source.loopEnd=sound.duration;source.connect(gain);source.start(at);
  current={name:which,source,gain};
  if(old){old.gain.gain.cancelScheduledValues(at);old.gain.gain.setTargetAtTime(0,at,.16);try{old.source.stop(at+1)}catch{}}
 }
 function setMuted(value){mute=!!value; if(ctx){const t=ctx.currentTime;musicGain.gain.setTargetAtTime(mute?0:.34,t,.08);fxGain.gain.setTargetAtTime(mute?0:.8,t,.08)}return mute}
 function tone(char,index,preset){if(!ctx||mute||!voiceEnabled)return;const v=VOICES[preset]||VOICES.man;const now=ctx.currentTime;const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();const nasal=vowelOf(char)<0;const pitch=v.pitch*(nasal?.67:([1.10,1.14,.93,1.02,.83][vowelOf(char)]))*(1+((index%5)-2)*.016);const dur=nasal?.115:.080;
  o.type=nasal?'triangle':v.shape;o.frequency.setValueAtTime(Math.max(50,pitch),now);o.frequency.exponentialRampToValueAtTime(Math.max(50,pitch*.92),now+dur);f.type='lowpass';f.frequency.value=nasal?Math.min(600,v.cut*.52):v.cut;f.Q.value=.35;
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(v.gain,now+.012);g.gain.setTargetAtTime(0,now+.040,.015);o.connect(f).connect(g).connect(fxGain);o.start(now);o.stop(now+dur+.075);
 }
 function effect(type){if(!ctx||mute)return;const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';const base=type==='obtain'?660:type==='action'?430:320;osc.frequency.setValueAtTime(base,now);osc.frequency.exponentialRampToValueAtTime(type==='obtain'?990:Math.max(180,base*.7),now+.11);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.047,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+.18);osc.connect(gain).connect(fxGain);osc.start(now);osc.stop(now+.19)}
 function speak(text,display,preset){dialogueSerial++;const serial=dialogueSerial;const voice=preset||voiceFor(text);const chars=[...String(text||'')];display.textContent='';if(ctx)musicGain.gain.setTargetAtTime(.19,ctx.currentTime,.18);
  let i=0;const step=()=>{if(serial!==dialogueSerial)return;if(i>=chars.length){if(ctx)musicGain.gain.setTargetAtTime(.34,ctx.currentTime,.26);return}
   const c=chars[i];display.textContent+=c;if(/[ぁ-ゖァ-ヺー]/.test(c))tone(c,i,voice);i++;setTimeout(step,/[。！？!?]/.test(c)?180:/[、，]/.test(c)?120:(VOICES[voice]||VOICES.man).speed)};step();
 }
 function cancel(){dialogueSerial++;if(ctx)musicGain.gain.setTargetAtTime(.34,ctx.currentTime,.15)}
 return {unlock,setArea,setMuted,effect,speak,cancel,setVoiceEnabled:b=>voiceEnabled=!!b};
}
