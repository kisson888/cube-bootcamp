import { computeTurn, groupOf, applyOrbit, cross, add, scale } from "../frontend/src/lib/cube3d";
import { NORMALS } from "../frontend/src/lib/cube";

// 物理模型（「拖拽拧层」）：抓住面上的某个 cubie，沿面内方向拖动，
// 被转动的层 = 转轴垂直于拖拽方向、且位于该面平面内的层。
//   · 前(F)面 横向拖 -> 水平层 U/E/D（取决于抓取高度）
//   · 前(F)面 纵向拖 -> 前/侧层 F/M/L（取决于抓取列）
//   · 上(U)面 横向拖 -> 前/后层 F/B/S（取决于抓取前后）
//   · 右(R)面 纵向拖 -> 前/后层 F/B/S（取决于抓取前后）
function expect(desc: string, got: any, want: any) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✓" : "✗"} ${desc} => ${JSON.stringify(got)}${ok ? "" : "  (期望 " + JSON.stringify(want) + ")"}`);
  if (!ok) process.exitCode = 1;
}

const rot = { x: -22, y: -28 };

// 1) F 面「顶层」cubie (1,1,1)，向右拖 -> 水平顶层 U
{
  const p = computeTurn(4, [1, 1, 1], 120, 0, rot);
  console.log("F 顶层右拖:", JSON.stringify(p));
  expect("F顶层右拖 => 轴=Y(1)", p?.axis, 1);
  expect("F顶层右拖 => 层=顶层(1)", p?.layerCoord, 1);
  expect("F顶层右拖 => move 以 U 开头", p?.move?.startsWith("U"), true);
}

// 2) F 面「中层」cubie (1,0,1)，向右拖 -> 中层 E
{
  const p = computeTurn(4, [0, 0, 1], 120, 0, rot);
  console.log("F 中层右拖:", JSON.stringify(p));
  expect("F中层右拖 => 轴=Y(1)", p?.axis, 1);
  expect("F中层右拖 => 层=中层(0)", p?.layerCoord, 0);
  expect("F中层右拖 => move 以 E 开头", p?.move?.startsWith("E"), true);
}

// 3) F 面「右列」cubie (1,0,1)，向上拖 -> 右层 R
{
  const p = computeTurn(4, [1, 0, 1], 0, -120, rot);
  console.log("F 右列上拖:", JSON.stringify(p));
  expect("F右列上拖 => 轴=X(0)", p?.axis, 0);
  expect("F右列上拖 => 层=右层(1)", p?.layerCoord, 1);
  expect("F右列上拖 => move 以 R 开头", p?.move?.startsWith("R"), true);
}

// 4) U 面「前缘」cubie (0,1,1)，向右拖 -> 前层 F
{
  const p = computeTurn(0, [0, 1, 1], 120, 0, rot);
  console.log("U 前缘右拖:", JSON.stringify(p));
  expect("U前缘右拖 => 轴=Z(2)", p?.axis, 2);
  expect("U前缘右拖 => 层=前层(1)", p?.layerCoord, 1);
  expect("U前缘右拖 => move 以 F 开头", p?.move?.startsWith("F"), true);
}

// 5) R 面 cubie (1,0,1)，向上拖 -> 前/后层（轴=Z）
{
  const p = computeTurn(3, [1, 0, 1], 0, -120, rot);
  console.log("R 上拖:", JSON.stringify(p));
  expect("R面上拖 => 轴=Z(2)", p?.axis, 2);
}

// 6) groupOf 映射完整校验
expect("groupOf(1,1)=U", groupOf(1, 1), "U");
expect("groupOf(1,-1)=D", groupOf(1, -1), "D");
expect("groupOf(1,0)=E", groupOf(1, 0), "E");
expect("groupOf(0,1)=R", groupOf(0, 1), "R");
expect("groupOf(0,-1)=L", groupOf(0, -1), "L");
expect("groupOf(0,0)=M", groupOf(0, 0), "M");
expect("groupOf(2,1)=F", groupOf(2, 1), "F");
expect("groupOf(2,-1)=B", groupOf(2, -1), "B");
expect("groupOf(2,0)=S", groupOf(2, 0), "S");

// 7) 叉乘应给出面内「垂直」轴（F 向右 -> +Y）
{
  const N = NORMALS[4]; // F
  const drag = [1, 0, 0]; // 向右
  const ax = cross(N, drag);
  console.log("F向右 drag 叉乘轴:", ax.map((x) => x.toFixed(2)).join(","));
  expect("叉乘轴应为 +Y(0,1,0)", [ax[1] > 0.9 && Math.abs(ax[0]) < 0.1 && Math.abs(ax[2]) < 0.1], [true]);
}

// 8) 投影 sanity：face basis 在屏幕上的投影不应退化
{
  const S1 = applyOrbit([1, 0, 0], rot.x, rot.y);
  const S2 = applyOrbit([0, 1, 0], rot.x, rot.y);
  console.log("t1 screen:", S1.map((x) => x.toFixed(2)).join(","), " t2 screen:", S2.map((x) => x.toFixed(2)).join(","));
  expect("投影非退化(det!=0)", Math.abs(S1[0] * S2[1] - S2[0] * S1[1]) > 1e-3, true);
}

console.log("\n全部场景校验完毕。");
