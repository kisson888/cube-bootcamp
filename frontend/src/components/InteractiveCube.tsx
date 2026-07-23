import { useState, useRef, ReactNode } from "react";
import { CubeState, getFaceColors, FACE_COLORS } from "../lib/cube";

interface Props {
  state: CubeState;
  /** 展开图整体边长（px） */
  size?: number;
  initialView?: "net" | "3d";
  /** 高亮某个面（net 描边 + 3D 描边），用于动画演示 */
  highlightFace?: number | null;
  children?: ReactNode; // 3D 视图下的浮动控制条
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

// 3D 各面定位
const FACE_3D: { face: number; transform: string }[] = [
  { face: 4, transform: "translateZ(var(--h))" }, // F
  { face: 5, transform: "rotateY(180deg) translateZ(var(--h))" }, // B
  { face: 3, transform: "rotateY(90deg) translateZ(var(--h))" }, // R
  { face: 2, transform: "rotateY(-90deg) translateZ(var(--h))" }, // L
  { face: 0, transform: "rotateX(90deg) translateZ(var(--h))" }, // U
  { face: 1, transform: "rotateX(-90deg) translateZ(var(--h))" }, // D
];

export default function InteractiveCube({
  state,
  size = 320,
  initialView = "net",
  highlightFace = null,
  children,
}: Props) {
  const [view, setView] = useState<"net" | "3d">(initialView);
  const [rot, setRot] = useState({ x: -22, y: -28 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  // —— 2D 展开图（SVG）——
  const s = size / 13;
  const g = s * 0.35;
  const block = 3 * s;
  const width = 4 * block + 3 * g;
  const height = 3 * block + 2 * g;

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setRot((r) => ({ x: r.x - dy * 0.5, y: r.y + dx * 0.5 }));
  };
  const onPointerUp = () => (drag.current = null);

  return (
    <div className="w-full">
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
              const colors = getFaceColors(state, face);
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
            className="relative cursor-grab active:cursor-grabbing select-none"
            style={{
              width: size * 0.72,
              height: size * 0.72,
              perspective: size,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <div
              className="cube-3d"
              style={{
                width: "100%",
                height: "100%",
                transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
                ["--h" as any]: `${size * 0.72 * 0.5}px`,
              }}
            >
              {FACE_3D.map(({ face, transform }) => {
                const colors = getFaceColors(state, face);
                const active = highlightFace === face;
                return (
                  <div
                    key={face}
                    className="cube-face"
                    style={{ transform, outline: active ? "3px solid #2563eb" : "none" }}
                  >
                    {colors.map((rowArr, i) =>
                      rowArr.map((c, j) => (
                        <div
                          key={`${i}-${j}`}
                          style={{ background: FACE_COLORS[c] }}
                          className="cube-sticker"
                        />
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3 justify-center">
            {(
              [
                ["前", 0, 0],
                ["上", -90, 0],
                ["左", 0, 90],
                ["右", 0, -90],
                ["立体", -28, -28],
              ] as [string, number, number][]
            ).map(([label, x, y]) => (
              <button
                key={label}
                onClick={() => setRot({ x, y })}
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
