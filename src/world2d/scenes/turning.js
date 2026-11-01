// Turning around in a scene: which way doors and nodes face after a flip.
import * as THREE from '../three2d.js';

// Turning
const NODE_KEYS = new Set([
  'group',
  'obj',
  'roof',
  'lid',
  'contents',
  'objs',
  'sc',
  'b',
  'pivot',
  'wall',
  'setScore',
]);
const SIDE_FLIP = { N: 'S', S: 'N', E: 'W', W: 'E' };
/**
 * Turn a whole location 180° (x -> -x, z -> -z) so its main building faces the
 * camera in the 2D view. Every coordinate the game reads (spawns, zones, spots,
 * colliders, rooms, extras) turns with it. desc.xf(x, z) converts old coordinates.
 */
export function turnAround(desc) {
  const g = new THREE.Group();
  for (const c of [...desc.group.children]) g.add(c);
  g.rotation.y = Math.PI;
  desc.group.add(g);
  const seen = new Set();
  const fix = (o) => {
    if (!o || typeof o !== 'object' || seen.has(o) || o.isObject3D || o instanceof THREE.Object3D) return;
    seen.add(o);
    if (Array.isArray(o)) {
      o.forEach(fix);
      return;
    }
    if (typeof o.minX === 'number' && typeof o.maxX === 'number') {
      const [a, b] = [-o.maxX, -o.minX];
      o.minX = a;
      o.maxX = b;
    }
    if (typeof o.minZ === 'number' && typeof o.maxZ === 'number') {
      const [a, b] = [-o.maxZ, -o.minZ];
      o.minZ = a;
      o.maxZ = b;
    }
    if (typeof o.x === 'number' && typeof o.z === 'number') {
      o.x = -o.x;
      o.z = -o.z;
      if (typeof o.rot === 'number') o.rot += Math.PI;
    }
    if (typeof o.cx === 'number' && typeof o.cz === 'number') {
      o.cx = -o.cx;
      o.cz = -o.cz;
    }
    if (typeof o.face === 'number') o.face = -o.face;
    if (typeof o.side === 'string' && SIDE_FLIP[o.side]) o.side = SIDE_FLIP[o.side];
    for (const [k, v] of Object.entries(o)) if (!NODE_KEYS.has(k)) fix(v);
  };
  for (const [k, v] of Object.entries(desc)) if (!NODE_KEYS.has(k)) fix(v);
  for (const a of desc.areas || [])
    for (const wl of a.walls || [])
      if (SIDE_FLIP[wl.side] && !seen.has(wl)) {
        wl.side = SIDE_FLIP[wl.side];
        seen.add(wl);
      }
  desc.xf = (x, z) => [-x, -z];
  return desc;
}
