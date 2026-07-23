// 校验 tutorial.ts 的阶段数据：start + solution 必回到已还原，且 start 非平凡。
import { MOVES, isSolved, CubeState } from "../frontend/src/lib/cube.ts";
import { STAGES, buildStart, buildPath } from "../frontend/src/lib/tutorial.ts";

const MOVE_SET = new Set(MOVES);
let fail = 0;

function eq(a: CubeState, b: CubeState): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}

for (const s of STAGES) {
  // 1) 解法合法
  const bad = s.solution.filter((m) => !MOVE_SET.has(m));
  if (bad.length) {
    console.error(`✗ [${s.id}] 非法转动: ${bad.join(" ")}`);
    fail++;
    continue;
  }
  const start = buildStart(s);
  const { states, moves } = buildPath(s);
  // 2) 起始非平凡
  if (isSolved(start)) {
    console.error(`✗ [${s.id}] start 已是还原态（阶段无效）`);
    fail++;
  }
  // 3) 路径终点已还原
  if (!isSolved(states[states.length - 1])) {
    console.error(`✗ [${s.id}] 施加 solution 后未还原`);
    fail++;
  }
  // 4) 路径单调推进（无相邻重复态）
  for (let i = 1; i < states.length; i++) {
    if (eq(states[i - 1], states[i])) {
      console.error(`✗ [${s.id}] 第 ${i} 步无效（状态未变）`);
      fail++;
      break;
    }
  }
  console.log(
    `✓ [${s.id}] ${s.title}  解法 ${moves.length} 步，路径 ${states.length} 态，start 非平凡=${!isSolved(start)}`
  );
}

console.log(fail === 0 ? "\n全部阶段校验通过 ✅" : `\n失败 ${fail} 项 ❌`);
process.exit(fail === 0 ? 0 : 1);
