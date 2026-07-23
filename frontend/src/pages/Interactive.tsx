import { useState } from "react";
import {
  CubeState,
  createSolved,
  applyMove,
  invertMove,
  isSolved,
  MOVES,
} from "../lib/cube";
import InteractiveCube from "../components/InteractiveCube";
import MoveControls from "../components/MoveControls";

export default function Interactive() {
  const [cube, setCube] = useState<CubeState>(createSolved);
  const [history, setHistory] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<string[]>([]);

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
    setChallenge([]);
  };
  const doScramble = () => {
    // 用确定序列打乱，便于复现挑战
    let cur = createSolved();
    const used: string[] = [];
    let last = "";
    for (let k = 0; k < 20; k++) {
      let m: string;
      do {
        m = MOVES[Math.floor(Math.random() * MOVES.length)];
      } while (m[0] === last);
      last = m[0];
      cur = applyMove(cur, m);
      used.push(m);
    }
    setCube(cur);
    setHistory([]);
    setChallenge(used);
  };
  const replayChallenge = () => {
    let cur = createSolved();
    for (const m of challenge) cur = applyMove(cur, m);
    setCube(cur);
    setHistory([]);
  };

  const solved = isSolved(cube);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">互动魔方</h1>
      <p className="mt-1 text-sm text-slate-500">
        亲手转动、打乱、复位——把文章里看到的记号和公式，在这里真正“转”出来。
      </p>

      <div className="mt-5 bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <InteractiveCube state={cube} size={360} />
        <div className="mt-6 flex flex-col items-center">
          <MoveControls
            onMove={move}
            onScramble={doScramble}
            onReset={reset}
            onUndo={undo}
            solved={solved}
            canUndo={history.length > 0}
          />
        </div>
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800">🎯 打乱挑战</h3>
        <p className="mt-1 text-xs text-slate-500">
          生成一段随机打乱，尝试把它还原；完成后会出现“已还原”徽章。可重新生成或复现同一段打乱。
        </p>
        {challenge.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="font-mono text-xs bg-slate-900 text-slate-100 rounded px-3 py-2 break-all">
              {challenge.join(" ")}
            </code>
            <button
              onClick={replayChallenge}
              className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition"
            >
              ↻ 复现此打乱
            </button>
          </div>
        )}
        <div className="mt-3">
          <button
            onClick={doScramble}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition"
          >
            🎲 生成打乱挑战
          </button>
        </div>
      </div>
    </div>
  );
}
