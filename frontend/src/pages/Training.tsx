import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, LevelMeta } from "../lib/api";
import { getProfile } from "../lib/profile";

export default function Training() {
  const [levels, setLevels] = useState<LevelMeta[]>([]);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    api.levels().then(setLevels).catch(() => setLevels([]));
    setDone(getProfile().completedLessons);
  }, []);

  const total = levels.length;
  const completedCount = levels.filter((l) => done.includes(l.id)).length;
  const pct = total ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">阶梯训练计划</h1>
      <p className="text-slate-500 mt-1">
        从萌新到专项突破，按关卡递进。每关完成后在「我的档案」留下记录。
      </p>

      <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">总体进度</span>
          <span className="font-semibold text-brand-700">
            {completedCount}/{total} 关
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {levels.map((l, idx) => {
          const isDone = done.includes(l.id);
          return (
            <Link
              key={l.id}
              to={`/training/${l.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-brand-300 transition"
            >
              <div
                className={`w-10 h-10 shrink-0 rounded-lg grid place-items-center font-extrabold ${
                  isDone ? "bg-green-500 text-white" : "bg-brand-50 text-brand-700"
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                    {l.level}
                  </span>
                  <h3 className="font-bold text-slate-800 truncate">{l.title}</h3>
                </div>
                {l.goal && <p className="text-sm text-slate-500 mt-1 truncate">{l.goal}</p>}
              </div>
              <span className="text-slate-300 text-xl">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
