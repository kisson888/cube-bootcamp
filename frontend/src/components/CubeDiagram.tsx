import { useEffect, useMemo, useRef, useState } from "react";
import {
  CubeState,
  createSolved,
  applyMove,
  invertMove,
  scramble,
  isSolved,
} from "../lib/cube";
import InteractiveCube from "./InteractiveCube";
import MoveControls from "./MoveControls";

const FACE_CHAR: Record<string, number> = { U: 0, D: 1, L: 2, R: 3, F: 4, B: 5 };
const faceId = (m: string) => FACE_CHAR[m[0]];

const Card = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
    <div className="text-sm font-bold text-brand-700 mb-1">{title}</div>
    {hint && <p className="text-xs text-slate-500 mb-3">{hint}</p>}
    {children}
  </div>
);

/** 记号演示：点击面字母，单次转动并高亮 */
function NotationDemo() {
  const [cube, setCube] = useState<CubeState>(createSolved);
  const [hi, setHi] = useState<number | null>(null);
  const apply = (f: string) => {
    setCube((c) => applyMove(c, f));
    setHi(faceId(f));
  };
  const faces: [string, string][] = [
    ["U", "上"],
    ["D", "下"],
    ["L", "左"],
    ["R", "右"],
    ["F", "前"],
    ["B", "后"],
  ];
  return (
    <Card title="🎯 互动演示：标准转动记号" hint="点击下方按钮，观察对应面顺时针转 90°（带 ′ 为逆时针，带 2 为 180°）。">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <InteractiveCube state={cube} size={240} initialView="net" highlightFace={hi} />
        <div className="grid grid-cols-3 gap-2">
          {faces.map(([f, label]) => (
            <button
              key={f}
              onClick={() => apply(f)}
              className="w-14 h-14 rounded-xl bg-brand-50 text-brand-700 font-extrabold text-lg hover:bg-brand-100 active:bg-brand-200 transition"
            >
              {f}
              <span className="block text-[10px] font-medium text-brand-500">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

/** 小鱼公式动画：播放 / 单步 / 切换变体 */
function FishSune() {
  const SEQ: Record<string, string[]> = {
    sune: ["R", "U", "R'", "U", "R", "U2", "R'"],
    antisune: ["R'", "U'", "R", "U'", "R'", "U2", "R"],
  };
  const [variant, setVariant] = useState<"sune" | "antisune">("sune");
  const seq = SEQ[variant];

  const states = useMemo(() => {
    const arr = [createSolved()];
    for (const m of seq) arr.push(applyMove(arr[arr.length - 1], m));
    return arr;
  }, [variant]);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setIdx((i) => {
        if (i >= states.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 850);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, states.length]);

  const reset = () => {
    setPlaying(false);
    setIdx(0);
  };
  const cube = states[idx];
  const currentMove = idx > 0 ? seq[idx - 1] : null;
  const hi = currentMove ? faceId(currentMove) : null;

  return (
    <Card
      title="🐟 互动动画：顶层「小鱼」公式"
      hint="层先法最后一步常用：顶面出现小鱼形状时，用对应公式把最后一层归位。可播放或单步观察每一步。"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <InteractiveCube state={cube} size={240} initialView="net" highlightFace={hi} />
        <div className="space-y-3 w-full max-w-xs">
          <div className="flex gap-1.5 text-xs">
            <button
              onClick={() => setVariant("sune")}
              className={`px-3 py-1 rounded-md transition ${
                variant === "sune" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              小鱼1（Sune）
            </button>
            <button
              onClick={() => {
                setVariant("antisune");
                reset();
              }}
              className={`px-3 py-1 rounded-md transition ${
                variant === "antisune" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              小鱼2（Antisune）
            </button>
          </div>

          <div className="text-sm">
            当前步骤：
            <span className="ml-1 px-2 py-0.5 rounded bg-brand-100 text-brand-700 font-bold">
              {currentMove ?? "起始（已还原）"}
            </span>
            <span className="ml-2 text-slate-400">
              {idx}/{seq.length}
            </span>
          </div>

          <div className="font-mono text-xs bg-slate-900 text-slate-100 rounded-lg px-3 py-2 break-all">
            {seq.join(" ")}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
            >
              {playing ? "⏸ 暂停" : "▶ 播放"}
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(i + 1, seq.length))}
              className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition"
            >
              ⏭ 单步
            </button>
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition"
            >
              ⟲ 重置
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** 内嵌精简可玩魔方 */
function PlaygroundMini() {
  const [cube, setCube] = useState<CubeState>(createSolved);
  const [history, setHistory] = useState<string[]>([]);
  const move = (m: string) => {
    setCube((c) => applyMove(c, m));
    setHistory((h) => [...h, m]);
  };
  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setCube((c) => applyMove(c, invertMove(last)));
    setHistory((h) => h.slice(0, -1));
  };
  const reset = () => {
    setCube(createSolved());
    setHistory([]);
  };
  const doScramble = () => {
    setCube(scramble(createSolved(), 15));
    setHistory([]);
  };
  return (
    <Card title="🎮 互动魔方（试玩）" hint="亲手打乱、转动、复位，体验完整还原流程。">
      <div className="flex flex-col sm:flex-row gap-5 items-center">
        <InteractiveCube state={cube} size={260} />
        <MoveControls
          onMove={move}
          onScramble={doScramble}
          onReset={reset}
          onUndo={undo}
          solved={isSolved(cube)}
          canUndo={history.length > 0}
        />
      </div>
    </Card>
  );
}

export default function CubeDiagram({ type }: { type: string }) {
  switch (type) {
    case "notation-demo":
      return <NotationDemo />;
    case "fish-sune":
      return <FishSune />;
    case "playground":
      return <PlaygroundMini />;
    default:
      return (
        <div className="text-xs text-red-500">未知示意图类型：{type}</div>
      );
  }
}
