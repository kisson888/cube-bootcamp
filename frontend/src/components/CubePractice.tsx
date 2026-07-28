import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { CubeState, applyMove, invertMove, isSolved } from "../lib/cube";
import { TutorialStage, buildPath } from "../lib/tutorial";
import { TutorialScore } from "../lib/profile";
import InteractiveCube from "./InteractiveCube";
import MoveControls from "./MoveControls";

const FACE_CHAR: Record<string, number> = { U: 0, D: 1, L: 2, R: 3, F: 4, B: 5 };
const faceOf = (m: string) => FACE_CHAR[m[0]] ?? null;

function eq(a: CubeState, b: CubeState): boolean {
  const ak = Object.keys(a);
  if (ak.length !== Object.keys(b).length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}

interface Props {
  stage: TutorialStage;
  size?: number;
  onComplete: (score: TutorialScore) => void;
}

export default function CubePractice({ stage, size = 300, onComplete }: Props) {
  const { states, moves } = useMemo(() => buildPath(stage), [stage]);
  const start = states[0];
  const total = moves.length;

  const [cube, setCube] = useState<CubeState>(start);
  const [userMoves, setUserMoves] = useState<string[]>([]);
  const [onPath, setOnPath] = useState(0); // 已匹配到的最高正确路径节点
  const [status, setStatus] = useState<"practicing" | "off" | "done">("practicing");
  const [showHint, setShowHint] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  const startRef = useRef<number>(Date.now());
  const tick = useRef<number | null>(null);

  // 计时
  useEffect(() => {
    startRef.current = Date.now();
    tick.current = window.setInterval(() => {
      if (!done) setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [done, stage.id]);

  const expectedMove = (): string | null => {
    const k = status === "off" ? onPath : onPath;
    return k < total ? moves[k] : null;
  };

  const finish = useCallback(
    (finalMoves: string[]) => {
      const t = Math.floor((Date.now() - startRef.current) / 1000);
      setDone(true);
      setStatus("done");
      onComplete({ stageId: stage.id, moves: finalMoves.length, timeSec: t, date: new Date().toISOString().slice(0, 10) });
    },
    [onComplete, stage.id]
  );

  const apply = (m: string) => {
    if (done) return;
    const next = applyMove(cube, m);
    const nextMoves = [...userMoves, m];
    setCube(next);
    setUserMoves(nextMoves);

    if (isSolved(next)) {
      finish(nextMoves);
      return;
    }
    // 是否在正确路径上
    const k = states.findIndex((s) => eq(s, next));
    if (k >= 0) {
      setOnPath(Math.max(onPath, k));
      setStatus("practicing");
    } else {
      setStatus("off");
    }
  };

  const undo = () => {
    if (done || userMoves.length === 0) return;
    const last = userMoves[userMoves.length - 1];
    const prev = applyMove(cube, invertMove(last));
    const prevMoves = userMoves.slice(0, -1);
    setCube(prev);
    setUserMoves(prevMoves);
    const k = states.findIndex((s) => eq(s, prev));
    setOnPath(k >= 0 ? k : onPath);
    setStatus(k >= 0 ? "practicing" : "off");
  };

  const reset = () => {
    setCube(start);
    setUserMoves([]);
    setOnPath(0);
    setStatus("practicing");
    setShowHint(false);
    setDone(false);
    setElapsed(0);
    startRef.current = Date.now();
  };

  const exp = expectedMove();
  const expFace = exp ? faceOf(exp) : null;

  return (
    <div className="grid md:grid-cols-2 gap-5 items-start">
      {/* 左：魔方 + 状态反馈 */}
      <div>
        <InteractiveCube state={cube} size={size} initialView="3d" highlightFace={expFace} onMove={apply} />

        {/* 反馈条 */}
        <div className="mt-3">
          {status === "done" ? (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
              🎉 完成！你用 <b>{userMoves.length}</b> 步、<b>{elapsed}</b> 秒还原了这一阶段。
            </div>
          ) : status === "off" ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm space-y-1">
              <div>❌ 这一步偏离了正确路线。</div>
              <div>
                建议：<button onClick={undo} className="underline font-semibold">撤销上一步</button>
                ，然后尝试正确转动：
                <span className="ml-1 px-2 py-0.5 rounded bg-red-100 font-mono font-bold">
                  {exp ?? "（已到最后，继续微调）"}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 text-brand-800 text-sm">
              ✅ 走在正确路线上 · 进度 <b>{onPath}/{total}</b>
              {exp && (
                <>
                  {" "}下一步：
                  <span className="ml-1 px-2 py-0.5 rounded bg-brand-100 font-mono font-bold">{exp}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 操作行 */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={undo}
            disabled={done || userMoves.length === 0}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              done || userMoves.length === 0
                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            ↩ 撤销
          </button>
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition"
          >
            ⟲ 重来
          </button>
          <button
            onClick={() => setShowHint((v) => !v)}
            className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-sm font-semibold hover:bg-amber-200 transition"
          >
            {showHint ? "隐藏公式" : "💡 显示提示"}
          </button>
          <span className="ml-auto text-xs text-slate-400 self-center">用时 {elapsed}s</span>
        </div>

        {showHint && (
          <div className="mt-2 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg px-3 py-2 break-all">
            标准解法：{moves.join(" ")}
          </div>
        )}
      </div>

      {/* 右：转动面板 */}
      <div>
        <p className="text-sm text-slate-500 mb-2">
          在右侧魔方上手动转动，复现上方动画的公式。蓝色高亮表示「建议的下一步转动面」。
        </p>
        <MoveControls
          onMove={apply}
          onScramble={() => {}}
          onReset={reset}
          onUndo={undo}
          solved={isSolved(cube)}
          canUndo={userMoves.length > 0}
          showActions={false}
        />
      </div>
    </div>
  );
}
