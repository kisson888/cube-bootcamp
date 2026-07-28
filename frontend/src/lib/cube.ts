// 魔方状态模型与转动引擎（纯 TS，无 DOM 依赖，可单测）。
//
// 表示法：三阶魔方由 26 个 cubie（不含体心）组成，每个 cubie 携带 1~3 个贴面。
// 状态用字典描述：键为 "x,y,z,dx,dy,dz"（cubie 坐标 + 贴面朝向），值为该贴面当前颜色（FaceId）。
// cubie 坐标 (x,y,z) ∈ {-1,0,1}^3 排除 (0,0,0)；朝向为 ±x/±y/±z 单位向量。
// 已还原时：任意贴面颜色 = 其朝向对应的面（FaceId）。

export type CubeState = Record<string, number>;

// 面编号与朝向：U=0(上,+y) D=1(下,-y) L=2(左,-x) R=3(右,+x) F=4(前,+z) B=5(后,-z)
export const FACE = { U: 0, D: 1, L: 2, R: 3, F: 4, B: 5 } as const;
export type FaceId = 0 | 1 | 2 | 3 | 4 | 5;

type Vec3 = [number, number, number];

const NORMALS: Record<number, Vec3> = {
  0: [0, 1, 0],
  1: [0, -1, 0],
  2: [-1, 0, 0],
  3: [1, 0, 0],
  4: [0, 0, 1],
  5: [0, 0, -1],
};

// 顺时针转动（从面外侧观察）对应的 3D 旋转：绕该面外法线 +90°。
// 中层转动（E/M/S）复用对应面转动的 3D 旋转，仅作用的层不同。
const ROT: Record<string, (v: Vec3) => Vec3> = {
  U: ([x, y, z]) => [z, y, -x],
  D: ([x, y, z]) => [-z, y, x],
  L: ([x, y, z]) => [x, z, -y],
  R: ([x, y, z]) => [x, -z, y],
  F: ([x, y, z]) => [-y, x, z],
  B: ([x, y, z]) => [y, -x, z],
  E: ([x, y, z]) => [-z, y, x], // = D 的 3D 旋转
  M: ([x, y, z]) => [x, z, -y], // = L 的 3D 旋转
  S: ([x, y, z]) => [-y, x, z], // = F 的 3D 旋转
};

// 每个面转动所影响的层：沿某轴、某符号的 cubie。
const LAYER: Record<string, { axis: 0 | 1 | 2; sign: number }> = {
  U: { axis: 1, sign: 1 },
  D: { axis: 1, sign: -1 },
  L: { axis: 0, sign: -1 },
  R: { axis: 0, sign: 1 },
  F: { axis: 2, sign: 1 },
  B: { axis: 2, sign: -1 },
  E: { axis: 1, sign: 0 }, // 中层
  M: { axis: 0, sign: 0 },
  S: { axis: 2, sign: 0 },
};

export const MOVES: string[] = [
  "U", "U'", "U2", "D", "D'", "D2",
  "L", "L'", "L2", "R", "R'", "R2",
  "F", "F'", "F2", "B", "B'", "B2",
  "E", "E'", "E2", "M", "M'", "M2", "S", "S'", "S2",
];

function key(x: number, y: number, z: number, dx: number, dy: number, dz: number): string {
  return `${x},${y},${z},${dx},${dy},${dz}`;
}

function faceIdOf(d: Vec3): number {
  if (d[1] === 1) return 0;
  if (d[1] === -1) return 1;
  if (d[0] === -1) return 2;
  if (d[0] === 1) return 3;
  if (d[2] === 1) return 4;
  if (d[2] === -1) return 5;
  return -1;
}

// 生成已还原状态。
export function createSolved(): CubeState {
  const s: CubeState = {};
  for (const x of [-1, 0, 1])
    for (const y of [-1, 0, 1])
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        const dirs: Vec3[] = [];
        if (x !== 0) dirs.push([x, 0, 0]);
        if (y !== 0) dirs.push([0, y, 0]);
        if (z !== 0) dirs.push([0, 0, z]);
        for (const d of dirs) s[key(x, y, z, d[0], d[1], d[2])] = faceIdOf(d);
      }
  return s;
}

// 施加一次转动，返回新状态（不可变）。
export function applyMove(state: CubeState, move: string): CubeState {
  const face = move[0];
  const suffix = move.length > 1 ? move.slice(1) : "";
  const times = suffix === "'" ? 3 : suffix === "2" ? 2 : 1;
  const rot = ROT[face];
  const { axis, sign } = LAYER[face];
  const ns: CubeState = {};
  for (const k in state) {
    const [x, y, z, dx, dy, dz] = k.split(",").map(Number);
    const coord = axis === 0 ? x : axis === 1 ? y : z;
    if (coord === sign) {
      let p: Vec3 = [x, y, z];
      let d: Vec3 = [dx, dy, dz];
      for (let t = 0; t < times; t++) {
        p = rot(p);
        d = rot(d);
      }
      ns[key(p[0], p[1], p[2], d[0], d[1], d[2])] = state[k];
    } else {
      ns[k] = state[k];
    }
  }
  return ns;
}

// 取得某面的 3×3 颜色矩阵（row,col 自左上起）。
const FACE_GRID: Record<number, (i: number, j: number) => [number, number, number, number, number, number]> = {
  0: (i, j) => [j - 1, 1, i - 1, 0, 1, 0], // U
  1: (i, j) => [j - 1, -1, 1 - i, 0, -1, 0], // D
  4: (i, j) => [j - 1, 1 - i, 1, 0, 0, 1], // F
  5: (i, j) => [1 - j, 1 - i, -1, 0, 0, -1], // B
  3: (i, j) => [1, 1 - i, 1 - j, 1, 0, 0], // R
  2: (i, j) => [-1, 1 - i, j - 1, -1, 0, 0], // L
};

export function getFaceColors(state: CubeState, face: number): number[][] {
  const g: number[][] = [[], [], []];
  const f = FACE_GRID[face];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const [x, y, z, dx, dy, dz] = f(i, j);
      g[i][j] = state[key(x, y, z, dx, dy, dz)];
    }
  return g;
}

export function isSolved(state: CubeState): boolean {
  for (let f = 0; f < 6; f++) {
    const g = getFaceColors(state, f);
    const c = g[0][0];
    for (const row of g) for (const v of row) if (v !== c) return false;
  }
  return true;
}

export function invertMove(m: string): string {
  if (m.endsWith("2")) return m;
  if (m.endsWith("'")) return m[0];
  return m + "'";
}

export function scramble(
  state: CubeState,
  n = 20,
  rng: () => number = Math.random
): CubeState {
  let s = state;
  let last = "";
  for (let k = 0; k < n; k++) {
    let m: string;
    do {
      m = MOVES[Math.floor(rng() * MOVES.length)];
    } while (m[0] === last);
    last = m[0];
    s = applyMove(s, m);
  }
  return s;
}

// 面编号 -> 标准配色（供 UI 使用）。
export const FACE_COLORS: string[] = [
  "#f8fafc", // U 白
  "#facc15", // D 黄
  "#fb923c", // L 橙
  "#ef4444", // R 红
  "#22c55e", // F 绿
  "#3b82f6", // B 蓝
];

export const FACE_NAMES: string[] = ["U", "D", "L", "R", "F", "B"];

export { NORMALS };
