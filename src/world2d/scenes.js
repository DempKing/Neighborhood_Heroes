// Location builders, one file per place in world2d/scenes/. Each returns what the engine and game use:
// { group, colliders, zones, interact, spawn, bounds, areas, extra, ... }
import { BOX, RBOX } from './build.js';
import { buildGrocery } from './scenes/grocery.js';
import { buildHome } from './scenes/home.js';
import { buildLibrary } from './scenes/library.js';
import { buildMall } from './scenes/mall.js';
import { buildMuseum } from './scenes/museum.js';
import { buildNeighborhood } from './scenes/neighborhood.js';
import { buildSchool } from './scenes/school.js';
import { buildHilltop, buildVenue } from './scenes/venues.js';

export * from './scenes/common.js';
export * from './scenes/grocery.js';
export * from './scenes/home.js';
export * from './scenes/library.js';
export * from './scenes/mall.js';
export * from './scenes/museum.js';
export * from './scenes/neighborhood.js';
export * from './scenes/school.js';
export * from './scenes/turning.js';
export * from './scenes/venues.js';
export { BOX, RBOX };

export const BUILDERS = {
  buildHome,
  buildNeighborhood,
  buildSchool,
  buildMall,
  buildLibrary,
  buildMuseum,
  buildGrocery,
  buildVenue,
  buildHilltop,
};
