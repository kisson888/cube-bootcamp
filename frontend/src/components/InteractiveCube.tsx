import { useState, useRef, useEffect, ReactNode } from "react";
import * as THREE from "three";
import { CubeState, getFaceColors, FACE_COLORS, applyMove } from "../lib/cube";
import { computeTurn, type Vec3 } from "../lib/cube3d";

interface Props {
  state: CubeState;
  size?: number;
  initialView?: "net" | "3d";
  highlightFace?: number | null;
  children?: ReactNode;
  interactive?: boolean;
  enableTurn?: boolean;
  onMove?: (move: string) => void;
  testId?: string;
}

// 展开图布局
const LAYOUT: { face: number; col: number; row: number }[] = [
  { face: 0, col: 1, row: 0 }, { face: 2, col: 0, row: 1 },
  { face: 4, col: 1, row: 1 }, { face: 3, col: 2, row: 1 },
  { face: 5, col: 3, row: 1 }, { face: 1, col: 1, row: 2 },
];

// 引擎方向（索引=FaceId）：U+ y, D- y, L- x, R+ x, F+ z, B- z
const DIRS: Vec3[] = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];
function faceIdOfDir(d: Vec3): number {
  const x = Math.round(d[0]), y = Math.round(d[1]), z = Math.round(d[2]);
  if (y === 1) return 0; if (y === -1) return 1;
  if (x === -1) return 2; if (x === 1) return 3;
  if (z === 1) return 4; return 5;
}

const DEFAULT_ROT = { x: -26, y: -34 };
const SP = 1.0; // cubie 间距
const BASE_DIST = 6.68;

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

interface CubieRec {
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  pos: Vec3;
  stickers: Map<number, THREE.Mesh>;
}

export default function InteractiveCube({
  state, size = 320, initialView = "net", highlightFace = null,
  children, interactive = true, enableTurn, onMove, testId,
}: Props) {
  const et = enableTurn ?? interactive;
  const [view, setView] = useState<"net" | "3d">(initialView);
  const [dragging, setDragging] = useState(false);
  const [webglFail, setWebglFail] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // three 场景对象
  const T = useRef<{
    renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
    orbit: THREE.Group; cubies: CubieRec[]; ray: THREE.Raycaster;
    camDir: THREE.Vector3; stickerGeo: THREE.BufferGeometry;
  } | null>(null);

  // 逻辑/交互引用
  const [internal, setInternal] = useState<CubeState>(state);
  const display = onMove ? state : internal;
  const displayRef = useRef<CubeState>(display);
  const highlightRef = useRef<number | null>(highlightFace);
  const rotRef = useRef(DEFAULT_ROT);
  const scaleRef = useRef(1);
  const onMoveRef = useRef(onMove);
  const etRef = useRef(et);
  const interactiveRef = useRef(interactive);
  const draggingRef = useRef(false);
  // 当前拖拽层转动状态（用 ref，避免每次渲染重建闭包造成的绑定错乱）
  const turnState = useRef<{ axis: number; layer: number; plan: any }>({ axis: 1, layer: 1, plan: null });

  // 手势状态
  const gesture = useRef<{ mode: "none" | "orbit" | "turn"; x: number; y: number; faceId?: number; pos?: Vec3; started: boolean; plan?: any }>({ mode: "none", x: 0, y: 0, started: false });
  const orbitVel = useRef({ x: 0, y: 0 });
  const turnAnim = useRef<{ active: boolean; from: number; to: number; start: number; dur: number; cb?: () => void }>({ active: false, from: 0, to: 0, start: 0, dur: 0 });

  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
  useEffect(() => { etRef.current = et; }, [et]);
  useEffect(() => { interactiveRef.current = interactive; }, [interactive]);

  // 状态/高亮变化 → 更新贴纸颜色
  useEffect(() => {
    displayRef.current = display;
    highlightRef.current = highlightFace;
    if (T.current) updateStickers();
  }, [display, highlightFace]);

  // 挂载 three（仅在 3D 视图激活时；切回展开图会自动卸载并释放资源）
  useEffect(() => {
    if (view !== "3d") return;
    const container = containerRef.current;
    if (!container) return;
    const W = container.clientWidth || size;
    const H = container.clientHeight || size;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.warn("WebGL 不可用，降级为提示：", err);
      setWebglFail(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";
    // 让 canvas 始终铺满容器（避免高 DPR 下缓冲尺寸被当成 CSS 尺寸导致放大裁切）
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(3.2, 3.5, 4.7);
    camera.lookAt(0, 0, 0);
    const camDir = camera.position.clone().normalize();

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(6, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1; key.shadow.camera.far = 40;
    key.shadow.camera.left = -6; key.shadow.camera.right = 6;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.0005;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbcd2ff, 0.4);
    fill.position.set(-7, 3, -5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(0, -4, -6);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({ opacity: 0.22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.25;
    ground.receiveShadow = true;
    scene.add(ground);

    const orbit = new THREE.Group();
    scene.add(orbit);

    // 构建 26 cubie
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.5, metalness: 0.15 });
    const boxGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    const stickerGeo = new THREE.ShapeGeometry(roundedRectShape(0.82, 0.82, 0.16));
    const cubies: CubieRec[] = [];
    for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
      if (x === 0 && y === 0 && z === 0) continue;
      const mesh = new THREE.Mesh(boxGeo, bodyMat);
      mesh.position.set(x * SP, y * SP, z * SP);
      mesh.castShadow = true; mesh.receiveShadow = true;
      orbit.add(mesh);
      const stickers = new Map<number, THREE.Mesh>();
      for (let f = 0; f < 6; f++) {
        const dir = DIRS[f];
        const mat = new THREE.MeshPhysicalMaterial({ color: 0x222222, roughness: 0.28, metalness: 0.0, clearcoat: 0.65, clearcoatRoughness: 0.3 });
        const st = new THREE.Mesh(stickerGeo, mat);
        st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(dir[0], dir[1], dir[2]));
        st.position.set(dir[0] * 0.49, dir[1] * 0.49, dir[2] * 0.49);
        mesh.add(st);
        stickers.set(f, st);
      }
      cubies.push({ mesh, basePos: new THREE.Vector3(x * SP, y * SP, z * SP), pos: [x, y, z], stickers });
    }

    const ray = new THREE.Raycaster();
    T.current = { renderer, scene, camera, orbit, cubies, ray, camDir, stickerGeo };

    applyView(DEFAULT_ROT);
    updateStickers();

    // 动画循环
    const animate = () => {
      // 视角惯性
      if (!draggingRef.current && (Math.abs(orbitVel.current.x) > 0.03 || Math.abs(orbitVel.current.y) > 0.03)) {
        rotRef.current = { x: rotRef.current.x + orbitVel.current.x, y: rotRef.current.y + orbitVel.current.y };
        orbitVel.current.x *= 0.9; orbitVel.current.y *= 0.9;
        applyView(rotRef.current);
      }
      // 层转动吸附动画
      const ta = turnAnim.current;
      if (ta.active) {
        const t = Math.min(1, (performance.now() - ta.start) / ta.dur);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
        const ang = ta.from + (ta.to - ta.from) * e;
        if (turnState.current.plan) applyLayerRotation(turnState.current.plan.eM, ang);
        if (t >= 1) { ta.active = false; if (ta.cb) ta.cb(); }
      }
      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animate);

    // 自适应尺寸
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      if (w && h) { renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    });
    ro.observe(container);

    // 指针事件
    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointermove", onMoveH);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointercancel", onUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("dblclick", () => resetView());

    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointermove", onMoveH);
      dom.removeEventListener("pointerup", onUp);
      dom.removeEventListener("pointercancel", onUp);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("dblclick", resetView);
      boxGeo.dispose(); stickerGeo.dispose(); bodyMat.dispose();
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
      T.current = null;
      turnState.current.plan = null;
      turnAnim.current.active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // —— 以下函数需能访问 T 与引用，故定义在组件内（闭包） ——
  function applyView(r: { x: number; y: number }) {
    const t = T.current; if (!t) return;
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (r.x * Math.PI) / 180);
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (r.y * Math.PI) / 180);
    t.orbit.quaternion.copy(qx).multiply(qy);
  }
  function applyZoom() {
    const t = T.current; if (!t) return;
    const d = BASE_DIST * scaleRef.current;
    t.camera.position.copy(t.camDir).multiplyScalar(d);
    t.camera.lookAt(0, 0, 0);
  }
  function updateStickers() {
    const t = T.current; if (!t) return;
    const st = displayRef.current; const hl = highlightRef.current;
    for (const c of t.cubies) {
      for (let f = 0; f < 6; f++) {
        const dir = DIRS[f];
        const key = `${c.pos[0]},${c.pos[1]},${c.pos[2]},${dir[0]},${dir[1]},${dir[2]}`;
        const col = st[key];
        const m = c.stickers.get(f)!;
        if (col === undefined) { m.visible = false; continue; }
        m.visible = true;
        (m.material as THREE.MeshStandardMaterial).color.set(FACE_COLORS[col]);
        const mat = m.material as THREE.MeshStandardMaterial;
        if (hl === f) { mat.emissive.set(0x2563eb); mat.emissiveIntensity = 0.55; }
        else { mat.emissive.set(0x000000); mat.emissiveIntensity = 0; }
      }
    }
  }
  function applyLayerRotation(eM: Vec3, angleRad: number) {
    const t = T.current; if (!t) return;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(eM[0], eM[1], eM[2]), angleRad);
    for (const c of t.cubies) {
      const onLayer = c.basePos.getComponent(turnState.current.axis) === turnState.current.layer;
      if (onLayer) {
        c.mesh.position.copy(c.basePos).applyQuaternion(q);
        c.mesh.quaternion.copy(q);
      } else {
        c.mesh.position.copy(c.basePos);
        c.mesh.quaternion.identity();
      }
    }
  }
  function resetCubies() {
    const t = T.current; if (!t) return;
    for (const c of t.cubies) { c.mesh.position.copy(c.basePos); c.mesh.quaternion.identity(); }
  }

  function onDown(e: PointerEvent) {
    if (!interactiveRef.current) return;
    const t = T.current; if (!t) return;
    const rect = t.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    t.ray.setFromCamera(ndc, t.camera);
    const hits = t.ray.intersectObjects(t.cubies.map((c) => c.mesh), false);
    if (etRef.current && hits.length > 0) {
      const hit = hits[0];
      const cubie = hit.object as THREE.Mesh;
      const cRec = t.cubies.find((c) => c.mesh === cubie)!;
      // world normal of hit face -> convert back to engine space via inverse orbit rotation (handles scrambled cubies)
      const nWorld = hit.face!.normal.clone().transformDirection(hit.object.matrixWorld);
      const nEngine = nWorld.applyQuaternion(t.orbit.quaternion.clone().invert());
      const faceId = faceIdOfDir([Math.round(nEngine.x), Math.round(nEngine.y), Math.round(nEngine.z)]);
      gesture.current = { mode: "turn", x: e.clientX, y: e.clientY, faceId, pos: cRec.pos, started: false };
    } else {
      gesture.current = { mode: "orbit", x: e.clientX, y: e.clientY, started: false };
    }
    draggingRef.current = true; setDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    orbitVel.current = { x: 0, y: 0 };
  }

  function onMoveH(e: PointerEvent) {
    const g = gesture.current;
    if (g.mode === "none") return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (g.mode === "orbit") {
      const vx = -dy * 0.32, vy = dx * 0.32;
      rotRef.current = { x: rotRef.current.x + vx, y: rotRef.current.y + vy };
      applyView(rotRef.current);
      orbitVel.current = { x: vx, y: vy };
      return;
    }
    if (!g.started) { if (Math.hypot(dx, dy) < 5) return; g.started = true; }
    if (g.faceId === undefined || !g.pos) return;
    // 关键修复：拖拽位移按"单个色块面的像素尺寸"归一化后再喂给 computeTurn，
    // 使扭转进度与拖动距离成正比（跟手平滑扭动），而非一碰就瞬间弹满 90°
    const refPx = size / 3;
    const plan = computeTurn(g.faceId, g.pos, dx / refPx, dy / refPx, rotRef.current);
    if (!plan) { turnState.current.plan = null; resetCubies(); return; }
    turnState.current.plan = plan;
    turnState.current.axis = plan.axis;
    turnState.current.layer = plan.layerCoord;
    g.plan = plan;
    applyLayerRotation(plan.eM, plan.progress * (Math.PI / 2));
  }

  function onUp() {
    const g = gesture.current;
    draggingRef.current = false; setDragging(false);
    if (g.mode === "orbit") { gesture.current = { mode: "none", x: 0, y: 0, started: false }; return; }
    if (g.mode !== "turn" || !g.started || !turnState.current.plan) { resetCubies(); gesture.current = { mode: "none", x: 0, y: 0, started: false }; return; }
    const plan = turnState.current.plan;
    const commit = Math.abs(plan.progress) >= 0.5;
    const target = commit ? (plan.progress >= 0 ? Math.PI / 2 : -Math.PI / 2) : 0;
    turnAnim.current = {
      active: true, from: plan.progress * (Math.PI / 2), to: target, start: performance.now(), dur: 180,
      cb: () => {
        if (commit) {
          const move = plan.move;
          const next = applyMove(displayRef.current, move);
          displayRef.current = next;
          if (onMoveRef.current) onMoveRef.current(move);
          else setInternal(next);
        }
        resetCubies();
        updateStickers();
      },
    };
    gesture.current = { mode: "none", x: 0, y: 0, started: false };
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    scaleRef.current = Math.min(1.8, Math.max(0.55, scaleRef.current * (e.deltaY > 0 ? 1.08 : 0.92)));
    applyZoom();
  }

  function resetView() {
    rotRef.current = DEFAULT_ROT; scaleRef.current = 1;
    applyView(DEFAULT_ROT); applyZoom();
  }

  // 2D 展开图
  const s = size / 13;
  const g = s * 0.35;
  const block = 3 * s;
  const width = 4 * block + 3 * g;
  const height = 3 * block + 2 * g;

  // 视图预设
  const presets: [string, number, number][] = [
    ["前", -26, -34], ["上", -90, 0], ["左", 0, 90], ["右", 0, -90], ["立体", -28, -28], ["复位", -26, -34],
  ];

  return (
    <div className="w-full" data-testid={testId}>
      <div className="flex gap-1 mb-3 text-xs">
        <button data-view="net" onClick={() => setView("net")} className={`px-3 py-1 rounded-md transition ${view === "net" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>展开图</button>
        <button data-view="3d" onClick={() => setView("3d")} className={`px-3 py-1 rounded-md transition ${view === "3d" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>3D 视图</button>
      </div>

      {view === "net" ? (
        <div className="flex justify-center">
          <svg width={size} height={(size * height) / width} viewBox={`0 0 ${width} ${height}`} className="max-w-full">
            {LAYOUT.map(({ face, col, row }) => {
              const ox = col * (block + g), oy = row * (block + g);
              const colors = getFaceColors(display, face);
              const active = highlightFace === face;
              return (
                <g key={face}>
                  {colors.map((rowArr, i) => rowArr.map((c, j) => (
                    <rect key={`${i}-${j}`} x={ox + j * s + s * 0.06} y={oy + i * s + s * 0.06} width={s * 0.88} height={s * 0.88} rx={s * 0.18} fill={FACE_COLORS[c]} stroke="#0f172a" strokeOpacity={0.18} strokeWidth={1} />
                  )))}
                  {active && <rect x={ox} y={oy} width={block} height={block} rx={s * 0.3} fill="none" stroke="#2563eb" strokeWidth={s * 0.18} />}
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {webglFail ? (
            <div
              data-testid="webgl-fallback"
              className="flex items-center justify-center rounded-xl bg-slate-100 text-center text-sm text-slate-500 p-6"
              style={{ width: size, height: size }}
            >
              <div>
                当前环境不支持 WebGL，3D 视图暂不可用。<br />
                请切换到「展开图」继续，或在支持 WebGL 的浏览器中打开本页面。
              </div>
            </div>
          ) : (
            <div
              ref={containerRef}
              className={`relative rounded-xl overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ width: size, height: size, background: "radial-gradient(120% 120% at 50% 30%, #eef2fb 0%, #dde6f5 55%, #c7d4ea 100%)" }}
              title="在色块上拖动=拧动该层 · 在空白处拖动=旋转视角 · 滚轮缩放 · 双击复位"
            />
          )}
          <div className="flex flex-wrap gap-1 mt-3 justify-center">
            {presets.map(([label, x, y]) => (
              <button key={label} onClick={() => { if (label === "复位") resetView(); else { rotRef.current = { x, y }; applyView({ x, y }); } }} className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition">{label}</button>
            ))}
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
