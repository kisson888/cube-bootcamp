// 渲染后端返回的 HTML（内容均为平台策划、可信，直接注入）。
export default function Markdown({ html }: { html: string }) {
  return (
    <div
      className="prose-cube text-slate-700"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
