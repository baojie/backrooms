// Async model loaders + the prototype state they populate.
//
// Three external assets:
//   - Soldier.glb (Three.js examples) — the male hostile NPC; reused as the
//     skeleton for the feminine-reskinned companion girls.
//   - Capoeira-girl FBX (mudroljub/capoeira-girl on jsDelivr/GitHub) —
//     female humanoid with the Ginga sway as default idle clip.
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
export const isGirlLoaded = () => girlLoaded;
export const isButterflyLoaded = () => butterflyLoaded;

// Proto / animation accessors — used by sibling builders that need the
// freshly-loaded GLTF assets to clone.
export const getSoldierProto = () => soldierProto;
export const getSoldierAnims = () => soldierAnims;
export const getGirlProto    = () => girlProto;
export const getGirlAnims    = () => girlAnims;
export const getButterflyProto = () => butterflyProto;
