// 不依赖 WebGL：用 three.js 的纯几何对象验证「层转动」逻辑确实生效。
// 复刻 InteractiveCube.applyLayerRotation 的核心，确认：
//   1) 抓住某面某 cubie 拖动 → computeTurn 给出合理的轴/层/进度
//   2) 该层 cubie 随之旋转、其余层保持不动
import * as THREE from "/workspace/frontend/node_modules/three/build/three.module.js";
import { computeTurn, type Vec3 } from "/workspace/frontend/src/lib/cube3d";

function buildCubies() {
  const arr: THREE.Vector3[] = [];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
    if (x === 0 && y === 0 && z === 0) continue;
    arr.push(new THREE.Vector3(x, y, z));
  }
  return arr;
}

function rotateLayer(cubies: THREE.Vector3[], axis: number, layer: number, eM: Vec3, angle: number) {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(eM[0], eM[1], eM[2]), angle);
  for (const c of cubies) {
    if (c.getComponent(axis) === layer) c.applyQuaternion(q);
  }
}

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) { failures++; console.log("  ❌ " + msg); }
  else console.log("  ✅ " + msg);
}

// 场景：在 F 面(faceId=4) 抓住 (1,1,1) 向右拖动 60px
// 物理上：抓前面右上角向右拖 => 顶层(U)绕竖直轴转（与之前"F面右拖→U/E/D层"结论一致）
const faceId = 4;
const pos: Vec3 = [1, 1, 1];
const rot = { x: -26, y: -34 };
const plan = computeTurn(faceId, pos, 60, 0, rot);
console.log("computeTurn(F面, (1,1,1), 右拖60px) =>", JSON.stringify(plan));
assert(!!plan, "computeTurn 返回了有效的转动方案");
assert(plan!.axis === 1, "转动轴为 Y 轴（U 层绕竖直轴转）");
assert(plan!.layerCoord === 1, "转动层为顶层(layerCoord=1)");
assert(plan!.move === "U", "转动记为 U");
assert(Math.abs(plan!.progress) > 0.3, "拖动产生了明显的转动进度");

// 应用实时拖动角度
const cubies = buildCubies();
const before = cubies.map((c) => c.clone());
rotateLayer(cubies, plan!.axis, plan!.layerCoord, plan!.eM, plan!.progress * (Math.PI / 2));
let onLayerMoved = 0, offLayerMoved = 0, onLayerTotal = 0;
cubies.forEach((c, i) => {
  const onLayer = before[i].getComponent(plan!.axis) === plan!.layerCoord;
  const changed = before[i].distanceTo(c) > 1e-6;
  if (onLayer) { onLayerTotal++; if (changed) onLayerMoved++; }
  else if (changed) offLayerMoved++;
});
console.log(`层内 cubie: ${onLayerTotal} 个，转动中移动: ${onLayerMoved}，层外误动: ${offLayerMoved}`);
// 旋转轴中心的 cubie（如 Y 轴层的 (0,1,0)）位置本就不变，只转朝向，属正常
assert(onLayerMoved === onLayerTotal - 1, "该层除轴心 cubie 外都随拖动旋转");
assert(offLayerMoved === 0, "其余层 cubie 完全不动");

// 完整提交 90° 后，顶层 cubie 应仍在同一层（Y 分量不变）
const cubies2 = buildCubies();
rotateLayer(cubies2, plan!.axis, plan!.layerCoord, plan!.eM, Math.PI / 2);
const stillOnLayer = cubies2.filter((c) => c.getComponent(plan!.axis) === plan!.layerCoord).length;
assert(stillOnLayer === onLayerTotal, "整层转 90° 后仍在同一层（位置合法）");

console.log(failures === 0 ? "\n🎉 层转动逻辑验证通过" : `\n💥 失败 ${failures} 项`);
process.exit(failures === 0 ? 0 : 1);
