import { useState, useRef, useEffect, ReactNode } from "react";
import { CubeState, getFaceColors, FACE_COLORS, applyMove } from "../lib/cube";
import { getCubies, faceCssTransform, computeTurn, applyOrbit, norm, dot, type Vec3 } from "../lib/cube3d";

interface Props {
  state: CubeState;
  /** 舞台边长（px） */
  size?: number;
  initialView?: "net" | "3d";
  /** 高亮某个面（net 描边 + 3D 描边），用于动画演示 */
  highlightFace?: number | null;
  children?: ReactNode; // 3D 视图下的浮动控制条
  /** 是否允许鼠标/触摸交互（默认 true） */
  interactive?: boolean;
  /** 是否允许「拖面上拧层」（默认随 interactive） */
  enableTurn?: boolean;
  /** 提交一次层转动（由父组件应用并回传新 state，受控模式） */
  onMove?: (move: string) => void;
  /** 测试锚点 */
  testId?: string;
}

// 展开图布局（cross）：列 0..3，行 0..2
const LAYOUT: { face: number; col: number; row: number }[] = [
  { face: 0, col: 1, row: 0 }, // U
  { face: 2, col: 0, row: 1 }, // L
  { face: 4, col: 1, row: 1 }, // F
  { face: 3, col: 2, row: 1 }, // R
  { face: 5, col: 3, row: 1 }, // B
  { face: 1, col: 1, row: 2 }, // D
];

const DEFAULT_ROT = { x: -26, y: -34 };
const LIGHT: Vec3 = norm([-0.35, -0.55, 0.78]); // 视空间光（左上前；y 向下为负=上）

// 一次「拖面上拧层」的实时状态（仅用于渲染，不改逻辑 state）
interface TurnState {
  eAxis: number;
  eLayer: number;
  cAxis: Vec3;
  angle: number;
  progress: number;
  move: string;
}

export default function InteractiveCube({
  state,
  size = 320,
  initialView = "net",
  highlightFace = null,
  children,
  interactive = true,
  enableTurn,
  onMove,
  testId,
}: Props) {
  const et = enableTurn ?? interactive;
  const [view, setView] = useState<"net" | "3d">(initialView);
  const [rot, setRot] = useState(DEFAULT_ROT);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [turn, setTurn] = useState<TurnState | null>(null);
  const turnRef = useRef<TurnState | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // 非受控模式下自管 state（自由练习用）
  const [internal, setInternal] = useState<CubeState>(state);
  useEffect(() => {
    if (!onMove) setInternal(state);
  }, [state, onMove]);
  const display = onMove ? state : internal;

  const cubies = getCubies(display);

  const setTurnBoth = (t: TurnState | null) => {
    turnRef.current = t;
    setTurn(t);
  };

  // 滚轮缩放
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !interactive) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(1.9, Math.max(0.5, s - e.deltaY * 0.0011)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [interactive]);

  // 视角惯性
  const orbitVel = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const cancelInertia = () => {
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  };

  // —— 手势：turn / orbit ——
  const gesture = useRef<{
    mode: "none" | "orbit" | "turn";
    x: number;
    y: number;
    faceId?: number;
    pos?: Vec3;
    started: boolean;
  }>({ mode: "none", x: 0, y: 0, started: false });

  // 抓取某个色块 → 拧层（直接绑在每个 cubie-face 上，命中稳定）
  const startTurn = (faceId: number, pos: Vec3, e: React.PointerEvent) => {
    if (!et) return; // 动画演示等：不拧层，交给舞台转视角
    e.stopPropagation();
    gesture.current = { mode: "turn", x: e.clientX, y: e.clientY, faceId, pos, started: false };
    setDragging(true);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  // 抓取空白处 → 转视角
  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    cancelInertia();
    gesture.current = { mode: "orbit", x: e.clientX, y: e.clientY, started: false };
    setDragging(true);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (g.mode === "none") return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.mode === "orbit") {
      const vx = -dy * 0.32;
      const vy = dx * 0.32;
      setRot((r) => ({ x: r.x + vx, y: r.y + vy }));
      orbitVel.current = { x: vx, y: vy };
      return;
    }
    if (!g.started) {
      if (Math.hypot(dx, dy) < 5) return;
      g.started = true;
    }
    if (g.faceId === undefined || !g.pos) return;
    const plan = computeTurn(g.faceId, g.pos, dx, dy, rot);
    if (!plan) {
      setTurnBoth(null);
      return;
    }
    setTurnBoth({
      eAxis: plan.axis,
      eLayer: plan.layerCoord,
      cAxis: [plan.eM[0], -plan.eM[1], plan.eM[2]],
      angle: -90 * plan.progress,
      progress: plan.progress,
      move: plan.move,
    });
  };

  const endGesture = () => {
    const g = gesture.current;
    gesture.current = { mode: "none", x: 0, y: 0, started: false };
    setDragging(false);
    if (g.mode === "orbit") {
      // 惯性
      const v = orbitVel.current;
      if (Math.abs(v.x) > 0.08 || Math.abs(v.y) > 0.08) {
        const step = () => {
          setRot((r) => ({ x: r.x + v.x, y: r.y + v.y }));
          v.x *= 0.9;
          v.y *= 0.9;
          if (Math.abs(v.x) > 0.05 || Math.abs(v.y) > 0.05) raf.current = requestAnimationFrame(step);
          else raf.current = null;
        };
        raf.current = requestAnimationFrame(step);
      }
      return;
    }
    if (g.mode !== "turn" || !g.started) return;
    const t = turnRef.current;
    if (!t) return;
    const commit = Math.abs(t.progress) >= 0.5;
    const target = commit ? (t.progress >= 0 ? -90 : 90) : 0;
    setTurnBoth({ ...t, angle: target });
    setSnapping(true);
    window.setTimeout(() => {
      if (commit) {
        if (onMove) onMove(t.move);
        else setInternal((prev) => applyMove(prev, t.move));
      }
      setTurnBoth(null);
      setSnapping(false);
    }, 200);
  };

  useEffect(() => cancelInertia, []);

  const resetView = () => {
    cancelInertia();
    setRot(DEFAULT_ROT);
    setScale(1);
  };

  // 单块受光亮度（模拟真实光照：朝向光的面更亮）
  const shadeOf = (d: Vec3): number => {
    const n = applyOrbit(d, rot.x, rot.y);
    const dt = Math.max(0, dot(n, LIGHT));
    return 0.62 + 0.48 * dt;
  };

  // 3D 几何
  const S = size;
  const V = S * 0.7;
  const u = V / 3;
  const cy = (p: Vec3) => -p[1] * u;

  // 2D 展开图
  const s = size / 13;
  const g = s * 0.35;
  const block = 3 * s;
  const width = 4 * block + 3 * g;
  const height = 3 * block + 2 * g;

  return (
    <div className="w-full" data-testid={testId}>
      <div className="flex gap-1 mb-3 text-xs">
        <button
          onClick={() => setView("net")}
          className={`px-3 py-1 rounded-md transition ${
            view === "net" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          展开图
        </button>
        <button
          onClick={() => setView("3d")}
          className={`px-3 py-1 rounded-md transition ${
            view === "3d" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          3D 视图
        </button>
      </div>

      {view === "net" ? (
        <div className="flex justify-center">
          <svg
            width={size}
            height={(size * height) / width}
            viewBox={`0 0 ${width} ${height}`}
            className="max-w-full"
          >
            {LAYOUT.map(({ face, col, row }) => {
              const ox = col * (block + g);
              const oy = row * (block + g);
              const colors = getFaceColors(display, face);
              const active = highlightFace === face;
              return (
                <g key={face}>
                  {colors.map((rowArr, i) =>
                    rowArr.map((c, j) => (
                      <rect
                        key={`${i}-${j}`}
                        x={ox + j * s + s * 0.06}
                        y={oy + i * s + s * 0.06}
                        width={s * 0.88}
                        height={s * 0.88}
                        rx={s * 0.18}
                        fill={FACE_COLORS[c]}
                        stroke="#0f172a"
                        strokeOpacity={0.18}
                        strokeWidth={1}
                      />
                    ))
                  )}
                  {active && (
                    <rect
                      x={ox}
                      y={oy}
                      width={block}
                      height={block}
                      rx={s * 0.3}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth={s * 0.18}
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div
            ref={stageRef}
            className="relative cursor-grab active:cursor-grabbing select-none touch-none"
            style={{
              width: S,
              height: S,
              perspective: S * 1.9,
              touchAction: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
            onDoubleClick={interactive ? resetView : undefined}
            title="在色块上拖动=拧动该层 · 在空白处拖动=旋转视角 · 滚轮缩放 · 双击复位"
          >
            <div className="cube-shadow" style={{ top: `calc(50% + ${V * 0.6}px)` }} />
            <div
              className={`cube-3d${dragging ? " dragging" : ""}${snapping ? " snapping" : ""}`}
              style={{
                width: S,
                height: S,
                transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${scale})`,
                ["--u" as any]: `${u}px`,
              }}
            >
              {cubies.map((cb) => {
                const cx = cb.pos[0] * u;
                const cz = cb.pos[2] * u;
                const inLayer = turn && cb.pos[turn.eAxis] === turn.eLayer;
                const rotCss = inLayer
                  ? `rotate3d(${turn!.cAxis[0]},${turn!.cAxis[1]},${turn!.cAxis[2]},${turn!.angle}deg) `
                  : "";
                return (
                  <div
                    key={cb.pos.join(",")}
                    className="cubie"
                    style={{
                      transform: `${rotCss}translate3d(${cx}px, ${cy(cb.pos)}px, ${cz}px)`,
                    }}
                  >
                    {cb.facelets.map((f, i) => (
                      <div
                        key={i}
                        className={`cubie-face${highlightFace === f.faceId ? " hl" : ""}`}
                        data-face={f.faceId}
                        data-pos={cb.pos.join(",")}
                        onPointerDown={(e) => startTurn(f.faceId, cb.pos, e)}
                        style={{ transform: faceCssTransform(f.dir, u / 2) }}
                      >
                        <div
                          className="sticker"
                          style={{
                            ["--c" as any]: FACE_COLORS[f.color],
                            filter: `brightness(${shadeOf(f.dir).toFixed(3)})`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3 justify-center">
            {(
              [
                ["前", -26, -34],
                ["上", -90, 0],
                ["左", 0, 90],
                ["右", 0, -90],
                ["立体", -28, -28],
                ["复位", -26, -34],
              ] as [string, number, number][]
            ).map(([label, x, y]) => (
              <button
                key={label}
                onClick={() => (label === "复位" ? resetView() : setRot({ x, y }))}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition"
              >
                {label}
              </button>
            ))}
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
