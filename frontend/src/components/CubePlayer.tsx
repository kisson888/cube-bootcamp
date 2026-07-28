import { useEffect, useRef, useState } from "react";
import { CubeState } from "../lib/cube";
import InteractiveCube from "./InteractiveCube";

interface Props {
  /** 预计算的状态序列：states[0]=起始，states[last]=终点 */
  states: CubeState[];
  /** 相邻状态之间的转动；moves.length === states.length - 1 */
  moves: string[];
  /** 由转动推导高亮面（FaceId）；默认取转动首字母对应面 */
  faceOfMove?: (move: string) => number | null;
  size?: number;
}

const FACE_CHAR: Record<string, number> = { U: 0, D: 1, L: 2, R: 3, F: 4, B: 5 };
const faceOf = (m: string) => (FACE_CHAR[m[0]] ?? null);

const BASE_MS = 950;

export default function CubePlayer({ states, moves, faceOfMove, size = 300 }: Props) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x / 2x / 4x
  const timer = useRef<number | null>(null);

  const last = states.length - 1;

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setIdx((i) => {
        if (i >= last) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, BASE_MS / speed);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, speed, last]);

  const reset = () => {
    setPlaying(false);
    setIdx(0);
  };
  const cur = states[idx];
  const currentMove = idx > 0 ? moves[idx - 1] : null;
  const hi = currentMove ? (faceOfMove ? faceOfMove(currentMove) : faceOf(currentMove)) : null;

  const speeds = [1, 2, 4];
  const cycleSpeed = () =>
    setSpeed((s) => speeds[(speeds.indexOf(s) + 1) % speeds.length]);

  return (
    <div className="flex flex-col items-center">
      <InteractiveCube state={cur} size={size} initialView="3d" highlightFace={hi} enableTurn={false} />

      {/* 当前步标签 */}
      <div className="mt-2 text-sm text-slate-600">
        当前转动：
        <span className="ml-1 px-2 py-0.5 rounded bg-brand-100 text-brand-700 font-bold font-mono">
          {currentMove ?? "起始状态"}
        </span>
        <span className="ml-2 text-slate-400">
          {idx}/{last}
        </span>
      </div>

      {/* 进度条（可点击跳转） */}
      <div className="mt-3 w-full max-w-md">
        <input
          type="range"
          min={0}
          max={last}
          value={idx}
          onChange={(e) => {
            setPlaying(false);
            setIdx(Number(e.target.value));
          }}
          className="w-full accent-brand-600"
          aria-label="动画进度"
        />
      </div>

      {/* 传输控制 */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition"
          title="重置到起始"
        >
          ⟲ 重置
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setIdx((i) => Math.max(0, i - 1));
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition"
          title="上一步（快退）"
        >
          ⏮ 快退
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="px-5 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition min-w-[88px]"
        >
          {playing ? "⏸ 暂停" : "▶ 播放"}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setIdx((i) => Math.min(last, i + 1));
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition"
          title="下一步（快进）"
        >
          ⏭ 快进
        </button>
        <button
          onClick={cycleSpeed}
          className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-sm font-semibold hover:bg-amber-200 transition"
          title="切换播放速度"
        >
          ⏩ {speed}x
        </button>
      </div>
    </div>
  );
}
