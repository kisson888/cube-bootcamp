// 魔方还原教程（层先法 LBL）的分阶段数据与状态推导。
//
// 设计：每个阶段给出「标准解法序列」solution。由它推导练习起始状态：
//   start = 已还原 经 invert(solution) 作用后的状态
// 则 依次施加 solution 必回到已还原（构造性保证）。教程动画演示该过程，
// 互动练习要求用户复现 solution；智能纠错通过比对"正确路径节点"实现。

import { CubeState, createSolved, applyMove, invertMove, isSolved } from "./cube";

export interface TutorialStage {
  id: string;
  /** 阶段分组（用于 stepper 分区） */
  phase: string;
  title: string;
  /** 阶段目标（一句话） */
  goal: string;
  /** 教学说明（动画上方） */
  desc: string;
  /** 标准解法（教学动画 + 练习对照） */
  solution: string[];
  /** 动画主高亮面（FaceId），默认按当前转动面高亮 */
  highlightFace?: number;
  /** 要点提示 */
  tips: string[];
}

// 面编号：U=0 D=1 L=2 R=3 F=4 B=5
export const STAGES: TutorialStage[] = [
  {
    id: "cross",
    phase: "第一阶段 · 底层",
    title: "底层十字（White Cross）",
    goal: "在白色面拼出十字，且四条棱的侧面颜色与中心块对齐。",
    desc:
      "十字是还原的地基。先把四个带白色的棱块归位到底层，让它们的侧面颜色对准对应的中心块。下面用一组转动演示如何把打乱的白色棱块拼成十字。",
    solution: ["R", "U", "R'", "U'", "F", "U", "F'", "L", "U", "L'"],
    highlightFace: 1,
    tips: [
      "先盯住一个白色棱块，把它转到白色面所在层。",
      "棱块的另一颜色必须对准同色中心块，才算真正归位。",
      "保持白色面朝下（D 层），避免破坏已拼好的部分。",
    ],
  },
  {
    id: "corners",
    phase: "第一阶段 · 底层",
    title: "底层角块（Bottom Corners）",
    goal: "把四个白色角块归位，完成整个底层（第一层）。",
    desc:
      "底层角块用「右手公式」把角块送到正确位置。演示：反复用 R' D' R D 把角块就位，让底层完整还原。",
    solution: ["R'", "D'", "R", "D", "R'", "D'", "R", "D"],
    highlightFace: 1,
    tips: [
      "角块带白、带侧、带前三种颜色，要三者都对上。",
      "常用的「右手公式」R' D' R D 每做两遍送好一个角块。",
      "角块暂时放错没关系，多转几轮会自动归位。",
    ],
  },
  {
    id: "middle",
    phase: "第二阶段 · 中层",
    title: "中层棱块（Middle Edges / F2L 基础）",
    goal: "把四个不带黄色的棱块送入中层，完成前两层（F2L）。",
    desc:
      "中层棱块不带黄色，用「上、右、上、右逆」或镜像公式插入。演示把右侧一个棱块塞进中层缺口。",
    solution: ["U", "R", "U", "R'", "U'", "F'", "U'", "F"],
    highlightFace: 4,
    tips: [
      "先判断棱块该去左边还是右边，选对应公式。",
      "公式本质是「抬到顶层 → 转到目标侧 → 插回中层」。",
      "插入前确保目标位置的上方没有被占用。",
    ],
  },
  {
    id: "top-cross",
    phase: "第三阶段 · 顶层",
    title: "顶层十字（Top Cross / OLL 棱）",
    goal: "让顶层出现黄色十字（先不要求翻色）。",
    desc:
      "顶面已经有黄色但散乱时，用 F R U R' U' F' 把黄色棱块摆成十字。这是 OLL 的第一步。",
    solution: ["F", "R", "U", "R'", "U'", "F'"],
    highlightFace: 0,
    tips: [
      "先求「十字」再求「全黄」，分两步走更稳。",
      "公式 F R U R' U' F' 专门把黄色棱块翻成十字。",
      "若已是点/线/拐角，先转 U 对准再套公式。",
    ],
  },
  {
    id: "oll",
    phase: "第三阶段 · 顶层",
    title: "顶层翻色（OLL · 小鱼 Sune）",
    goal: "让整个顶层变成纯黄色。",
    desc:
      "顶层出现「小鱼」形状（仅一个角缺黄）时，用 Sune 公式 R U R' U R U2 R' 把顶面翻全黄。",
    solution: ["R", "U", "R'", "U", "R", "U2", "R'"],
    highlightFace: 0,
    tips: [
      "「小鱼」头朝左上角时，用 R U R' U R U2 R'。",
      "Sune 是 OLL 里最常用、最该背熟的公式之一。",
      "翻色只管顶面颜色，位置对错下一步再调。",
    ],
  },
  {
    id: "pll-corners",
    phase: "第三阶段 · 顶层",
    title: "顶层角块归位（PLL · A 公式）",
    goal: "把顶层四个角块移到正确位置（颜色可能对但朝向待定）。",
    desc:
      "顶面已全黄，但角块位置错乱时，用 A 公式 R' F R' B2 R F' R' B2 R2 把角块两两交换归位。",
    solution: ["R'", "F", "R'", "B2", "R", "F'", "R'", "B2", "R2"],
    highlightFace: 0,
    tips: [
      "先转 U，让一个已对的角块朝向自己作为基准。",
      "A 公式交换「左前/右前」两只角块，其余不动。",
      "做完后角块位置正确，可能还需要翻朝向。",
    ],
  },
  {
    id: "pll-edges",
    phase: "第三阶段 · 顶层",
    title: "顶层棱块归位（PLL · T 公式）",
    goal: "把顶层四条棱块归位，完成整个魔方还原！",
    desc:
      "最后一步：顶层只剩棱块位置不对时，用 T 公式 R U R' U' R' F R2 U' R' U' R U R' F' 把棱块归位，魔方复原。",
    solution: ["R", "U", "R'", "U'", "R'", "F", "R2", "U'", "R'", "U'", "R", "U", "R'", "F'"],
    highlightFace: 0,
    tips: [
      "这是最后一步，做完即还原，成就感拉满。",
      "T 公式同时换一只角块和三条棱，属经典 PLL。",
      "若方向还差，再转一次 U 微调即可。",
    ],
  },
];

export function getStage(id: string): TutorialStage | undefined {
  return STAGES.find((s) => s.id === id);
}

/** 由 solution 反推练习起始状态：start = 已还原 经 invert(solution) 得到。 */
export function buildStart(stage: TutorialStage): CubeState {
  const inv = [...stage.solution].reverse().map(invertMove); // [inv(sn) ... inv(s1)]
  let s = createSolved();
  for (const m of inv) s = applyMove(s, m);
  return s;
}

/** 预计算正确路径：states[0]=start，states[k]=施加前 k 步后的状态，states[last]=已还原。 */
export function buildPath(stage: TutorialStage): { states: CubeState[]; moves: string[] } {
  const start = buildStart(stage);
  const states: CubeState[] = [start];
  for (const m of stage.solution) states.push(applyMove(states[states.length - 1], m));
  return { states, moves: stage.solution };
}

export function isStageSolved(state: CubeState): boolean {
  return isSolved(state);
}
