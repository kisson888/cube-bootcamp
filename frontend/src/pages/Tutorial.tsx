import { useMemo, useState, useEffect } from "react";
import { STAGES, buildPath, TutorialStage, getStage } from "../lib/tutorial";
import {
  getTutorialProgress,
  recordTutorialScore,
  markTutorialStageDone,
  TutorialProgress,
} from "../lib/profile";
import CubePlayer from "../components/CubePlayer";
import CubePractice from "../components/CubePractice";

// 按 phase 分组（保持出现顺序）
function groupByPhase(stages: TutorialStage[]): { phase: string; items: TutorialStage[] }[] {
  const map = new Map<string, TutorialStage[]>();
  for (const s of stages) {
    if (!map.has(s.phase)) map.set(s.phase, []);
    map.get(s.phase)!.push(s);
  }
  return [...map.entries()].map(([phase, items]) => ({ phase, items }));
}

export default function Tutorial() {
  const [progress, setProgress] = useState<TutorialProgress>(getTutorialProgress());
  const [selectedId, setSelectedId] = useState<string>(() => {
    const p = getTutorialProgress();
    const next = STAGES.find((s) => !p.completedStages.includes(s.id));
    return (next ?? STAGES[0]).id;
  });

  useEffect(() => {
    setProgress(getTutorialProgress());
  }, []);

  const groups = useMemo(() => groupByPhase(STAGES), []);
  const stage = getStage(selectedId)!;
  const { states, moves } = useMemo(() => buildPath(stage), [stage]);
  const done = progress.completedStages.includes(stage.id);
  const total = STAGES.length;
  const completed = progress.completedStages.length;
  const pct = Math.round((completed / total) * 100);

  const nextStage = STAGES[STAGES.findIndex((s) => s.id === stage.id) + 1];

  const handleComplete = (score: { stageId: string; moves: number; timeSec: number; date: string }) => {
    recordTutorialScore(score);
    markTutorialStageDone(score.stageId, true);
    setProgress(getTutorialProgress());
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">魔方还原教程</h1>
      <p className="mt-1 text-slate-500">
        按层先法（LBL）七步，逐步看动画、动手练。每步都有 3D 演示与智能纠错，进度自动存入「我的档案」。
      </p>

      {/* 总进度 */}
      <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">教程总进度</span>
          <span className="font-semibold text-brand-700">
            {completed}/{total} 阶段
          </span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5 grid lg:grid-cols-[260px_1fr] gap-5">
        {/* 左侧阶段导航 */}
        <aside className="space-y-4">
          {groups.map((g) => (
            <div key={g.phase}>
              <div className="text-xs font-bold text-slate-400 px-1 mb-2">{g.phase}</div>
              <div className="space-y-1.5">
                {g.items.map((s) => {
                  const isDone = progress.completedStages.includes(s.id);
                  const isActive = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition border ${
                        isActive
                          ? "bg-brand-50 border-brand-300"
                          : "bg-white border-slate-200 hover:border-brand-200"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 shrink-0 grid place-items-center rounded-lg text-xs font-bold ${
                          isDone ? "bg-green-500 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isDone ? "✓" : STAGES.indexOf(s) + 1}
                      </span>
                      <span className={`text-sm ${isActive ? "font-semibold text-brand-700" : "text-slate-700"}`}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* 右侧阶段详情 */}
        <section className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">{stage.phase}</span>
              {done && (
                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-semibold">
                  ✓ 已完成
                </span>
              )}
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-800">{stage.title}</h2>
            <p className="mt-1 text-sm text-brand-700 font-medium">🎯 {stage.goal}</p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{stage.desc}</p>

            {/* 动画演示 */}
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-sm font-bold text-slate-700 mb-2">🎬 动画演示：逐步还原</div>
              <CubePlayer states={states} moves={moves} size={280} />
            </div>

            {/* 要点 */}
            <div className="mt-4">
              <div className="text-sm font-bold text-slate-700 mb-2">💡 要点提示</div>
              <ul className="space-y-1.5">
                {stage.tips.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-brand-500 font-bold">{i + 1}.</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 互动练习 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
            <h3 className="font-bold text-slate-800">🕹 互动练习：动手还原</h3>
            <p className="mt-1 text-sm text-slate-500">
              参照上面的动画，在魔方上手动转动复现公式。走错会得到纠正提示，达成目标即记录成绩。
            </p>
            <div className="mt-4">
              <CubePractice stage={stage} size={280} onComplete={handleComplete} />
            </div>

            {done && nextStage && (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setSelectedId(nextStage.id)}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
                >
                  下一阶段：{nextStage.title} →
                </button>
              </div>
            )}
            {done && !nextStage && (
              <div className="mt-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
                🏆 太棒了！你已完成还原教程的全部 7 个阶段，去「我的档案」查看成绩与历史吧。
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
