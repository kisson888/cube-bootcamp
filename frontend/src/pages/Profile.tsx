import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, LevelMeta } from "../lib/api";
import { STAGES } from "../lib/tutorial";
import {
  getProfile,
  saveProfile,
  markLevelDone,
  setName,
  addPractice,
  setNotes,
  resetProfile,
  computeBadges,
  exportJSON,
  CubeProfile,
  PracticeEntry,
} from "../lib/profile";

const METHODS = ["LBL", "CFOP", "Roux", "ZZ", "其他"];

export default function Profile() {
  const [profile, setProfile] = useState<CubeProfile>(getProfile());
  const [levels, setLevels] = useState<LevelMeta[]>([]);

  // 练习表单
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("LBL");
  const [timeSec, setTimeSec] = useState<number>(60);
  const [scramble, setScramble] = useState("");

  useEffect(() => {
    setProfile(getProfile());
    api.levels().then(setLevels).catch(() => setLevels([]));
  }, []);

  const total = levels.length || 7;
  const doneCount = levels.filter((l) => profile.completedLessons.includes(l.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const badges = computeBadges(profile);

  const toggleLevel = (id: string, isDone: boolean) => {
    const p = markLevelDone(id, !isDone);
    setProfile(p);
  };

  const saveName = (v: string) => setProfile(setName(v));
  const saveNotes = (v: string) => setProfile(setNotes(v));

  const submitPractice = (e: FormEvent) => {
    e.preventDefault();
    if (!timeSec || timeSec <= 0) return;
    const entry: PracticeEntry = {
      date,
      method,
      timeSec: Number(timeSec),
      scramble: scramble.trim() || undefined,
    };
    const p = addPractice(entry);
    setProfile(p);
  };

  const removePractice = (idx: number) => {
    const p = getProfile();
    p.practiceLog.splice(idx, 1);
    saveProfile(p);
    setProfile(getProfile());
  };

  const doReset = () => {
    if (confirm("确定清空所有进步档案数据？此操作不可恢复。")) {
      resetProfile();
      setProfile(getProfile());
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">我的档案</h1>
        <p className="text-slate-500 mt-1">
          你的训练进度只保存在本浏览器（localStorage），不上传服务器。
        </p>
      </div>

      {/* 昵称 + 进度 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <label className="text-sm text-slate-500">玩家昵称</label>
        <input
          value={profile.name}
          onChange={(e) => saveName(e.target.value)}
          placeholder="给自己起个名字"
          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-brand-400"
        />
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">关卡进度</span>
          <span className="font-semibold text-brand-700">
            {doneCount}/{total} 关
          </span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </section>

      {/* 关卡勾选 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800">已完成关卡</h2>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {levels.map((l) => {
            const isDone = profile.completedLessons.includes(l.id);
            return (
              <label
                key={l.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:border-brand-300"
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleLevel(l.id, isDone)}
                  className="accent-brand-600 w-4 h-4"
                />
                <span className="text-sm">
                  <span className="text-brand-600 font-medium">{l.level}</span> {l.title}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 练习记录 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800">练习记录</h2>
        <form onSubmit={submitPractice} className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
          <div>
            <label className="text-xs text-slate-500">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">方法</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white"
            >
              {METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">用时（秒）</label>
            <input
              type="number"
              min={1}
              value={timeSec}
              onChange={(e) => setTimeSec(Number(e.target.value))}
              className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
          >
            添加
          </button>
          <div className="col-span-2 sm:col-span-4">
            <label className="text-xs text-slate-500">打乱公式（可选）</label>
            <input
              value={scramble}
              onChange={(e) => setScramble(e.target.value)}
              placeholder="如：R U R' F2 L' U2 ..."
              className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-mono"
            />
          </div>
        </form>

        {profile.practiceLog.length > 0 ? (
          <div className="mt-4 space-y-1">
            {profile.practiceLog.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-100"
              >
                <span className="text-slate-400 w-24">{e.date}</span>
                <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-xs">{e.method}</span>
                <span className="font-semibold text-slate-700">{e.timeSec}s</span>
                <span className="text-slate-400 truncate flex-1">{e.scramble}</span>
                <button
                  onClick={() => removePractice(i)}
                  className="text-slate-300 hover:text-red-500 text-xs"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">还没有记录，添加第一条练习吧。</p>
        )}
      </section>

      {/* 最好成绩 + 成就 */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800">个人最好成绩</h2>
          <div className="mt-3 space-y-1 text-sm">
            {Object.keys(profile.bestTimes).length > 0 ? (
              Object.entries(profile.bestTimes).map(([m, t]) => (
                <div key={m} className="flex justify-between">
                  <span className="text-slate-500">{m}</span>
                  <span className="font-semibold text-brand-700">{t == null ? "—" : `${t}s`}</span>
                </div>
              ))
            ) : (
              <span className="text-slate-400">暂无</span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800">成就徽章</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.length > 0 ? (
              badges.map((b) => (
                <span
                  key={b.id}
                  title={b.desc}
                  className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium"
                >
                  🏅 {b.label}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-sm">完成训练即可解锁</span>
            )}
          </div>
        </div>
      </section>

      {/* 教程进度 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800">还原教程进度</h2>
        <div className="mt-3 space-y-1.5">
          {STAGES.map((s) => {
            const isDone = profile.tutorial.completedStages.includes(s.id);
            const best = profile.tutorial.best[s.id];
            return (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span
                  className={`w-5 h-5 shrink-0 grid place-items-center rounded text-xs ${
                    isDone ? "bg-green-500 text-white" : "bg-slate-100 text-slate-300"
                  }`}
                >
                  {isDone ? "✓" : ""}
                </span>
                <span className="flex-1 text-slate-700 truncate">{s.title}</span>
                {best ? (
                  <span className="text-xs text-slate-400 font-mono">
                    {best.moves}步 · {best.timeSec}s
                  </span>
                ) : (
                  <span className="text-xs text-slate-300">未练习</span>
                )}
              </div>
            );
          })}
        </div>
        {profile.tutorial.history.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-bold text-slate-700 mb-2">最近练习</div>
            <div>
              {profile.tutorial.history.slice(0, 8).map((h, i) => {
                const st = STAGES.find((s) => s.id === h.stageId);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-100"
                  >
                    <span className="text-slate-400 w-20">{h.date}</span>
                    <span className="flex-1 truncate text-slate-600">{st?.title ?? h.stageId}</span>
                    <span className="font-semibold text-brand-700 font-mono">
                      {h.moves}步/{h.timeSec}s
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 笔记 + 操作 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="text-sm text-slate-500">训练笔记</label>
          <textarea
            value={profile.notes}
            onChange={(e) => saveNotes(e.target.value)}
            rows={3}
            placeholder="记录你的心得、目标或想突破的点…"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-brand-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportJSON}
            className="px-4 py-2 rounded-lg border border-brand-300 text-brand-700 text-sm font-semibold hover:bg-brand-50"
          >
            导出档案（JSON）
          </button>
          <button
            onClick={doReset}
            className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
          >
            清空档案
          </button>
          <Link
            to="/training"
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
          >
            继续训练 →
          </Link>
        </div>
      </section>
    </div>
  );
}
