// 3D 魔方渲染与「拖拽拧层」的几何/数学（纯函数，可单测）。
// 约定：引擎坐标 y 轴向上（与 cube.ts 一致）；CSS 坐标 y 轴向下。
import type { CubeState } from "./cube";
import { NORMALS } from "./cube";

export type Vec3 = [number, number, number];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: Vec3): Vec3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// 各面的「局部切向基」：t1=面上向右，t2=面上向上（引擎坐标）
export const FACE_BASIS: Record<number, { t1: Vec3; t2: Vec3 }> = {
  0: { t1: [1, 0, 0], t2: [0, 0, -1] }, // U
  1: { t1: [1, 0, 0], t2: [0, 0, 1] }, // D
  2: { t1: [0, 0, 1], t2: [0, 1, 0] }, // L
  3: { t1: [0, 0, -1], t2: [0, 1, 0] }, // R
  4: { t1: [1, 0, 0], t2: [0, 1, 0] }, // F
  5: { t1: [-1, 0, 0], t2: [0, 1, 0] }, // B
};

// 把向量按容器轨道变换 rotateX(rx) rotateY(ry) 旋转（与 CSS 约定一致：y 向下）
export function applyOrbit(v: Vec3, rx: number, ry: number): Vec3 {
  const d = (x: number) => (x * Math.PI) / 180;
  let [x, y, z] = v;
  const cy = Math.cos(d(ry)), sy = Math.sin(d(ry));
  [x, y, z] = [x * cy + z * sy, y, -x * sy + z * cy]; // rotateY
  const cx = Math.cos(d(rx)), sx = Math.sin(d(rx));
  [x, y, z] = [x, y * cx - z * sx, y * sx + z * cx]; // rotateX
  return [x, y, z];
}

export function faceIdOfDir(d: Vec3): number {
  if (d[1] === 1) return 0;
  if (d[1] === -1) return 1;
  if (d[0] === -1) return 2;
  if (d[0] === 1) return 3;
  if (d[2] === 1) return 4;
  return 5;
}

export interface Facelet {
  dir: Vec3; // 引擎坐标下的外法线方向
  faceId: number;
  color: number; // FaceId（0-5）
}

export interface Cubie {
  pos: Vec3; // 引擎坐标 (-1..1)
  facelets: Facelet[];
}

const DIRS: Vec3[] = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];

// 由 CubeState 推导 26 个 cubie 及其外露贴面
export function getCubies(state: CubeState): Cubie[] {
  const out: Cubie[] = [];
  for (const x of [-1, 0, 1])
    for (const y of [-1, 0, 1])
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        const facelets: Facelet[] = [];
        for (const d of DIRS) {
          if (d[0] !== 0 && x !== d[0]) continue;
          if (d[1] !== 0 && y !== d[1]) continue;
          if (d[2] !== 0 && z !== d[2]) continue;
          const color = state[`${x},${y},${z},${d[0]},${d[1]},${d[2]}`];
          if (color === undefined) continue;
          facelets.push({ dir: d, faceId: faceIdOfDir(d), color });
        }
        out.push({ pos: [x, y, z], facelets });
      }
  return out;
}

// cubie 局部面的 CSS 朝向（h = cubie 半边长；用引擎方向，y 轴做翻转以适配 CSS）
export function faceCssTransform(d: Vec3, h: number): string {
  const [dx, dy, dz] = d;
  if (dz === 1) return `translateZ(${h}px)`;
  if (dz === -1) return `rotateY(180deg) translateZ(${h}px)`;
  if (dx === 1) return `rotateY(90deg) translateZ(${h}px)`;
  if (dx === -1) return `rotateY(-90deg) translateZ(${h}px)`;
  if (dy === 1) return `rotateX(90deg) translateZ(${h}px)`; // 引擎 +Y(上) -> CSS -Y(上)
  return `rotateX(-90deg) translateZ(${h}px)`; // 引擎 -Y(下)
}

// 由转轴(axis)与层坐标(layerCoord)得到转动字母
export function groupOf(axis: number, layerCoord: number): string {
  if (axis === 1) return layerCoord === 1 ? "U" : layerCoord === -1 ? "D" : "E";
  if (axis === 0) return layerCoord === 1 ? "R" : layerCoord === -1 ? "L" : "M";
  return layerCoord === 1 ? "F" : layerCoord === -1 ? "B" : "S";
}

export interface TurnPlan {
  axis: number; // 0/1/2（引擎坐标轴）
  layerCoord: number; // -1/0/1
  eM: Vec3; // 该层转动的引擎轴（外法线方向，单位向量）
  progress: number; // -1..1，拖拽进度（符号决定顺/逆）
  move: string; // 形如 "U" / "U'"
}

// 核心：在 faceId 面上、抓取 cubie pos、屏幕拖拽(dx,dy)、当前轨道角 rot => 应执行的层转动
export function computeTurn(
  faceId: number,
  pos: Vec3,
  dx: number,
  dy: number,
  rot: { x: number; y: number }
): TurnPlan | null {
  const N = NORMALS[faceId];
  const { t1, t2 } = FACE_BASIS[faceId];
  // 把面基投影到屏幕 2D（y 向下，与拖拽 dy 同向）。
  // 注意：applyOrbit 返回的是引擎坐标（y 向上），而屏幕/拖拽 dy 是 y 向下，
  // 故这里对 y 取反，否则竖直拖拽方向会反向（向下拖却向上拧）。
  const S1 = applyOrbit(t1, rot.x, rot.y);
  const S2 = applyOrbit(t2, rot.x, rot.y);
  const s1 = { x: S1[0], y: -S1[1] };
  const s2 = { x: S2[0], y: -S2[1] };
  const det = s1.x * s2.y - s2.x * s1.y;
  if (Math.abs(det) < 1e-6) return null;
  const a = (dx * s2.y - dy * s2.x) / det;
  const b = (s1.x * dy - dx * s1.y) / det;
  const dragDir = norm(add(scale(t1, a), scale(t2, b))); // 面上的拖拽方向（引擎局部）
  const axisVec = cross(N, dragDir); // 转动轴（引擎局部）
  const comps = [Math.abs(axisVec[0]), Math.abs(axisVec[1]), Math.abs(axisVec[2])];
  let axis = 0;
  if (comps[1] >= comps[0] && comps[1] >= comps[2]) axis = 1;
  else if (comps[2] >= comps[0] && comps[2] >= comps[1]) axis = 2;
  else axis = 0;
  const axisSign = axisVec[axis] >= 0 ? 1 : -1;
  const eM: Vec3 = [axis === 0 ? axisSign : 0, axis === 1 ? axisSign : 0, axis === 2 ? axisSign : 0];
  const layerCoord = pos[axis];
  // 手指沿 +转动 方向滑动时，抓取点应有的切向
  const tangent = norm(cross(eM, pos));
  const disp = dot(dragDir, tangent); // 带符号的弧长比例
  const h = Math.hypot(a, b); // 面内拖拽幅度（cubie 单位）
  const r = Math.max(len(sub(pos, [axis === 0 ? pos[axis] : 0, axis === 1 ? pos[axis] : 0, axis === 2 ? pos[axis] : 0] as Vec3)), 0.6);
  const progress = clamp((h / r) * 1.15 * Math.sign(disp || 1), -1, 1);
  // 实际施加的转动 = eM(带符号的转轴) × progress，故 move 的顺/逆必须同时考虑
  // 转轴符号与 progress 符号，否则会与真实视觉转动不一致（例如向上拖 F、向下拖却是 F 而非 F'）。
  const dirSign = eM[axis] * Math.sign(progress || 1);
  const move = groupOf(axis, layerCoord) + (dirSign >= 0 ? "" : "'");
  return { axis, layerCoord, eM, progress, move };
}

// 把引擎转轴转成 CSS 坐标下的轴（y 翻转，且手性反转 => 角度取反）
export function cssRotation(eM: Vec3, progress: number): { axis: Vec3; angle: number } {
  const axisCss: Vec3 = [eM[0], -eM[1], eM[2]];
  // 非逆(progress>0) 对应 CSS -90*progress；逆对应 +90
  const angle = -90 * progress;
  return { axis: axisCss, angle };
}
