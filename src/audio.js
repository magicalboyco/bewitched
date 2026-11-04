// Original, low-volume whimsigoth score and puzzle sound design.
// All notes are synthesized locally with Web Audio; no copyrighted recordings.
const MUTE_KEY = 'bewitched-muted';
const MUSIC_KEY = 'bewitched-music-enabled';
const VOLUME_KEY = 'bewitched-music-volume';
class AudioEngine {
  constructor(){
    this.ctx=null;this.master=null;this.fxBus=null;this.musicBus=null;
    this.ambient=null;
    try{
      this.muted=localStorage.getItem(MUTE_KEY)==='1';
      this.musicEnabled=localStorage.getItem(MUSIC_KEY)!=='0';
      this.musicVolume=Number(localStorage.getItem(VOLUME_KEY)??'0.44');
      if(!Number.isFinite(this.musicVolume))this.musicVolume=.44;
      this.musicVolume=Math.max(0,Math.min(1,this.musicVolume));
    }catch{this.muted=false;this.musicEnabled=true;this.musicVolume=.44;}
  }
  ensure(){
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return;
    if(!this.ctx){
      this.ctx=new Context();this.master=this.ctx.createGain();
      this.master.gain.value=this.muted?0:.8;
      this.fxBus=this.ctx.createGain();this.fxBus.gain.value=.26;
      this.musicBus=this.ctx.createGain();
      this.musicBus.gain.value=this.musicEnabled?this.musicVolume*.22:0;
      this.fxBus.connect(this.master);this.musicBus.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
  }
  setMuted(value){
    this.muted=!!value;
    if(this.ctx)this.master.gain.setTargetAtTime(this.muted?0:.8,this.ctx.currentTime,.05);
    try{localStorage.setItem(MUTE_KEY,this.muted?'1':'0');}catch{}
  }
  toggleMuted(){this.setMuted(!this.muted);return this.muted;}
  setMusicEnabled(value){
    this.musicEnabled=!!value;
    if(this.ctx)this.musicBus.gain.setTargetAtTime(this.musicEnabled?this.musicVolume*.22:0,this.ctx.currentTime,.12);
    try{localStorage.setItem(MUSIC_KEY,this.musicEnabled?'1':'0');}catch{}
  }
  toggleMusic(){this.setMusicEnabled(!this.musicEnabled);return this.musicEnabled;}
  setMusicVolume(value){
    const n=Number(value);
    this.musicVolume=Math.max(0,Math.min(1,Number.isFinite(n)?n:.44));
    if(this.ctx)this.musicBus.gain.setTargetAtTime(this.musicEnabled?this.musicVolume*.22:0,this.ctx.currentTime,.08);
    try{localStorage.setItem(VOLUME_KEY,String(this.musicVolume));}catch{}
  }
  _note(freq,{start=0,length=.3,gain=.1,kind='sine',bus='fx',attack=.02}={}){
    if(!this.ctx)return;
    const when=this.ctx.currentTime+Math.max(0,start);
    const o=this.ctx.createOscillator(),env=this.ctx.createGain();
    const filter=this.ctx.createBiquadFilter();
    filter.type='lowpass';filter.frequency.value=kind==='triangle'?1500:2300;
    o.type=kind;o.frequency.value=freq;
    env.gain.setValueAtTime(.0001,when);
    env.gain.linearRampToValueAtTime(gain,when+Math.min(attack,length*.33));
    env.gain.exponentialRampToValueAtTime(.0001,when+length);
    o.connect(filter);filter.connect(env);
    env.connect(bus==='music'?this.musicBus:this.fxBus);
    o.start(when);o.stop(when+length+.035);
  }
  playSwap(){this.ensure();this._note(520,{length:.11,gain:.095,kind:'triangle'});this._note(720,{start:.045,length:.15,gain:.085});}
  playInvalid(){this.ensure();this._note(220,{length:.12,gain:.08,kind:'triangle'});}
  playMatch(combo=1){
    this.ensure();
    const base=523.25*Math.pow(2,Math.min(4,combo-1)/12);
    [1,1.25,1.5].forEach((ratio,i)=>this._note(base*ratio,{start:i*.067,length:.26,gain:.09,kind:i?'sine':'triangle'}));
  }
  playPower(){this.ensure();[392,523.25,659.25,880].forEach((f,i)=>this._note(f,{start:i*.065,length:.38,gain:.12,kind:'triangle'}));}
  playShuffle(){this.ensure();[523,440,392].forEach((f,i)=>this._note(f,{start:i*.065,length:.19,gain:.055}));}
  playHint(){this.ensure();[784,988].forEach((f,i)=>this._note(f,{start:i*.13,length:.35,gain:.055}));}
  playLevelUp(){this.ensure();[392,493.88,587.33,783.99].forEach((f,i)=>this._note(f,{start:i*.12,length:.48,gain:.11,kind:'triangle'}));}
  playGameOver(){this.ensure();[440,392,329.63].forEach((f,i)=>this._note(f,{start:i*.2,length:.48,gain:.06}));}

  // A deliberate, slow 4-bar progression: Am(add9), Fmaj7, Cmaj7, G(add9).
  // Repeating melody has phrasing and silence rather than random notes.
  // One phrase is 16 seconds at ~60 BPM.
  _schedulePhrase(phraseStart,barIndex){
    const chords=[
      [110,164.81,220,246.94],
      [87.31,130.81,174.61,220],
      [130.81,164.81,196,246.94],
      [98,146.83,196,220]
    ];
    const melodies=[
      [[0.5,659.25],[2.25,587.33]],
      [[.75,523.25],[2.75,440]],
      [[.25,493.88],[2.0,523.25],[3.0,587.33]],
      [[.75,440],[2.5,392]]
    ];
    // Timed by AudioContext to avoid rhythmic drift.
    const delay=phraseStart-this.ctx.currentTime;
    chords[barIndex].forEach((f,i)=>{
      this._note(f,{start:delay,length:3.8,gain:i===0?.028:.019,attack:1.1,kind:'sine',bus:'music'});
      if(i>0)this._note(f*2,{start:delay+.06,length:3.3,gain:.009,attack:1.0,kind:'triangle',bus:'music'});
    });
    melodies[barIndex].forEach(([beat,f])=>{
      this._note(f,{start:delay+beat,length:1.25,gain:.053,attack:.045,kind:'sine',bus:'music'});
      this._note(f*2,{start:delay+beat+.02,length:.76,gain:.012,attack:.025,kind:'triangle',bus:'music'});
    });
  }
  startAmbient(){
    this.ensure();if(!this.ctx||this.ambient)return;
    this.musicBus.gain.setTargetAtTime(this.musicEnabled?this.musicVolume*.22:0,this.ctx.currentTime,.12);
    let next=this.ctx.currentTime+.08,bar=0;
    const schedule=()=>{
      if(!this.ctx||!this.ambient)return;
      while(next<this.ctx.currentTime+4.5){
        this._schedulePhrase(next,bar);
        next+=4;bar=(bar+1)%4;
      }
    };
    this.ambient={interval:null};
    schedule();
    this.ambient.interval=setInterval(schedule,500);
  }
  stopAmbient(){
    if(!this.ambient)return;
    clearInterval(this.ambient.interval);
    this.ambient=null;
    if(this.ctx)this.musicBus.gain.setTargetAtTime(0,this.ctx.currentTime,.25);
  }
}
export const audio=new AudioEngine();
