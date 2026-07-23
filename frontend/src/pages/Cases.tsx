import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api, CaseMeta } from "../lib/api";

const CATEGORIES = ["方法", "比赛", "人物", "训练", "器材", "专题"];

export default function Cases() {
  const [items, setItems] = useState<CaseMeta[]>([]);
  const [cat, setCat] = useState<string>("");
  const [q, setQ] = useState<string>("");

  useEffect(() => {
    api.cases(cat || undefined).then(setItems).catch(() => setItems([]));
  }, [cat]);

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        q
          ? (i.title + (i.summary || "") + (i.tags || []).join("")).toLowerCase().includes(q.toLowerCase())
          : true
      ),
    [items, q]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">经典案例库</h1>
      <p className="text-slate-500 mt-1">
        从网络摘录的真实选手、赛事、解法与器材案例，分类标注出处，边看边学。
      </p>

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
          placeholder="搜索选手 / 赛事 / 方法…"
          className="ml-auto px-3 py-1.5 rounded-full border border-slate-200 text-sm w-56 focus:outline-brand-400"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {filtered.map((c) => (
          <Link
            key={c.id}
            to={`/cases/${c.id}`}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-brand-300 transition flex flex-col"
          >
            <span className="inline-block w-fit text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700">
              {c.category}
            </span>
            <h3 className="mt-2 font-bold text-slate-800 leading-snug">{c.title}</h3>
            {c.summary && <p className="mt-2 text-sm text-slate-500 leading-relaxed flex-1">{c.summary}</p>}
            {c.source_name && (
              <span className="mt-3 text-xs text-brand-600">来源：{c.source_name}</span>
            )}
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-slate-400 py-10">没有匹配的案例</div>
        )}
      </div>
    </div>
  );
}
