import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Home() {
  const [meta, setMeta] = useState({ articles: 0, levels: 0, cases: 0 });
  useEffect(() => {
    api.cases().then(() => {}).catch(() => {});
    fetch("/api/meta")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  const modules = [
    {
      to: "/community",
      icon: "📚",
      title: "知识社区",
      desc: "从认识魔方、转动记号，到层先法、CFOP、比赛规则——零基础也能一步步学会。",
      color: "from-sky-500 to-blue-600",
    },
    {
      to: "/training",
      icon: "🪜",
      title: "阶梯训练计划",
      desc: "L0–L6 关卡式递进，每关有目标、任务与达标线，跟着走不迷路。",
      color: "from-indigo-500 to-violet-600",
    },
    {
      to: "/cases",
      icon: "🏆",
      title: "经典案例库",
      desc: "真实选手、赛事、解法与器材案例，分类标注出处，边看边学。",
      color: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white p-8 md:p-12 shadow-lg">
        <p className="text-brand-100 font-medium">从零基础到速拧进阶</p>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-2 leading-tight">
          魔方训练营
          <span className="block text-brand-100 text-xl md:text-2xl font-semibold mt-2">
            Cube Bootcamp
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-brand-50/90 leading-relaxed">
          这里有系统的知识社区、阶梯式的训练计划，和真实可溯源的案例库。
          不论你是第一次拿起魔方，还是想突破 30 秒，都能找到属于自己的进步路径。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/training"
            className="px-5 py-2.5 rounded-lg bg-white text-brand-700 font-semibold hover:bg-brand-50 transition"
          >
            开始训练 →
          </Link>
          <Link
            to="/community"
            className="px-5 py-2.5 rounded-lg bg-white/15 text-white font-semibold hover:bg-white/25 transition"
          >
            先学知识
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { n: meta.articles, label: "知识文章" },
          { n: meta.levels, label: "训练关卡" },
          { n: meta.cases, label: "案例收录" },
          { n: "∞", label: "练习次数" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-3xl font-extrabold text-brand-600">{s.n}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-brand-300 transition"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} grid place-items-center text-2xl`}
            >
              {m.icon}
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800 group-hover:text-brand-700">
              {m.title}
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{m.desc}</p>
          </Link>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-800">你的第一步</h2>
        <p className="mt-2 text-slate-500">
          建议路线：先逛一遍知识社区打基础 → 跟着 L0–L2 完成第一次完整还原 →
          用「我的档案」记录每次成绩，见证进步。
        </p>
        <div className="mt-4">
          <Link
            to="/training/L0"
            className="inline-block px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition"
          >
            进入 L0 萌新起步
          </Link>
        </div>
      </section>
    </div>
  );
}
