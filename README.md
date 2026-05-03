# 后室 / The Backrooms

一个浏览器端的第一人称恐怖探索游戏，基于 [Three.js](https://threejs.org/) +
原生 ES Modules，无需打包工具，直接用任意静态 HTTP 服务器即可运行。

灵感取自互联网都市传说"后室（Backrooms）"——你"穿模"出了现实，落入十层
永无止境的迷宫。每一层主题不同，里面游荡的怪物、流落的同伴、可拾取的
"杏仁水"（恢复理智）和角落里的电梯共同构成一段下楼求生的旅程。

---

## 快速开始

```bash
# 1. 在仓库根目录起一个静态服务器
python3 -m http.server 8000

# 2. 浏览器打开
xdg-open http://localhost:8000     # Linux
# 或者直接访问 http://localhost:8000
```

进入页面后点击 `开始 / START`（或按 `Enter`），鼠标会被锁定，开始游戏。

> ⚠️ 由于 ES module 的 CORS 限制，请用 HTTP 服务器打开，不要直接 `file://`。

### 一键启动脚本（含 TTS 服务）

```bash
./start.sh
```

会自动：
- 检测 `piper` 是否安装；如有则在端口 `8001` 启动 `tts_server.py`
- 在端口 `8000` 启动静态服务器

---

## 操作

| 按键 | 功能 |
|---|---|
| `W A S D` | 移动 |
| `Shift` | 奔跑（耗体力） |
| 鼠标 | 视角 |
| `F` | 手电筒（耗电池） |
| `E` | 互动（楼梯 / 电梯） |
| `1` `2` `3` `4` | 切换武器：手枪 / AK-47 / 匕首 / 火箭炮 |
| `Q` | 武器轮换 |
| 左键 / `空格` | 开火 / 挥刀 |
| `Esc` | 释放鼠标 |

### 战斗与道具

- **杏仁水** — 黄色发光小瓶，捡起后理智 +35%、移动速度 +45% 持续 8 秒。深层
  楼层会更稀缺，请省着喝。
- **手电筒** — 60° 宽光束，照亮前方一大片区域，电池有限。
- **武器**
  - 手枪：单发；命中怪物 / 同伴；可"友军伤害"
  - AK-47：连发（按住左键），后坐力小但消耗连续输出
  - 匕首：近战劈砍
  - 火箭炮：5 米爆炸半径，**可炸开墙壁**开辟新通道，伤害高但近距离误伤自己
- **同伴** — 总共 100 名队员（"小美"、"小雅"……）跟随你，约 40% 携带匕首，
  会主动突击附近的怪物（不会伤害玩家）。死亡时会发出语音惨叫。
- **电梯** — 角落里的金属舱，按 `E` 进入后弹出楼层选择面板（按 `1-9`、`0=10`
  或点击）。门会动画关闭、画面淡黑、新楼层重建、淡入、门动画打开。
- **楼梯** — 红色脉动方柱（最终层是绿色），靠近按 `E` 直接下到下一层。
- **死亡动画** — 玩家 HP 归零时镜头会斜倒到地板（约 1.4 秒），并在原地留下
  自己的尸体。点击死亡画面重生。

---

## 十层主题

| 层 | 名字 | 主要装饰 |
|---:|---|---|
|  1 | 黄色房间 | 经典的霉黄壁纸 + 潮湿地毯 + 嗡嗡日光灯 |
|  2 | 车库 | 灰色水泥 + 散落汽车 |
|  3 | 发电厂 | 暗色机房 + 蓝色电火花 |
|  4 | 游泳池 | 蓝色瓷砖 + 半透明水面 |
|  5 | 农场 | 露天蓝天 + 麦田 |
|  6 | 幼儿园 | 粉色墙 + 散落玩具 |
|  7 | 办公室 | 米色隔间 + 显示器 |
|  8 | 图书馆 | 棕色书架 + 木地板 |
|  9 | 地铁站 | 水泥隧道 + 铁轨 |
| 10 | 终焉 | 纯黑虚空 + 白色立柱（终点） |

---

## 模块结构

源码采用 ES Module 拆分，由 `index.html` 中的主脚本入口聚合：

```
index.html       — HTML 框架、CSS、HUD/overlay DOM、importmap、主脚本聚合
js/
  levels.js      — 十层主题数据 + 网格常量（CELL/GRID/WALL_HEIGHT/TEAM_SIZE/GIRL_NAMES）
  maze.js        — buildMaze（递归回溯 + 18% 拆墙）
  textures.js    — makeNoiseTexture（程序化噪点贴图）
  audio.js       — 程序化音频：嗡鸣 / blip / 静噪 / 心跳 / 死亡惨叫
  tts.js         — 字幕 + Mandarin-only TTS（Piper HTTP 优先 → Web Speech 兜底）
  lines.js       — 对话模板库 → 2,000+ 中文台词（按角色 + 情境分桶）+ pickCompanionLine
tts_server.py    — Piper HTTP 服务（127.0.0.1:8001），同步合成中文 WAV
start.sh         — 一键启动 TTS + 静态服务器
```

`index.html` 的内联 `<script type="module">` 仍承担：
- 场景 / 相机 / 渲染器 / PointerLockControls / 手电筒
- 玩家与同伴对象 + 100 个少女的颜色配色
- 武器系统（手枪 / AK-47 / 匕首 / 火箭炮 + WEAPONS 表 + fire / explode / destroyWalls）
- 角色 mesh 构建（buildProceduralCompanion + buildHumanoidEntity + buildGLTFGirl）
- 关卡构建（buildLevel + spawnProps + 电梯 + 楼梯 + 杏仁水）
- 输入（键盘、鼠标）
- UI 面板（开始 / 死亡 / 胜利 / 电梯）
- 主循环 `tick()`

未来如有兴趣继续模块化，建议优先级：
1. `js/state.js` — 把 `levelGroup`/`wallBoxes`/`entities`/`almonds`/… 等可变共享状态封装到一个 `S` 对象
2. `js/characters.js` — 抽出 `buildProceduralCompanion`、`buildHumanoidEntity`、`buildGLTFGirl`、`makeNameTag`、`leaveCorpse`
3. `js/weapons.js` — 武器 mesh + WEAPONS + 开火 / 爆炸 / 破墙
4. `js/level.js` — buildLevel + spawnProps + showFloorTitle
5. `js/loop.js` — tick

---

## TTS（语音）

游戏中所有人物（同伴 + 旁白）都说普通话。语音走两条管线，按优先级：

### 1. Piper 神经网络 TTS（推荐）

更自然、男女声音可区分。一次性安装：

```bash
pipx install piper-tts
sudo apt install -y sox            # 可选，启用按角色 pitch 偏移
mkdir -p ~/.local/share/piper-voices && cd ~/.local/share/piper-voices
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx.json
```

然后用 `./start.sh` 启动。游戏会先 `GET /health` 探活；可用就走 Piper。

### 2. Web Speech API（系统自带）

仅在浏览器有普通话语音的情况下才会发声（严格普通话过滤，不会用英文凑数）。
Linux 上需要 `speech-dispatcher` + 普通话语音；Chrome 通常自带 `zh-CN`。

打开 DevTools 控制台：

```js
speechSynthesis.getVoices().filter(v => /zh/i.test(v.lang))
```

非空数组即可。

---

## 性能注意

- 100 个 GLTF 骨骼克隆（`SkeletonUtils.clone(Soldier.glb)`）非常耗时，所以
  关卡切换时先用程序化人形占位，然后用 `scheduleGLTFUpgrade()` 每帧最多升级
  3 个，平摊在 ~33 帧 (≈0.5 秒) 内完成；这样换层不会黑屏。
- 距离玩家 30m 以外的同伴跳过骨架动画更新（LOD）。
- 怪物刷新位置距玩家至少 14m，避免开局贴脸。

---

## 已知边界条件

- Soldier.glb 来自 `https://threejs.org/examples/models/gltf/Soldier.glb`，加载
  失败时会回退成纯过程化少女模型，游戏继续可玩。
- 火箭炮可以炸穿任意墙；如果你把楼梯所在区域全炸了，仍然可以靠电梯继续。
- 队员中弹（friendly fire）会扣理智；爆炸友军伤害更狠，请远离同伴开炮。

---

## 许可

Personal hobby project. Asset 引用：
- Soldier.glb — Three.js examples（自有许可）
- Piper voices — [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices)
