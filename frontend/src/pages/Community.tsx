import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api, ArticleMeta } from "../lib/api";

const CATEGORIES = ["入门", "还原", "提速", "进阶", "过渡", "专题"];

export default function Community() {
  const [items, setItems] = useState<ArticleMeta[]>([]);
  const [cat, setCat] = useState<string>("");
  const [q, setQ] = useState<string>("");

  useEffect(() => {
    api.articles(cat || undefined).then(setItems).catch(() => setItems([]));
  }, [cat]);

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        q ? (i.title + (i.tags || []).join("")).toLowerCase().includes(q.toLowerCase()) : true
      ),
    [items, q]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">知识社区</h1>
      <p className="text-slate-500 mt-1">从零基础到速拧进阶，系统化的魔方教程。</p>

      <Link
        to="/tutorial"
        className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-2xl px-5 py-4 hover:opacity-95 transition"
      >
        <div>
          <div className="font-bold">🎓 互动还原教程</div>
          <div className="text-sm text-white/85 mt-0.5">
            按层先法七步，3D 动画演示 + 动手练习 + 智能纠错，进度自动存档。
          </div>
        </div>
        <span className="px-4 py-2 rounded-lg bg-white/20 font-semibold text-sm shrink-0">
          开始学习 →
        </span>
      </Link>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          onClick={() => setCat("")}
          className={`px-3 py-1.5 rounded-full text-sm ${
            cat === "" ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600"
          }`}
        >
          全部
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              cat === c ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {c}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题或标签…"
          className="ml-auto px-3 py-1.5 rounded-full border border-slate-200 text-sm w-48 focus:outline-brand-400"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {filtered.map((a) => (
          <Link
            key={a.id}
            to={`/community/${a.id}`}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-brand-300 transition"
          >
            <span className="inline-block text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700">
              {a.category}
            </span>
            <h3 className="mt-2 font-bold text-slate-800 leading-snug">{a.title}</h3>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              {a.difficulty && <span>难度 {"★".repeat(a.difficulty)}</span>}
              {a.duration && <span>· {a.duration}</span>}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-slate-400 py-10">没有匹配的文章</div>
        )}
      </div>
    </div>
  );
}
