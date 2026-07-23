import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import Markdown from "../components/Markdown";
import CubeDiagram from "../components/CubeDiagram";

export default function ArticleDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    api.article(id).then(setData).catch((e) => setErr(String(e)));
  }, [id]);

  if (err) return <div className="text-red-500">加载失败：{err}</div>;
  if (!data) return <div className="text-slate-400">加载中…</div>;

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/community" className="text-sm text-brand-600 hover:underline">
        ← 返回知识社区
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700">
          {data.category}
        </span>
        {data.duration && <span className="text-xs text-slate-400">约 {data.duration}</span>}
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2">{data.title}</h1>
      <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <Markdown html={data.html} />
      </div>
      {data.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {data.tags.map((t: string) => (
            <span key={t} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500">
              #{t}
            </span>
          ))}
        </div>
      )}

      {(data.diagrams?.length ?? 0) > 0 && (
        <div className="mt-5 space-y-4">
          {data.diagrams.map((t: string) => (
            <CubeDiagram key={t} type={t} />
          ))}
        </div>
      )}
    </article>
  );
}
