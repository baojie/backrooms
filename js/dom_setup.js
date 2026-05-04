// Build the four full-screen overlays at module init time:
//   #overlay        — welcome / pause panel (clickable to start)
//   #deathScreen    — red splash on player death (clickable to retry)
//   #winScreen      — gold splash after the rooftop (clickable to restart)
//   #elevatorPanel  — floor-picker dialog
//
// Each is created via createElement + innerHTML and appended to <body>.
// CSS in css/main.css is keyed on the same IDs so styling kicks in
// immediately. setupOverlay()/createElevator() in their respective
// modules then look them up via getElementById.

export function setupOverlayDOM() {
  document.body.insertAdjacentHTML('beforeend', `
<div id="overlay">
  <div class="panel">
    <h1>后室</h1>
    <p>你穿模出了现实，跌入永无止境的迷宫。<br>
    十层地狱，每层都不一样。<br>
    你和 <b>10 名少女队员</b> 必须找到下楼梯，活着抵达顶楼。</p>
    <p style="margin-top:18px">
      <span class="key">W A S D</span> 移动 &nbsp;
      <span class="key">SHIFT</span> 奔跑 &nbsp;
      <span class="key">鼠标</span> 视角<br>
      <span class="key">F</span> 手电筒 &nbsp;
      <span class="key">E</span> 互动（楼梯/电梯）<br>
      <span class="key">1</span> 手枪 &nbsp;
      <span class="key">2</span> AK-47 &nbsp;
      <span class="key">3</span> 匕首 &nbsp;
      <span class="key">Q</span> 切换武器<br>
      <span class="key">左键 / 空格</span> 开枪 / 挥刀（无限子弹，可击毙怪物或队员）<br>
      <span class="key">ESC</span> 释放鼠标 &nbsp;
      <span class="key">F1</span> 再次查看本帮助
    </p>
    <p style="margin-top:14px; font-size:12px; color:#a89570;">
      捡起 <b style="color:#f6e29a">杏仁水</b> 恢复理智并加速。靠近楼梯按 E 进入下一层，或乘 <b style="color:#9ed8ff">电梯</b> 直达任意层。游泳池里小心 <b style="color:#cfefff">电缆</b>、<b style="color:#9fff66">毒水</b> 与 <b style="color:#c8b890">飞蛾</b>，可按 E 上 <b style="color:#c8a070">船</b>。按 <span class="key">5</span> 切到 <b style="color:#c8ff66">杀虫剂</b> 灭蛾。
    </p>
    <p style="margin-top:20px; color:#fff">点击进入 / 按 <span class="key">ENTER</span></p>
    <button id="startBtn" autofocus
      style="margin-top:14px; font-size:18px; padding:10px 24px; background:#553311; color:#fff; border:1px solid #aa8844; cursor:pointer; font-family:inherit; letter-spacing:4px;">
      开始 / START
    </button>
  </div>
</div>

<div id="deathScreen">
  <div>
    <h1>被发现了</h1>
    <p>点击重新穿模。</p>
  </div>
</div>

<div id="winScreen">
  <div>
    <h1>你逃出来了</h1>
    <p style="color:#aaa">穿过十层后室，你重见光明。</p>
    <p style="color:#fff; margin-top:24px">点击重新开始</p>
  </div>
</div>

<div id="elevatorPanel">
  <div class="box">
    <h2>电梯 / Elevator</h2>
    <div class="floors" id="floorList"></div>
    <div class="hint">数字键 1-9, 0=10　|　ESC 关闭　|　游戏中 Shift+数字 直达楼层</div>
  </div>
</div>
`);
}
