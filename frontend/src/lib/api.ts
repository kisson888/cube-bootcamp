// 与后端通信的轻量封装。
// - 普通部署（FastAPI 同域托管）：请求 /api/*。
// - 静态部署（GitHub Pages 等无后端）：VITE_STATIC=true 时改为读取 /content.json。

export interface ArticleMeta {
  id: string;
  title: string;
  category: string;
  difficulty?: number;
  duration?: string;
  order?: number;
  tags?: string[];
  diagrams?: string[];
}

export interface LevelMeta {
  id: string;
  title: string;
  level: string;
  order?: number;
  goal?: string;
  target?: string;
  knowledge?: string[];
  tasks?: string[];
  recommend?: string[];
  diagrams?: string[];
}

export interface CaseMeta {
  id: string;
  title: string;
  category: string;
  source: string;
  source_name?: string;
  summary?: string;
  order?: number;
  tags?: string[];
}

// 静态内容集合（含 body / html，与后端 get_item 返回一致）
type ContentBundle = {
  articles: (ArticleMeta & { html: string; body: string })[];
  levels: (LevelMeta & { html: string; body: string })[];
  cases: (CaseMeta & { html: string; body: string })[];
};

export const STATIC = import.meta.env.VITE_STATIC === "true";

let localCache: ContentBundle | null = null;

async function loadLocal(): Promise<ContentBundle> {
  if (localCache) return localCache;
  const res = await fetch(`${import.meta.env.BASE_URL}content.json`);
  if (!res.ok) throw new Error("静态内容加载失败");
  localCache = (await res.json()) as ContentBundle;
  return localCache;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`请求失败: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  articles: async (category?: string, tag?: string): Promise<ArticleMeta[]> => {
    if (STATIC) {
      const c = await loadLocal();
      return c.articles
        .filter((a) => (category ? a.category === category : true))
        .filter((a) => (tag ? (a.tags || []).includes(tag) : true))
        .map(({ html, body, ...m }) => m);
    }
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (tag) q.set("tag", tag);
    return getJSON<ArticleMeta[]>(`/api/articles?${q.toString()}`);
  },
  article: async (id: string) => {
    if (STATIC) {
      const c = await loadLocal();
      const a = c.articles.find((x) => x.id === id);
      if (!a) throw new Error("文章不存在");
      return a;
    }
    return getJSON<ArticleMeta & { html: string; body: string }>(`/api/articles/${id}`);
  },
  levels: async (): Promise<LevelMeta[]> => {
    if (STATIC) {
      const c = await loadLocal();
      return c.levels.map(({ html, body, ...m }) => m);
    }
    return getJSON<LevelMeta[]>(`/api/levels`);
  },
  level: async (id: string) => {
    if (STATIC) {
      const c = await loadLocal();
      const l = c.levels.find((x) => x.id === id);
      if (!l) throw new Error("关卡不存在");
      return l;
    }
    return getJSON<LevelMeta & { html: string; body: string }>(`/api/levels/${id}`);
  },
  cases: async (category?: string, q?: string) => {
    if (STATIC) {
      const c = await loadLocal();
      const needle = (q || "").toLowerCase();
      return c.cases
        .filter((i) => (category ? i.category === category : true))
        .filter((i) =>
          needle
            ? (i.title || "").toLowerCase().includes(needle) ||
              (i.summary || "").toLowerCase().includes(needle) ||
              (i.tags || []).some((t) => String(t).toLowerCase().includes(needle))
            : true
        )
        .map(({ html, body, ...m }) => m);
    }
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (q) p.set("q", q);
    return getJSON<CaseMeta[]>(`/api/cases?${p.toString()}`);
  },
  caseItem: async (id: string) => {
    if (STATIC) {
      const c = await loadLocal();
      const cs = c.cases.find((x) => x.id === id);
      if (!cs) throw new Error("案例不存在");
      return cs;
    }
    return getJSON<CaseMeta & { html: string; body: string }>(`/api/cases/${id}`);
  },
};
