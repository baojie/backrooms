// Public facade for js/characters/. Re-exports every builder so callers can
// `import { ... } from './js/characters/index.js'` without caring which
// per-character file the function lives in.

export {
  loadCharacters,
  isSoldierLoaded, isGirlLoaded, isButterflyLoaded,
  getSoldierProto, getSoldierAnims, getGirlProto, getGirlAnims,
  getButterflyProto,
} from './loaders.js';

export { makeNameTag } from './nametag.js';
export { buildCompanionKnife, attachCompanionKnife } from './knife.js';
export { buildHumanoidEntity, buildSoldierEntity } from './hostile.js';
export {
  buildFemaleCompanion, buildProceduralCompanion, buildCompanionMesh,
} from './companion_procedural.js';
export {
  attachFeminineReskin, buildGLTFGirl, buildGLTFCompanion,
} from './companion_gltf.js';
