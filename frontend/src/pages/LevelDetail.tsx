import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, LevelMeta, ArticleMeta, CaseMeta } from "../lib/api";
import { getProfile, markLevelDone } from "../lib/profile";
import Markdown from "../components/Markdown";
import CubeDiagram from "../components/CubeDiagram";

type LevelFull = LevelMeta & { html: string };

export default function LevelDetail() {
  const { id } = useParams();
  const [data, setData] = useState<LevelFull | null>(null);
  const [done, setDone] = useState(false);
  const [rec, setRec] = useState<{ title: string; to: string }[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    setErr("");
    // 关卡数据与推荐映射一起取，确保 recommend 在 data 到达后再解析
    Promise.all([api.level(id), api.articles(), api.levels(), api.cases()])
      .then(([lvl, arts, lvls, cs]) => {
        setData(lvl as LevelFull);
        const map = new Map<string, { title: string; to: string }>();
        (arts as ArticleMeta[]).forEach((a) =>
          map.set(a.id, { title: a.title, to: `/community/${a.id}` })
        );
        (lvls as LevelMeta[]).forEach((l) =>
          map.set(l.id, { title: l.title, to: `/training/${l.id}` })
        );
        (cs as CaseMeta[]).forEach((c) =>
          map.set(c.id, { title: c.title, to: `/cases/${c.id}` })
        );
        const recs = ((lvl as LevelFull).recommend || [])
          .map((r) => map.get(r))
          .filter(Boolean) as { title: string; to: string }[];
        setRec(recs);
      })
      .catch((e) => setErr(String(e)));
    setDone(getProfile().completedLessons.includes(id));
  }, [id]);

  if (err) return <div className="text-red-500">加载失败：{err}</div>;
  if (!data) return <div className="text-slate-400">加载中…</div>;

  const toggle = () => {
    const p = markLevelDone(data.id, !done);
    setDone(p.completedLessons.includes(data.id));
  };

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/training" className="text-sm text-brand-600 hover:underline">
        ← 返回训练计划
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700">{data.level}</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2">{data.title}</h1>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {data.goal && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-semibold text-brand-600">本关目标</div>
            <p className="mt-1 text-slate-700 text-sm">{data.goal}</p>
          </div>
        )}
        {data.target && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-semibold text-green-600">达标标准</div>
            <p className="mt-1 text-slate-700 text-sm">{data.target}</p>
          </div>
        )}
      </div>

      <button
        onClick={toggle}
        className={`mt-4 px-4 py-2 rounded-lg font-semibold transition ${
          done
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        {done ? "✓ 已标记为完成（点击取消）" : "标记本关完成"}
      </button>

      <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <Markdown html={data.html} />
      </div>

      {(data.knowledge?.length ?? 0) > 0 && (
        <div className="mt-5 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-800">📌 知识点</h3>
          <ul className="mt-2 list-disc list-inside text-sm text-slate-600 space-y-1">
            {(data.knowledge || []).map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
      )}

      {(data.tasks?.length ?? 0) > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-800">✅ 练习任务</h3>
          <ul className="mt-2 list-decimal list-inside text-sm text-slate-600 space-y-1">
            {(data.tasks || []).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {rec.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-800">🔗 推荐学习</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {rec.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="text-sm px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 transition"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(data.diagrams?.length ?? 0) > 0 && (
        <div className="mt-5 space-y-4">
          {(data.diagrams || []).map((t: string) => (
            <CubeDiagram key={t} type={t} />
          ))}
        </div>
      )}
    </article>
  );
}
