import * as THREE from "three";

function faceIdOfDir(d: THREE.Vector3): number {
  const x = Math.round(d.x), y = Math.round(d.y), z = Math.round(d.z);
  if (y === 1) return 0;
  if (y === -1) return 1;
  if (x === -1) return 2;
  if (x === 1) return 3;
  if (z === 1) return 4;
  return 5;
}

// 复刻 InteractiveCube 的 applyView：orbit.quaternion = qx * qy
const rx = -26, ry = -34;
const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (rx * Math.PI) / 180);
const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (ry * Math.PI) / 180);
const orbitQuat = qx.clone().multiply(qy);

// 模拟一个被 U 转动(+90°绕Y)过的色块：其自身朝向改变，但位于 orbit 内
const cubieQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
const orbit = new THREE.Object3D();
orbit.quaternion.copy(orbitQuat);
const cubie = new THREE.Object3D();
cubie.quaternion.copy(cubieQuat);
orbit.add(cubie);
orbit.updateMatrixWorld(true);

// 命中 F 面（局部法线 +Z），走组件新逻辑
const localNormal = new THREE.Vector3(0, 0, 1);
const nWorld = localNormal.clone().transformDirection(cubie.matrixWorld);
const nEngine = nWorld.applyQuaternion(orbitQuat.clone().invert());
const faceId = faceIdOfDir(nEngine);

// 期望：F 面贴纸经 U 转动后属于 R 面(faceId=3)
const expected = 3;
console.log("nEngine =", [nEngine.x.toFixed(2), nEngine.y.toFixed(2), nEngine.z.toFixed(2)].join(","));
console.log("faceId =", faceId, " expected =", expected);
if (faceId !== expected) {
  console.error("FAIL: 面判定与预期不符（旧逻辑用局部法线会判成 F=4，导致拧错层）");
  process.exit(1);
}
// 对照：旧逻辑（直接用局部法线）会判成 F(4)，在打乱魔方上是错误的
const oldFaceId = faceIdOfDir(localNormal);
console.log("旧逻辑 faceId =", oldFaceId, "(打乱后此判定错误)");
console.log("OK: 新世界法线->引擎坐标 判定正确，修复打乱魔方的拧层面识别");
