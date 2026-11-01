// The 2D engine: a hand-drawn 3/4 top-down world on a canvas. The static
// world is pre-drawn into cached tiles; characters are sprites, and anything
// standing in front of a character is drawn again over it (walls and roofs
// in front of you turn see-through). Same public API as the old 3D engine, so
// the game layer drives it the same way.
import { textTexture } from './build.js';
import { bindInput, faceAndTalk, updateFocus } from './engine/input.js';
import { updateNPCs, updatePlayer } from './engine/motion.js';
import { render } from './engine/render.js';
import { compileWorld, updateAreas } from './engine/world.js';
import { labelItem, mul, nodeMatrix, primItem, PY, PZ, quadItem, sx, sy } from './project.js';
import { buildCharacter } from './sprites.js';
import * as THREE from './three2d.js';

export const TILE_PX = 512;
// cache tile size in pixels (its world size depends on the zoom level)
export const INK = '#2a1e1a';
export const GRID = 8;
// spatial grid cell (screen meters)

export class Engine {
  constructor(container) {
    this.container = container;
    const cv = document.createElement('canvas');
    cv.className = 'world2d';
    container.appendChild(cv);
    this.canvas = cv;
    this.ctx = cv.getContext('2d');
    this.renderer = { domElement: cv };
    this.world = null;
    this.npcs = new Map();
    this.markers = [];
    this.keys = new Set();
    this.paused = false;
    this.cam = { yaw: Math.PI, pitch: 0.78, dist: 11, target: new THREE.Vector3(), anchor: null };
    this.view = { x: 0, y: 0, ppm: 48 };
    this.camMode = 'follow';
    this.cine = null;
    this.player = null;
    this.playerState = { x: 0, z: 0, rot: 0, speed: 0, mode: 'idle', sitting: false };
    this.speedMult = 1;
    this.focus = null;
    this.onFocus = () => {};
    this.onInteract = () => {};
    this.onTick = () => {};
    this.onQualityChange = () => {};
    this.extraUpdaters = new Set();
    this.areaState = { inside: new Set(), focus: null };
    this.quality = 'high';
    this.minute = 12 * 60;
    this.tiles = new Map();
    this.tagCache = new Map();
    this.visT = 0;
    bindInput(this);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  // Display
  setQuality(q) {
    this.quality = q;
    this.resize();
    this.onQualityChange(q);
  }
  setPreviewMode() {}
  setViewCenter(px) {
    this.viewCenterX = px;
  }

  /** Matches the canvas to the window size. */
  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality === 'low' ? 1 : 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.w = w;
    this.h = h;
  }

  // World
  loadWorld(desc, spawn) {
    this.autoWalk = null;
    this.moveMarker = null;
    this.clearNPCs();
    this.clearMarkers();
    this.world = desc;
    desc.areas = desc.areas || [];
    compileWorld(this, desc);
    const s = spawn || desc.spawn;
    this.playerState.x = s.x;
    this.playerState.z = s.z;
    this.playerState.rot = s.rot || 0;
    this.playerState.sitting = false;
    this.cam.dist = 11;
    this.cam.anchor = null;
    this.camMode = 'follow';
    this.cine = null;
    this.areaState = { inside: new Set(), focus: null };
    updateAreas(this, true);
    this._snapCamera();
    updateFocus(this);
  }

  setPlayer(look) {
    this.player = buildCharacter(look);
    this._placePlayer();
  }

  /** Moves the player straight to a spot. */
  teleport(x, z, rot) {
    this.autoWalk = null;
    this.moveMarker = null;
    this.playerState.x = x;
    this.playerState.z = z;
    if (rot != null) this.playerState.rot = rot;
    this._placePlayer();
    updateAreas(this, true);
    this._snapCamera();
  }

  /** Puts the player sprite at the player position. */
  _placePlayer() {
    if (!this.player) return;
    this.player.root.position.x = this.playerState.x;
    this.player.root.position.z = this.playerState.z;
    this.player.root.rotation.y = this.playerState.rot;
  }

  // NPCs
  addNPC(npc) {
    if (this.npcs.has(npc.id)) this.removeNPC(npc.id);
    const char = buildCharacter(npc.look, { uniform: npc.uniform, number: npc.number });
    char.root.position.set(npc.x, 0, npc.z);
    char.root.rotation.y = npc.rot || 0;
    const rng = mulberry(npc.id);
    const entry = {
      ...npc,
      char,
      rng,
      tx: npc.x,
      tz: npc.z,
      wait: rng() * 3,
      anim: npc.mode === 'sit' ? 'sit' : 'idle',
      showTag: false,
    };
    this.npcs.set(npc.id, entry);
    return entry;
  }

  removeNPC(id) {
    this.npcs.delete(id);
  }
  clearNPCs() {
    this.npcs.clear();
  }
  npc(id) {
    return this.npcs.get(id);
  }

  /** Makes an NPC walk somewhere. */
  walkNPC(id, x, z, speed = 2.2) {
    const n = this.npcs.get(id);
    if (!n) return Promise.resolve();
    n.mode = 'goto';
    n.tx = x;
    n.tz = z;
    n.gotoSpeed = speed;
    return new Promise((res) => {
      n.onArrive = res;
    });
  }

  // Markers
  addMarker(x, z, color = '#ffd23f', label = null) {
    const m = {
      x,
      z,
      color,
      label: label
        ? textTexture(label, {
            bg: 'rgba(20,24,34,0.78)',
            color: '#ffffff',
            font: '800 44px "Nunito", sans-serif',
            height: 72,
            radius: 34,
          })
        : null,
      t: Math.random() * 6,
    };
    this.markers.push(m);
    return m;
  }

  clearMarkers() {
    this.markers = [];
  }

  // Time of day
  setTimeOfDay(minute) {
    this.minute = minute;
  }

  // Camera
  cinematic(center, radius = 18, opts = {}) {
    this.camMode = 'cine';
    this.cine = {
      center: new THREE.Vector3(center.x, 0, center.z),
      radius,
      look: new THREE.Vector3(center.x, 0.5, center.z),
      ...opts,
    };
    this._snapCamera();
  }

  follow() {
    this.camMode = 'follow';
    this.cine = null;
  }

  /** Where the camera wants to be. */
  _targetView() {
    const base = Math.max(34, Math.min(this.w, this.h * 1.6) / 19);
    if (this.camMode === 'cine' && this.cine) {
      const c = this.cine.look || this.cine.center;
      const ppm = Math.min(this.w, this.h * 1.5) / (this.cine.radius * 2.1);
      // A spinning shot becomes a slow pan in 2D.
      const pan =
        this.cine.spin && !this.cine.turnPlayer
          ? Math.sin(this.cine.angle || 0) * this.cine.radius * 0.35
          : 0;
      return { x: c.x + pan, y: c.z * PZ - (c.y || 0.5) * PY, ppm };
    }
    const p = this.playerState;
    const a = this.cam.anchor;
    const tx = a ? a.x : p.x;
    const tz = a ? a.z : p.z;
    return { x: tx, y: tz * PZ - 0.7, ppm: base * (11 / this.cam.dist) };
  }

  _snapCamera() {
    const t = this._targetView();
    this.view = { ...t };
  }

  /** Eases the camera towards its target. */
  _updateCamera(dt) {
    if (this.cine) {
      this.cine.angle = (this.cine.angle || 0) + dt * (this.cine.spin || 0);
      if (this.cine.turnPlayer && this.player) this.player.root.rotation.y = this.cine.angle;
    }
    const t = this._targetView();
    const k = Math.min(1, dt * 7);
    this.view.x += (t.x - this.view.x) * k;
    this.view.y += (t.y - this.view.y) * k;
    this.view.ppm += (t.ppm - this.view.ppm) * Math.min(1, dt * 5);
  }

  /** Screen pixel -> screen-meter coordinates. */
  _toWorldScreen(cx, cy) {
    const r = this.canvas.getBoundingClientRect();
    const v = this.view;
    const ox = this.viewCenterX != null ? this.viewCenterX : this.w / 2;
    return { X: v.x + (cx - r.left - ox) / v.ppm, Y: v.y + (cy - r.top - this.h / 2) / v.ppm };
  }

  /** World position to screen position. */
  toScreen(x, y, z) {
    const v = this.view;
    const ox = this.viewCenterX != null ? this.viewCenterX : this.w / 2;
    return { x: ox + (x - v.x) * v.ppm, y: this.h / 2 + (z * PZ - y * PY - v.y) * v.ppm, visible: true };
  }

  // Building views
  _areaContains(a, x, z, pad = 0) {
    const r = a.rect;
    return x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad;
  }

  /** Is an NPC in a visible area? */
  _npcVisible(x, z) {
    const st = this.areaState;
    const w = this.world;
    if (!w || !w.areas.length) return true;
    if (st.focus) return this._areaContains(st.focus, x, z, 0.3);
    for (const a of w.areas) {
      if (!this._areaContains(a, x, z)) continue;
      if (st.covered && st.covered(a) && !st.inside.has(a.id)) return false;
    }
    return true;
  }

  /** Should this item be drawn now? Returns the item to draw (maybe its cutaway version) or null. */
  _live(it) {
    for (const n of it.nodes) if (!n.visible) return null;
    const st = this.areaState;
    if (st.focus && !(it.tag.focusArea === st.focus || it.tag.area === st.focus)) return null;
    if (it.cut && it.tag.area && st.inside.has(it.tag.area.id)) return it.cut.skip ? null : it.cut;
    if (it.low && st.lowered && it.tag.area && st.lowered.has(it.tag.area.id))
      return it.low.skip ? null : it.low;
    return it;
  }

  /** Is a circle at x,z blocked by a collider? */
  _blocked(x, z, r = 0.3) {
    const w = this.world;
    if (!w) return false;
    for (const c of w.colliders)
      if (!(x + r <= c.minX || x - r >= c.maxX || z + r <= c.minZ || z - r >= c.maxZ)) return true;
    const bd = w.bounds;
    return bd ? x < bd.minX || x > bd.maxX || z < bd.minZ || z > bd.maxZ : false;
  }

  // Loop
  _loop(now) {
    requestAnimationFrame(this._loop);
    const t = now || performance.now();
    const dt = Math.min(0.05, Math.max(0, (t - this._last) / 1000));
    this._last = t;
    if (this.world) {
      updatePlayer(this, dt);
      updateNPCs(this, dt);
      for (const f of this.extraUpdaters) f(dt);
      for (const m of this.markers) m.t += dt;
      updateFocus(this);
      updateAreas(this);
      this._updateCamera(dt);
      this.onTick(dt);
      render(this);
    }
  }

  // Picking
  pickNPC(cx, cy) {
    if (this.paused || this.camMode !== 'follow' || !this.npcs.size) return null;
    const { X, Y } = this._toWorldScreen(cx, cy);
    let best = null;
    let bestD = Infinity;
    for (const n of this.npcs.values()) {
      if (!n.interact || !n.char.root.visible) continue;
      const pos = n.char.root.position;
      const b = n.char.box(sx([pos.x, 0, pos.z]), sy([pos.x, 0, pos.z]));
      const pad = 10 / this.view.ppm;
      if (X < b.x0 - pad || X > b.x1 + pad || Y < b.y0 - pad || Y > b.y1 + pad) continue;
      const d = pos.z; // prefer the one in front
      if (!best || d > bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  }

  /** Clicking the ground: walk there. */
  clickToMove(cx, cy) {
    if (this.paused || this.camMode !== 'follow' || this.playerState.sitting || !this.world) return false;
    const { X, Y } = this._toWorldScreen(cx, cy);
    const hit = { x: X, z: Y / PZ };
    const p = this.playerState;
    if (Math.hypot(hit.x - p.x, hit.z - p.z) > 60) return false;
    let spot = null;
    let best = Infinity;
    for (const it of this.world.interact || []) {
      if (it.hidden) continue;
      const d = Math.hypot(it.x - hit.x, it.z - hit.z);
      if (d < Math.max(1.2, (it.r || 1.6) * 0.8) && d < best) {
        best = d;
        spot = it;
      }
    }
    const [tx, tz] = spot ? [spot.x, spot.z] : [hit.x, hit.z];
    const far = Math.hypot(tx - p.x, tz - p.z);
    this.autoWalk = { point: { x: tx, z: tz }, spot, t: 0, last: far, stuck: 0, run: far > 10 };
    this.moveMarker = { x: tx, z: tz, t: 0 };
    return true;
  }

  /** Clicking an NPC: walk over and talk. */
  clickNPC(n) {
    const p = this.playerState;
    const pos = n.char.root.position;
    const d = Math.hypot(pos.x - p.x, pos.z - p.z);
    if (d <= 2.2) {
      this.autoWalk = null;
      faceAndTalk(this, n);
      return;
    }
    this.autoWalk = { id: n.id, t: 0, last: d, stuck: 0 };
  }
}
// Helpers
export function compileNode(node, m, out) {
  const mm = mul(m, nodeMatrix(node));
  if (node.isCustom2D) {
    const b = node.bb;
    out.push({
      type: 'paint',
      draw: node.draw,
      bb: b,
      flat: node.flat,
      sb: { x0: b.minX, x1: b.maxX, y0: b.minZ * PZ - b.maxY * PY, y1: b.maxZ * PZ - b.minY * PY },
    });
  } else if (node.isShapeMesh)
    for (const p of node.prims) {
      const it = primItem(p, mm);
      if (it) out.push(it);
    }
  else if (
    node.isMesh &&
    node.geometry &&
    node.geometry.kind === 'plane' &&
    node.material &&
    node.material.map
  ) {
    const it = quadItem(node, mm);
    if (it) out.push(it);
  } else if (
    node.isMesh &&
    node.geometry &&
    node.geometry.kind &&
    node.geometry.kind !== 'none' &&
    node.material
  ) {
    const it = primItem(
      {
        g: node.geometry,
        color: node.material.color ? node.material.color.getStyle() : '#cccccc',
        pos: [0, 0, 0],
        rot: [0, 0, 0],
        scale: [1, 1, 1],
        mat: 'plain',
      },
      mm,
    );
    if (it) out.push(it);
  } else if (node.isSprite && node.material && node.material.map) {
    const it = labelItem(node, mm);
    if (it) out.push(it);
  }
  for (const c of node.children) if (c.visible) compileNode(c, mm, out);
}
/** Calls f for each grid cell a box covers. */
export function forCells(sb, cell, f) {
  const x0 = Math.floor(sb.x0 / cell);
  const x1 = Math.floor(sb.x1 / cell);
  const y0 = Math.floor(sb.y0 / cell);
  const y1 = Math.floor(sb.y1 / cell);
  if ((x1 - x0) * (y1 - y0) > 4000) return; // absurdly large: skip
  for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) f(`${gx},${gy}`);
}
/** A canvas path through points. */
export function facePath(pts) {
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  p.closePath();
  return p;
}
/** Adds a value to a list in a map. */
export function push(map, k, v) {
  let l = map.get(k);
  if (!l) map.set(k, (l = []));
  l.push(v);
}
/** The box covering two boxes. */
export function unionBox(a, b) {
  return {
    x0: Math.min(a.x0, b.x0),
    x1: Math.max(a.x1, b.x1),
    y0: Math.min(a.y0, b.y0),
    y1: Math.max(a.y1, b.y1),
  };
}
/** A seeded random function from an id. */
function mulberry(id) {
  let h = 2166136261;
  for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Readable name plate: dark pill, white name, colored status dot. */
export function nameplateCanvas(text, accent = '#adb5bd') {
  const font = '900 64px "Nunito", "Trebuchet MS", sans-serif';
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  ctx.font = font;
  const H = 108;
  const dot = 22;
  const padL = 30 + dot * 2;
  const padR = 34;
  cv.width = Math.ceil(ctx.measureText(text).width) + padL + padR;
  cv.height = H;
  ctx.font = font;
  ctx.fillStyle = 'rgba(22,26,36,0.92)';
  const r = (H - 10) / 2;
  ctx.beginPath();
  ctx.moveTo(5 + r, 5);
  ctx.arcTo(cv.width - 5, 5, cv.width - 5, H - 5, r);
  ctx.arcTo(cv.width - 5, H - 5, 5, H - 5, r);
  ctx.arcTo(5, H - 5, 5, 5, r);
  ctx.arcTo(5, 5, cv.width - 5, 5, r);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(26 + dot, H / 2, dot, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padL, H / 2 + 4);
  return cv;
}
export function disposeTree() {}
export { THREE };
