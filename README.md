# 后室 / The Backrooms

> 这是一个 **6 岁小男孩** 的点子 —— 关卡设定、怪物、武器、"100 个少女队员"、
> 杀虫剂打飞蛾、紫色随机楼梯…… 全来自他的脑洞。代码只是把它实现出来。
>
> *Designed by a 6-year-old. Implemented in code.*

一个浏览器端的第一人称恐怖探索游戏，基于 [Three.js](https://threejs.org/) +
原生 ES Modules，无需打包工具，直接用任意静态 HTTP 服务器即可运行。

![黄色房间 + 同伴队伍](screenshots/20260504-151943Z-f141799-dirty/floor-01-yellow.png)

灵感取自互联网都市传说"后室（Backrooms）"——你"穿模"出了现实，落入十层
永无止境的迷宫。每一层主题不同，里面游荡的怪物、流落的同伴、可拾取的
"杏仁水"（恢复理智）和角落里的电梯共同构成一段下楼求生的旅程。

📷 全 10 层逐层视觉详见 **[FLOORS.md](FLOORS.md)**。

---

## 快速开始

```bash
# 1. 在仓库根目录起一个静态服务器（默认端口 6464 = "BR" Backrooms）
python3 -m http.server 6464

# 2. 浏览器打开
xdg-open http://localhost:6464     # Linux
# 或者直接访问 http://localhost:6464
```

进入页面后点击 `开始 / START`（或按 `Enter`），鼠标会被锁定，开始游戏。

> ⚠️ 由于 ES module 的 CORS 限制，请用 HTTP 服务器打开，不要直接 `file://`。

### 一键启动脚本（含 TTS 服务）

```bash
./start.sh
```

会自动（daemon 模式）：
- 检测 `piper` 是否安装；如有则在端口 `6465` 启动 `tts_server.py`
- 在端口 `6464` 启动静态服务器
- 两个进程都 `nohup` 后台跑，PID / 日志写到 `.run/`
- `./start.sh stop` 停止；`./start.sh status` 查看；`./start.sh restart` 重启

### 为什么是 6464 / 6465？

默认端口取自游戏主题 **BR = Backrooms**：

- `6464` — "**BR-BR**"，两个 "BR" 重复，看着像 64×64 的网格 / 后室无尽循环
- `6465` — TTS 紧跟着 `+1`，方便记忆

都在 IANA 未指派区间（>1024 且 <49152），日常不会和系统服务撞车。
要换端口就在命令前加环境变量，例如想让游戏跑在 3000、TTS 跑在 3001：

```bash
PORT=3000 TTS_PORT=3001 ./start.sh
# 浏览器: http://localhost:3000
```

⚠️ 改 `TTS_PORT` 时记得同步改 `js/tts.js` 里的 `PIPER_URL`，否则前端探活会失败。

---

## 操作

| 按键 | 功能 |
|---|---|
| `W A S D` | 移动 |
| `Shift` | 奔跑（耗体力） |
| 鼠标 | 视角 |
| `F` | 手电筒（耗电池） |
| `E` | 互动（楼梯 / 电梯） |
| `1` `2` `3` `4` `5` | 切换武器：手枪 / AK-47 / 匕首 / 火箭炮 / 杀虫剂 |
| `Q` | 武器轮换 |
| 左键 / `空格` | 开火 / 挥刀 / 喷雾 |
| `Shift` + `1`–`9` / `0` | 直接跳到第 N 层（`Shift+0` = 第 10 层） |
| `Esc` | 释放鼠标 |

### 战斗与道具

- **生命值（HP）** — 绝对刻度，最大 `10000`。HUD 同时显示血条和数字。脱离威
  胁时按 `200/s` 自然回复。各伤害源都按绝对值调过：飞蛾咬一口 80、电缆 1000/s、
  毒水 800/s、火箭炮自伤最高 4000。
- **急救包（Medkit）** — 白色十字小箱，每层 2–4 个，捡起恢复 `3000` HP。
- **杏仁水（Almond Water）** — 黄色发光小瓶，理智 +35%、移动速度 +45% 持续 8
  秒。深层楼层会更稀缺。
- **手电筒** — 60° 宽光束，照亮前方一大片区域，电池有限。
- **武器**
  - 手枪：单发；命中怪物 / 同伴；可"友军伤害"
  - AK-47：连发（按住左键），后坐力小但消耗连续输出
  - 匕首：近战劈砍
  - 火箭炮：5 米爆炸半径，**可炸开墙壁**开辟新通道，伤害高但近距离误伤自己
  - 杀虫剂：黄色喷罐，前向 ~4.5m 绿色雾锥，专治泳池层的飞蛾
- **同伴（女队员）** — 总共 10 名（"小美"、"小雅"……）跟随你，约 40% 携带匕首，
  会主动突击附近的怪物（不会伤害玩家）。死亡时会发出语音惨叫。
- **导游 NPC** — 第 1 层会随机出现一个头顶光环的"陌生人"，靠近 4.5m 内会主动
  跟你打招呼，然后通过 BFS 寻路把你领到下一层楼梯口；走太远会停下来等你，
  卡墙会重新规划路径。
- **电梯** — 角落里的金属舱，按 `E` 进入后弹出楼层选择面板（按 `1-9`、`0=10`
  或点击）。门会动画关闭、画面淡黑、新楼层重建、淡入、门动画打开。
- **楼梯（红色脉动方柱）** — 靠近按 `E` 下到 *下一* 层（终焉层是绿色）。
- **随机楼梯（紫色方柱）** — 每层都有第二组楼梯，距常规出口 ≥7m，按 `E` 传送到
  *随机另一层*。
- **死亡动画** — 玩家 HP 归零时镜头会斜倒到地板（约 1.4 秒），并在原地留下
  自己的尸体。点击死亡画面重生。

### 泳池层 (Floor 4) 特殊机制

- 单个矩形下沉式泳池嵌入白色瓷砖甲板，配白色方柱 + 金属护栏 + 密集日光灯顶
- 池外是甲板（4 条带），spawn / 物品 / 楼梯只落在甲板上
- 池内潜藏：火花四溅的电缆（`1000/s`）、冒泡毒水块（`800/s`）、8 只会主动
  扑咬的飞蛾（每口 80 HP，杀虫剂能击落）
- **小船** — 池边几艘可登船划艇，按 `E` 上下船；上船后无视电缆 / 毒水 / 飞蛾

---

## 十层主题

| 层 | 名字 | 主要装饰 |
|---:|---|---|
|  1 | 黄色房间 | 经典的霉黄壁纸 + 潮湿地毯 + 嗡嗡日光灯 |
|  2 | 车库 | 整片开放车库 + 排满轿车 / 掀背车 + 水泥柱 |
|  3 | 发电厂 | 暗色机房 + 蓝色电火花 |
|  4 | 游泳池 | 整层下沉式大泳池 + 电缆 / 毒水 / 飞蛾 + 小船 |
|  5 | 农场 | 露天蓝天 + 麦田 |
|  6 | 幼儿园 | 粉色墙 + 散落玩具 |
|  7 | 办公室 | 米色隔间 + 显示器 |
|  8 | 图书馆 | 高大橡木书架 + 多色书脊 + 绿铜读书台灯 + 散落书堆 |
|  9 | 地铁站 | 双钢轨 + 木枕 + 石碴道床 + 黄色站台警示线 + EXIT 灯牌 |
| 10 | 顶楼 | 黎明屋顶 + H 直升机停机坪 + HVAC + 水塔 + 月亮 + 城市天际线（终点） |

每一层的最新截图见 [`FLOORS.md`](FLOORS.md)。

---

## 模块结构

源码采用 ES Module 拆分，由 `index.html` 中的主脚本入口聚合：

```
index.html       — HTML 框架、CSS、HUD/overlay DOM、importmap、主脚本聚合
js/
  levels.js      — 十层主题数据 + per-floor layout 字段 + 网格常量
  maze.js        — buildMaze（递归回溯 + 18% 拆墙，仍是默认 layout）
  textures.js    — makeNoiseTexture（程序化噪点贴图）
  audio.js       — 程序化音频：嗡鸣 / blip / 静噪 / 心跳 / 死亡惨叫
  tts.js         — 字幕 + Mandarin-only TTS（Piper HTTP 优先 → Web Speech 兜底）
  lines.js       — 对话模板库 → 2,000+ 中文台词（按角色 + 情境分桶）+ pickCompanionLine
tts_server.py    — Piper HTTP 服务（127.0.0.1:8001），同步合成中文 WAV
start.sh         — 一键启动 TTS + 静态服务器
deploy.sh        — 部署辅助脚本
```

每层关卡通过 `layout` 字段挑选不同的布局生成器（停车场柱阵 / 工厂机房 / 教室
栅格 / 办公室隔间 / 图书馆书架 / 地铁站台 / 泳池下沉甲板 / 农场 / 终焉空房）。

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
