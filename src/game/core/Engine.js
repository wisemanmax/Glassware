// =============================================================================
//  Engine — Three.js renderer, camera, lighting, postprocessing, RAF loop,
//  screen-shake, and a small WebAudio SFX synth (no binary audio assets).
// =============================================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Vignette + subtle color-grade (slime-tinted shadows) as a final pass.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignette: { value: 1.15 },
    tint: { value: new THREE.Color(0x9dff3c) },
    tintAmt: { value: 0.06 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float vignette; uniform vec3 tint; uniform float tintAmt;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      float v = smoothstep(0.85, 0.35, length(d) * vignette);
      c.rgb *= mix(0.55, 1.0, v);
      float luma = dot(c.rgb, vec3(0.299,0.587,0.114));
      c.rgb = mix(c.rgb, tint * luma, tintAmt);
      gl_FragColor = c;
    }`,
};

export class Engine {
  constructor() {
    this.canvas = document.getElementById('gl');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07070b);
    this.scene.fog = new THREE.FogExp2(0x07070b, 0.012);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    this.camera.position.set(0, 9, 12);
    this.camera.lookAt(0, 1, 0);

    this._setupLights();
    this._setupComposer();

    this.clock = new THREE.Clock();
    this.updaters = new Set();
    this.shake = 0;
    this._baseCam = new THREE.Vector3();
    this._baseBloom = 0.55;
    this._hitStop = 0;

    this._initAudio();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  _setupLights() {
    const amb = new THREE.AmbientLight(0x404060, 1.1);
    this.scene.add(amb);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(6, 14, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1; key.shadow.camera.far = 60;
    const s = 24; const c = key.shadow.camera;
    c.left = -s; c.right = s; c.top = s; c.bottom = -s; c.updateProjectionMatrix();
    this.scene.add(key);
    this.keyLight = key;
    // slime rim
    const rim = new THREE.DirectionalLight(0x9dff3c, 0.5);
    rim.position.set(-8, 6, -6);
    this.scene.add(rim);
    // magenta fill
    const fill = new THREE.PointLight(0xff2d8b, 0.6, 60);
    fill.position.set(-6, 5, 8);
    this.scene.add(fill);
  }

  _setupComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 0.85);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  addUpdater(fn) { this.updaters.add(fn); return () => this.updaters.delete(fn); }

  doShake(amount = 0.4) { this.shake = Math.min(1.2, this.shake + amount); }
  pulseBloom(amount = 0.9) { this.bloom.strength = Math.min(2.2, this.bloom.strength + amount); }
  hitStop(ms = 70) { this._hitStop = Math.max(this._hitStop, ms / 1000); }

  start() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      let dt = Math.min(0.05, this.clock.getDelta());
      // brief hit-stop freeze for crunch on big hits
      if (this._hitStop > 0) { this._hitStop -= dt; dt *= 0.08; }
      // bloom pulse decay back to base
      if (this.bloom.strength > this._baseBloom) this.bloom.strength = Math.max(this._baseBloom, this.bloom.strength - dt * 3.2);
      this.updaters.forEach((fn) => fn(dt));
      // screen shake applied to camera
      if (this.shake > 0.001) {
        this._baseCam.copy(this.camera.position);
        const s = this.shake;
        this.camera.position.x += (Math.random() - 0.5) * s;
        this.camera.position.y += (Math.random() - 0.5) * s;
        this.composer.render();
        this.camera.position.copy(this._baseCam);
        this.shake *= 0.82;
      } else {
        this.composer.render();
      }
    };
    loop();
  }

  // ---- WebAudio SFX synth --------------------------------------------------
  _initAudio() {
    this.audioOk = false;
    const resume = () => {
      if (!this.actx) { try { this.actx = new (window.AudioContext || window.webkitAudioContext)(); this.audioOk = true; } catch (e) {} }
      if (this.actx?.state === 'suspended') this.actx.resume();
    };
    window.addEventListener('pointerdown', resume, { once: false });
    window.addEventListener('keydown', resume, { once: false });
  }

  _tone(freq, dur, type = 'square', gain = 0.12, slideTo = null) {
    if (!this.actx) return;
    const t = this.actx.currentTime;
    const o = this.actx.createOscillator();
    const g = this.actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.actx.destination);
    o.start(t); o.stop(t + dur);
  }

  sfx(name) {
    switch (name) {
      case 'move': this._tone(420, 0.05, 'square', 0.05); break;
      case 'select': this._tone(680, 0.06, 'square', 0.09); break;
      case 'confirm': this._tone(520, 0.08, 'square', 0.1, 880); break;
      case 'cancel': this._tone(300, 0.09, 'square', 0.08, 180); break;
      case 'hit': this._tone(160, 0.12, 'sawtooth', 0.13, 70); break;
      case 'crit': this._tone(220, 0.22, 'sawtooth', 0.18, 60); this._tone(900, 0.1, 'square', 0.1); break;
      case 'weak': this._tone(740, 0.12, 'square', 0.13, 1200); break;
      case 'heal': this._tone(540, 0.18, 'sine', 0.12, 980); break;
      case 'allout': this._tone(140, 0.5, 'sawtooth', 0.2, 1400); this._tone(700, 0.4, 'square', 0.12); break;
      case 'down': this._tone(260, 0.2, 'sawtooth', 0.12, 90); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._tone(f, 0.14, 'square', 0.12), i * 90)); break;
      case 'rankup': [440, 587, 740, 988].forEach((f, i) => setTimeout(() => this._tone(f, 0.16, 'triangle', 0.12), i * 110)); break;
      default: break;
    }
  }

  clearScene() {
    // remove everything except lights, disposing GPU resources to avoid the
    // memory growth (→ WebGL context loss) that comes from many scene rebuilds.
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const c = this.scene.children[i];
      if (c.isLight) continue;
      this.scene.remove(c);
      this._disposeObject(c);
    }
    this.renderer.renderLists?.dispose?.();
  }

  _disposeObject(obj) {
    obj.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      for (const m of mats) {
        for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); }
        m.dispose?.();
      }
    });
  }
}
