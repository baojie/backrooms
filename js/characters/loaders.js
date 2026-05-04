// Async model loaders + the prototype state they populate.
//
// External assets:
//   - Soldier.glb (Three.js examples) — the male hostile NPC; reused as the
//     skeleton for the feminine-reskinned companion girls.
//   - Capoeira-girl FBX (mudroljub/capoeira-girl on jsDelivr/GitHub) —
//     female humanoid with the Ginga sway as default idle clip; used as a
//     fallback rig when no Quaternius proto has loaded for a given girl.
//   - Quaternius "Ultimate Modular Women" GLB pack (Public Domain / CC0,
//     mirrored at static.poly.pizza) — 7 distinct rigged-and-animated
//     female silhouettes that give each team girl her own appearance.
//   - Butterfly GLB (Hugo Gibson, Poly Pizza, CC-BY 3.0) — the flying insect
//     ("moth") on the swimming-pool level.
//
// `loadCharacters()` kicks off the fetches and invokes the callbacks once
// each model resolves so the game's upgrade scheduler can swap in the GLTF
// rigs. Sibling modules in `js/characters/` read the loaded protos via the
// getter functions exported here.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

let soldierProto = null, soldierAnims = null, soldierLoaded = false;
let girlProto    = null, girlAnims    = null, girlLoaded    = false;
let butterflyProto = null, butterflyLoaded = false;

// Quaternius modular-women pack: one entry per character. The order here
// is the deterministic assignment used by team girls (companion[i] picks
// QUATERNIUS_GIRLS[i % QUATERNIUS_GIRLS.length]).
const QUATERNIUS_GIRLS = [
  'adventurer', 'animated_woman', 'hooded_adventurer',
  'punk', 'soldier', 'witch', 'worker',
];
// proto/anims arrays parallel to QUATERNIUS_GIRLS; null until loaded.
const _qGirlProto = QUATERNIUS_GIRLS.map(() => null);
const _qGirlAnims = QUATERNIUS_GIRLS.map(() => null);
let _qGirlsLoaded = 0;

export function loadCharacters({ onSoldierReady, onGirlReady } = {}) {
  const _gltfLoader = new GLTFLoader();

  _gltfLoader.load(
    'assets/models/butterfly.glb',
    (gltf) => {
      const root = gltf.scene;
      // Normalize to a wingspan of ~0.45m so the bug reads at face-height.
      const bbox = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3(); bbox.getSize(size);
      const span = Math.max(size.x, size.z, 0.001);
      root.scale.setScalar(0.45 / span);
      butterflyProto = root;
      butterflyLoaded = true;
    },
    undefined,
    (err) => console.warn('[gltf] butterfly load failed; falling back to procedural moth', err)
  );

  _gltfLoader.load(
    'assets/models/Soldier.glb',
    (gltf) => {
      soldierProto = gltf.scene;
      soldierAnims = gltf.animations || [];
      soldierLoaded = true;
      console.log('[gltf] Soldier animations:', soldierAnims.map(a => a.name));
      if (onSoldierReady) onSoldierReady();
    },
    undefined,
    (err) => console.warn('[gltf] Soldier load failed', err)
  );

  // Quaternius women — one GLB per character, all in parallel. As each
  // resolves, fire `onGirlReady` so the upgrade scheduler can swap in
  // whichever girls are available so far. The Capoeira fallback below
  // covers the slots whose Quaternius proto hasn't arrived yet.
  for (let i = 0; i < QUATERNIUS_GIRLS.length; i++) {
    const slot = i;
    const name = QUATERNIUS_GIRLS[slot];
    _gltfLoader.load(
      `assets/models/quaternius/${name}.glb`,
      (gltf) => {
        _qGirlProto[slot] = gltf.scene;
        _qGirlAnims[slot] = gltf.animations || [];
        _qGirlsLoaded++;
        if (onGirlReady) onGirlReady();
      },
      undefined,
      (err) => console.warn(`[gltf] Quaternius ${name} load failed`, err)
    );
  }

  const _fbxLoader = new FBXLoader();
  _fbxLoader.load(
    'assets/models/capoeira_model.fbx',
    (model) => {
      girlProto = model;
      _fbxLoader.load(
        'assets/models/capoeira_ginga.fbx',
        (anim) => {
          girlAnims = anim.animations || [];
          girlLoaded = true;
          console.log('[fbx] Capoeira girl + Ginga loaded; clips:', girlAnims.map(a => a.name));
          if (onGirlReady) onGirlReady();
        },
        undefined,
        (err) => {
          console.warn('[fbx] Ginga animation load failed; girls will be static', err);
          girlAnims = model.animations || [];
          girlLoaded = true;
          if (onGirlReady) onGirlReady();
        }
      );
    },
    undefined,
    (err) => console.warn('[fbx] Capoeira girl load failed; staying procedural', err)
  );
}

// Loaded-state predicates.
export const isSoldierLoaded = () => soldierLoaded;
// `isGirlLoaded` returns true once *any* feminine rig (Quaternius or the
// Capoeira fallback) is ready to clone; the upgrade scheduler can then
// start swapping figures and will pick up the rest as they trickle in.
export const isGirlLoaded = () => girlLoaded || _qGirlsLoaded > 0;
export const isButterflyLoaded = () => butterflyLoaded;

// Proto / animation accessors — used by sibling builders that need the
// freshly-loaded GLTF assets to clone.
export const getSoldierProto = () => soldierProto;
export const getSoldierAnims = () => soldierAnims;
export const getGirlProto    = () => girlProto;
export const getGirlAnims    = () => girlAnims;
export const getButterflyProto = () => butterflyProto;

// Quaternius accessors. `getQuaterniusGirl(i)` returns
// `{ proto, anims, name }` for the character at slot `i % count`. If that
// exact slot hasn't finished loading yet, we walk forward through the
// remaining slots and return the next one that *has* loaded — that way
// a girl always gets *some* distinct rig instead of falling back to the
// shared Capoeira figure. Returns `null` only if no slot is loaded.
export function getQuaterniusGirlCount() { return QUATERNIUS_GIRLS.length; }
export function getQuaterniusGirl(idx) {
  const N = QUATERNIUS_GIRLS.length;
  const start = ((idx % N) + N) % N;
  for (let i = 0; i < N; i++) {
    const slot = (start + i) % N;
    const proto = _qGirlProto[slot];
    if (proto) {
      return { proto, anims: _qGirlAnims[slot] || [], name: QUATERNIUS_GIRLS[slot] };
    }
  }
  return null;
}
