interface Props {
  onMove: (move: string) => void;
  onScramble: () => void;
  onReset: () => void;
  onUndo: () => void;
  solved: boolean;
  canUndo: boolean;
  /** 是否显示打乱/复位/撤销等动作按钮（内嵌精简版可隐藏） */
  showActions?: boolean;
}

const FACES = ["U", "D", "L", "R", "F", "B"] as const;

export default function MoveControls({
  onMove,
  onScramble,
  onReset,
  onUndo,
  solved,
  canUndo,
  showActions = true,
}: Props) {
  return (
    <div className="space-y-3">
      {showActions && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onScramble}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition"
          >
            🎲 打乱
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              canUndo
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}
          >
            ↩ 撤销
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition"
          >
            ⟲ 复位
          </button>
          {solved && (
            <span className="ml-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              ✓ 已还原
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 max-w-sm">
        {FACES.map((f) => (
          <div key={f} className="contents">
            {([f, `${f}'`, `${f}2`] as const).map((m) => (
              <button
                key={m}
                onClick={() => onMove(m)}
                className="px-2 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-bold hover:bg-brand-100 active:bg-brand-200 transition"
              >
                {m}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
