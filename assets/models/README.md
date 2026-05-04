# assets/models

第三方 3D 模型/动画文件。运行时由 `js/characters/loaders.js` 异步加载，
加载完成后替换掉占位的程序化角色。

| 文件 | 大小 | 用途 | 来源 | 许可 |
| --- | --- | --- | --- | --- |
| `Soldier.glb` | 2.06 MB | 男性敌对 NPC（hostile entity）；同时作为重新着色的女性同伴的骨架 | three.js 官方示例 — `examples/models/gltf/Soldier.glb` | three.js 自带示例资源（MIT） |
| `butterfly.glb` | 134 KB | 泳池楼层飞行的"飞蛾"昆虫 | Poly Pizza，Hugo Gibson 作品 — `static.poly.pizza/80046a70-4713-438e-8174-b0a4a0a22c7c.glb` | CC-BY 3.0（需署名 Hugo Gibson） |
| `capoeira_model.fbx` | 819 KB | 女性人形角色（同伴女孩） | `github.com/mudroljub/capoeira-girl` — `assets/fbx/model.fbx` | 见上游仓库 |
| `capoeira_ginga.fbx` | 349 KB | 上一项的默认 idle 动画（Ginga 摇摆） | 同上 — `assets/fbx/Ginga.fbx` | 见上游仓库 |

## 重新下载

```sh
cd assets/models
curl -fL -o Soldier.glb         https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb
curl -fL -o butterfly.glb       https://static.poly.pizza/80046a70-4713-438e-8174-b0a4a0a22c7c.glb
curl -fL -o capoeira_model.fbx  https://cdn.jsdelivr.net/gh/mudroljub/capoeira-girl@master/assets/fbx/model.fbx
curl -fL -o capoeira_ginga.fbx  https://cdn.jsdelivr.net/gh/mudroljub/capoeira-girl@master/assets/fbx/Ginga.fbx
```

## 添加新模型

1. 把文件放进本目录，文件名用小写下划线（动画相关的成对资源除外，如 `capoeira_*`）。
2. 在 `js/characters/loaders.js` 里加一个 `_gltfLoader.load(...)` 或 `_fbxLoader.load(...)`，路径用相对路径 `assets/models/<file>`。
3. 暴露 `isXxxLoaded()` / `getXxxProto()` 访问器，并在对应的 `js/characters/<role>.js` 构建函数里克隆使用。
4. 更新本表格（文件 / 大小 / 用途 / 来源 / 许可）。
