import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "首页", end: true },
  { to: "/community", label: "知识社区" },
  { to: "/training", label: "训练计划" },
  { to: "/cases", label: "案例库" },
  { to: "/tutorial", label: "还原教程" },
  { to: "/interactive", label: "互动魔方" },
  { to: "/profile", label: "我的档案" },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 font-extrabold text-brand-700">
            <span className="inline-block w-7 h-7 rounded-lg bg-brand-500 grid place-items-center text-white text-xs font-bold">
              C
            </span>
            魔方训练营
          </NavLink>
          <nav className="flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md transition shrink-0 ${
                    isActive
                      ? "bg-brand-100 text-brand-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-400">
          魔方训练营 Cube Bootcamp · 从零基础到速拧进阶的一站式学习平台 · 进度数据仅保存在你的浏览器中
        </div>
      </footer>
    </div>
  );
}
