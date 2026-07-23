// 参与者的"进步档案"：全部存在浏览器 localStorage，免登录、单设备。

export interface PracticeEntry {
  date: string; // YYYY-MM-DD
  scramble?: string;
  timeSec: number;
  method?: string;
  note?: string;
}

/** 教程某阶段的练习成绩（互动还原教程用） */
export interface TutorialScore {
  stageId: string;
  moves: number;
  timeSec: number;
  date: string; // YYYY-MM-DD
}

export interface TutorialProgress {
  completedStages: string[];
  /** 每阶段最好成绩（最少步数 / 最短用时） */
  best: Record<string, { moves: number; timeSec: number }>;
  /** 练习历史（最近在前） */
  history: TutorialScore[];
}

export interface CubeProfile {
  name: string;
  currentLevel: string;
  completedLessons: string[];
  practiceLog: PracticeEntry[];
  bestTimes: Record<string, number | null>;
  notes: string;
  createdAt: string;
  tutorial: TutorialProgress;
}

const KEY = "cube_profile";

function defaultTutorial(): TutorialProgress {
  return { completedStages: [], best: {}, history: [] };
}

function defaultProfile(): CubeProfile {
  return {
    name: "",
    currentLevel: "L0",
    completedLessons: [],
    practiceLog: [],
    bestTimes: {},
    notes: "",
    createdAt: new Date().toISOString(),
    tutorial: defaultTutorial(),
  };
}

export function getProfile(): CubeProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfile();
    const p = { ...defaultProfile(), ...JSON.parse(raw) };
    p.tutorial = { ...defaultTutorial(), ...(p.tutorial || {}) };
    p.tutorial.best = p.tutorial.best || {};
    p.tutorial.history = p.tutorial.history || [];
    p.tutorial.completedStages = p.tutorial.completedStages || [];
    return p;
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(p: CubeProfile): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function markLevelDone(levelId: string, done: boolean): CubeProfile {
  const p = getProfile();
  const has = p.completedLessons.includes(levelId);
  if (done && !has) p.completedLessons.push(levelId);
  if (!done && has) p.completedLessons = p.completedLessons.filter((l) => l !== levelId);
  saveProfile(p);
  return p;
}

export function setName(name: string): CubeProfile {
  const p = getProfile();
  p.name = name;
  saveProfile(p);
  return p;
}

export function addPractice(entry: PracticeEntry): CubeProfile {
  const p = getProfile();
  p.practiceLog.unshift(entry);
  const method = entry.method || "LBL";
  const prev = p.bestTimes[method];
  if (prev == null || entry.timeSec < prev) p.bestTimes[method] = entry.timeSec;
  // 自动推进当前关卡（取已完成的最高等级 +1）
  saveProfile(p);
  return p;
}

export function setNotes(notes: string): CubeProfile {
  const p = getProfile();
  p.notes = notes;
  saveProfile(p);
  return p;
}

export function resetProfile(): void {
  localStorage.removeItem(KEY);
}

// ---------- 教程进度 ----------

export function markTutorialStageDone(stageId: string, done: boolean): CubeProfile {
  const p = getProfile();
  const has = p.tutorial.completedStages.includes(stageId);
  if (done && !has) p.tutorial.completedStages.push(stageId);
  if (!done && has)
    p.tutorial.completedStages = p.tutorial.completedStages.filter((s) => s !== stageId);
  saveProfile(p);
  return p;
}

/** 记录一次阶段练习成绩，更新最好成绩并写入历史。 */
export function recordTutorialScore(s: TutorialScore): CubeProfile {
  const p = getProfile();
  p.tutorial.history.unshift(s);
  if (p.tutorial.history.length > 100) p.tutorial.history = p.tutorial.history.slice(0, 100);
  const prev = p.tutorial.best[s.stageId];
  if (!prev || s.moves < prev.moves || (s.moves === prev.moves && s.timeSec < prev.timeSec)) {
    p.tutorial.best[s.stageId] = { moves: s.moves, timeSec: s.timeSec };
  }
  if (!p.tutorial.completedStages.includes(s.stageId)) p.tutorial.completedStages.push(s.stageId);
  saveProfile(p);
  return p;
}

export function getTutorialProgress(): TutorialProgress {
  return getProfile().tutorial;
}

export interface Badge {
  id: string;
  label: string;
  desc: string;
}

export function computeBadges(p: CubeProfile): Badge[] {
  const all = ["L0", "L1", "L2", "L3", "L4", "L5", "L6"];
  const bestVals = Object.values(p.bestTimes).filter(
    (v): v is number => typeof v === "number"
  );
  const minBest = bestVals.length ? Math.min(...bestVals) : Infinity;
  const badges: Badge[] = [];
  if (p.practiceLog.length > 0)
    badges.push({ id: "first-solve", label: "初次出手", desc: "记录了第一次练习成绩" });
  if (minBest <= 90)
    badges.push({ id: "sub-90", label: "Sub-90", desc: "任意方法最好成绩 ≤ 90 秒" });
  if (minBest <= 60)
    badges.push({ id: "sub-60", label: "Sub-60", desc: "任意方法最好成绩 ≤ 60 秒" });
  if (minBest <= 30)
    badges.push({ id: "sub-30", label: "Sub-30", desc: "任意方法最好成绩 ≤ 30 秒" });
  if (p.completedLessons.includes("L2"))
    badges.push({ id: "l2-done", label: "首还原", desc: "完成 L2：人生第一次完整还原" });
  if (all.every((l) => p.completedLessons.includes(l)))
    badges.push({ id: "all-levels", label: "全通关", desc: "完成全部阶梯关卡" });
  if (p.tutorial.completedStages.length >= 7)
    badges.push({ id: "tutorial-master", label: "教程全通", desc: "完成还原教程全部 7 个阶段" });
  else if (p.tutorial.completedStages.length > 0)
    badges.push({
      id: "tutorial-progress",
      label: "教程进阶",
      desc: `已完成还原教程 ${p.tutorial.completedStages.length}/7 阶段`,
    });
  return badges;
}

export function exportJSON(): void {
  const p = getProfile();
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cube-profile.json";
  a.click();
  URL.revokeObjectURL(url);
}
