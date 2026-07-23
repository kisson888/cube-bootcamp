import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import Markdown from "../components/Markdown";

export default function CaseDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    api.caseItem(id).then(setData).catch((e) => setErr(String(e)));
  }, [id]);

  if (err) return <div className="text-red-500">加载失败：{err}</div>;
  if (!data) return <div className="text-slate-400">加载中…</div>;

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/cases" className="text-sm text-brand-600 hover:underline">
        ← 返回案例库
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700">
          {data.category}
        </span>
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2">{data.title}</h1>
      {data.source_name && (
        <a
          href={data.source}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 text-sm text-brand-600 hover:underline"
        >
          查看出处：{data.source_name} ↗
        </a>
      )}
      <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <Markdown html={data.html} />
      </div>
    </article>
  );
}
