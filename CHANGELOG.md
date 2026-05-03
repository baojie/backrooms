# Changelog

按时间倒序记录主要功能与重构。日期为提交日期。

## 2026-05-03

- **README + CHANGELOG** — 项目说明、模块结构、TTS 安装步骤、性能注意点
- **`js/maze.js`** — 把递归回溯迷宫生成器单独抽出，主脚本里只剩一个一行
  代理函数；`buildMaze(GRID)` 返回 cells 网格，纯函数无副作用
- **TEAM_SIZE 调整为 10**（数据微调，不改逻辑）

## 2026-05-02

### 模块化第一波
- 新建 `js/` 目录，从 3,430 行的 `index.html` 中抽出：
  - `js/levels.js` — 十层主题数据 + 网格常量 + GIRL_NAMES
  - `js/textures.js` — `makeNoiseTexture` 程序化噪点贴图
  - `js/audio.js` — 嗡鸣 / blip / 静噪 / 心跳 / 死亡惨叫
  - `js/tts.js` — 字幕 + 普通话严格 TTS（Piper 优先 → Web Speech 兜底）
  - `js/lines.js` — 2,381 句生成式中文台词 + 上下文感知 picker
- 主 `<script type="module">` 现仅 ~2,800 行，下降 ~19%

### 角色与动画
- **重新启用 Soldier.glb 加载**：用 `SkeletonUtils.clone` 给每个少女克隆骨架
  与 Idle/Walk/Run 动画，但**隐藏士兵原模**，把过程化女性身体部件挂到对应
  骨头（hips → 百褶裙、spine → 胸部 + 连衣裙、head → 长发 / 蝴蝶结 / 眼睛 /
  腮红、四肢 → 袖管 / 裸腿 / 黑鞋）
- `attachCompanionKnife` 同时支持 GLTF 右手骨头与过程化 elbow group
- `runCompanionKnifeCombat` 抽出共用函数：检测最近怪物、扑过去、挥刀、击杀
  播报"XX 解决了一个！"
- 关卡建造时先用便宜的过程化 mesh，避免同步阻塞；`scheduleGLTFUpgrade()`
  每帧最多升级 3 个角色到 GLTF 版本，约 0.5 秒内全部换装完成
- 起身后直接满血，移除"开局即死"演出
- 妆容/发色/裙色按 i 索引用黄金角散布生成，100 个少女各不相同

### 关卡 / 互动
- **第 2 层车库** 重做为一片整层开放空间 + 散落停车
- 出怪点强制距玩家 14m 以上，开局不再被贴脸
- 电梯改进：
  - 必须放在角落格子，不再挡路
  - 按 E 进入 → 拉镜头进舱 → 关门 → 黑屏 → 重建关卡 → 开门 → 淡入
  - 关卡构建用 try/catch，失败也强制 `fadein` 把黑幕拉走
  - 如果新层没有电梯，落点回到中心 spawn 而不是停在旧坐标
  - `camera.rotation.set(0,0,0)` 显式重置，消除前一关的死亡倾倒残留
- 玩家死亡时新增"倒地动画"（1.4s），并在原地留下自己的尸体
- HP 自然回复（远离威胁时 0.05/s）
- 怪物伤害从 0.6/s 降到 0.20/s，给同伴反应时间

### 武器
- **火箭炮（按 4）**：圆筒 + 红弹头握把模型；火箭沿镜头方向 32m/s 飞行；命中
  墙、怪物、地板或超时（4s）时爆炸；爆炸半径 5m、伤害 5.0、范围内怪物 / 队员 /
  玩家都吃伤害；动画化的橙色闪光球 + 大点光源 + 低频"轰"声 + 静噪
- **可破坏墙**：每个 wallBox 记录其 InstancedMesh `instanceIdx`；爆炸后把命中
  范围内的墙 instance 矩阵设为 `makeScale(0,0,0)` 隐藏，并从 `wallBoxes` 数组
  剔除；`wallMesh.instanceMatrix.needsUpdate = true` 推到 GPU
- 同伴 ~40% 携带匕首，看到怪物会自动突袭（绝不伤玩家）
- NPC 死亡触发合成尖叫（频率随 bobSeed 不同）+ TTS 随机喊声
  （啊——！/不要——！/妈呀——！…）

### TTS / 文本
- **普通话严格化**：Web Speech 找不到 `zh-CN` voice 时直接静音（不退回英文）
- **2,000+ 中文台词**：组合式模板生成，分 generic / fear / safe / item / 楼层
  特定 5 个桶；`pickCompanionLine(name, ctx)` 按当前怪物距离 / 理智 / 血量 /
  杏仁水加速 / 楼层 智能挑选
- 楼层切换 / 电梯 / 下楼公告全部走 `speak('旁白')`，旁白音色低、慢
- 字幕 `say()` + DOM 字幕条同步显示
- 取消 Web Speech 的英文兜底（无中文则保持沉默，不破坏沉浸感）

## 2026-05-01

### 初版到完整功能游戏
- **Day 0**：Three.js 单文件版本，程序化 Backrooms 第 1 层 + 微弱 SmilerEntity
- 闪烁日光灯、潮湿地毯纹理、雾、晕影、心跳音
- 手电筒（按 F），后调整为 60° 大范围光束
- 杏仁水拾取（理智 +35%、加速 +45%、8 秒）
- 全 UI 改成中文字符
- 武器：手枪 / AK-47 / 匕首；左键开火，可击毙怪物或同伴
- **同伴**：从 2 人（小王 / 小李）扩展到 100 人少女队（GIRL_NAMES）
- 完整 10 层关卡循环，含 黄色房间 / 车库 / 发电厂 / 游泳池 / 农场 / 幼儿园 /
  办公室 / 图书馆 / 地铁站 / 终焉
- 楼梯（红色脉动方柱）+ 电梯（角落舱）双下层方式
- Piper HTTP TTS 服务（`tts_server.py` + `start.sh`）
- 死亡留下尸体 mesh（被击毙的同伴 / 怪物会平躺地上）
- 友军伤害 + 击毙队员扣理智
- 内联 bootstrap 脚本：即使主 module 失败，开始按钮和 Enter 键照样能用
- Web Speech API + 普通话语音选择
