// 模拟 CubePractice 的纠错状态机：正确路径应逐步命中节点并最终还原；
// 偏离路径应判定为 off（找不到匹配节点）。
import { applyMove, invertMove, isSolved, CubeState } from "../frontend/src/lib/cube.ts";
import { STAGES, buildPath } from "../frontend/src/lib/tutorial.ts";

function eq(a: CubeState, b: CubeState): boolean {
  const ak = Object.keys(a);
  if (ak.length !== Object.keys(b).length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}

let fail = 0;
for (const stage of STAGES) {
  const { states, moves } = buildPath(stage);
  let cur = states[0];
  let onPath = 0;
  let ok = true;
  // 正确路径：依次施加 solution
  for (let i = 0; i < moves.length; i++) {
    cur = applyMove(cur, moves[i]);
    const k = states.findIndex((s) => eq(s, cur));
    if (k < 0) {
      ok = false;
      break;
    }
    onPath = Math.max(onPath, k);
  }
  const solvedAtEnd = isSolved(cur);
  if (!ok || !solvedAtEnd || onPath !== states.length - 1) {
    console.error(`✗ [${stage.id}] 正确路径模拟失败 ok=${ok} solved=${solvedAtEnd} onPath=${onPath}`);
    fail++;
  }

  // 偏离路径：从 start 施加一个非首步的转动
  const wrong = moves[0] === "U" ? "D" : "U";
  const off = applyMove(states[0], wrong);
  const offIdx = states.findIndex((s) => eq(s, off));
  if (offIdx >= 0) {
    console.error(`✗ [${stage.id}] 偏离态竟命中路径节点（巧合，需关注）offIdx=${offIdx}`);
    // 非致命，仅提示
  }
  // 撤销偏离应回到 start
  const back = applyMove(off, invertMove(wrong));
  if (!eq(back, states[0])) {
    console.error(`✗ [${stage.id}] 撤销未能回到 start`);
    fail++;
  }
  if (ok && solvedAtEnd) console.log(`✓ [${stage.id}] 正确路径命中全部 ${states.length - 1} 节点并还原`);
}

console.log(fail === 0 ? "\n练习状态机模拟通过 ✅" : `\n失败 ${fail} 项 ❌`);
process.exit(fail === 0 ? 0 : 1);
