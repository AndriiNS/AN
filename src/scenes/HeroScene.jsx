//* -- Hero scene: "Build → Automate → Ship" --
// A small website made of soft 3D blocks. Scroll drives three stages:
//   1. Build     (0.04–0.32)  a blueprint of the page; a yellow cursor walks over it
//                             and every element grows into place, one after another
//   2. Automate  (0.36–0.62)  a script scans the page again and again, and tasks run
//                             along a conveyor through the "auto.py" gate on their own
//   3. Ship      (0.66–0.92)  the page rearranges into a phone layout and goes live
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, Line, RoundedBox } from '@react-three/drei';

//* -- Palette (matches src/styles/_tokens.scss) --
const C = {
  paper: '#ffffff',
  chrome: '#e3e7ee',
  ink: '#1b1e26',
  grey: '#c5cbd6',
  blue: '#2142d9',
  blueSoft: '#cfd8ff',
  yellow: '#ffcc33',
  card: '#f1f3f6',
};

//* -- Stage timing on the 0..1 scroll progress (Hero.jsx shows captions at the same points) --
const BUILD = [0.04, 0.32];
const AUTOMATE = [0.34, 0.64];
const SHIP = [0.64, 0.92];

//* -- The page --
// a: desktop layout, b: phone layout. [x, y] centre and [w, h] size.
// layer: DOM depth (z offset). label: tag shown while the element is being built.
const BLOCKS = [
  { id: 'body', color: C.paper, layer: 0, a: [0, 0, 7, 4.6], b: [0, 0, 2.7, 5.6] },
  { id: 'bar', color: C.chrome, layer: 1, a: [0, 2.05, 7, 0.5], b: [0, 2.6, 2.7, 0.4], label: '<header>' },
  { id: 'dot1', color: C.yellow, layer: 2, a: [-3.15, 2.05, 0.16, 0.16], b: [-1.1, 2.6, 0.12, 0.12] },
  { id: 'dot2', color: C.blue, layer: 2, a: [-2.9, 2.05, 0.16, 0.16], b: [-0.92, 2.6, 0.12, 0.12] },
  { id: 'dot3', color: C.grey, layer: 2, a: [-2.65, 2.05, 0.16, 0.16], b: [-0.74, 2.6, 0.12, 0.12] },
  { id: 'logo', color: C.blue, layer: 1, a: [-2.65, 1.35, 1, 0.26], b: [-0.75, 2.05, 0.8, 0.22] },
  // desktop nav links become a burger icon on the phone
  { id: 'nav1', color: C.grey, layer: 1, a: [1.45, 1.35, 0.55, 0.12], b: [0.95, 2.13, 0.36, 0.05], label: '<nav>' },
  { id: 'nav2', color: C.grey, layer: 1, a: [2.15, 1.35, 0.55, 0.12], b: [0.95, 2.04, 0.36, 0.05] },
  { id: 'nav3', color: C.grey, layer: 1, a: [2.85, 1.35, 0.55, 0.12], b: [0.95, 1.95, 0.36, 0.05] },
  { id: 'title', color: C.ink, layer: 2, a: [-1.35, 0.55, 3.2, 0.36], b: [-0.1, 1.5, 2.3, 0.32], label: '<h1>' },
  { id: 'line1', color: C.grey, layer: 2, a: [-1.75, 0.05, 2.4, 0.14], b: [-0.2, 1.1, 2.1, 0.12], label: '<p>' },
  { id: 'line2', color: C.grey, layer: 2, a: [-1.95, -0.22, 2, 0.14], b: [-0.4, 0.88, 1.7, 0.12] },
  { id: 'button', color: C.blue, layer: 3, a: [-2.45, -0.75, 1, 0.34], b: [-0.6, 0.45, 1.1, 0.32], label: '<button>' },
  { id: 'image', color: C.yellow, layer: 2, a: [1.75, -0.1, 2.6, 1.9], b: [0, -0.45, 2.3, 1.25], label: '<img>' },
  { id: 'card1', color: C.card, layer: 1, a: [-2.25, -1.65, 2, 0.85], b: [0, -1.45, 2.3, 0.38], label: '<section>' },
  { id: 'card2', color: C.card, layer: 1, a: [0, -1.65, 2, 0.85], b: [0, -1.95, 2.3, 0.38] },
  { id: 'card3', color: C.card, layer: 1, a: [2.25, -1.65, 2, 0.85], b: [0, -2.45, 2.3, 0.38] },
];
const DEPTH = 0.16;
const LAYER_GAP = 0.13;
const PAGE_W = 7;
// the body is already there at the start (the empty canvas); the rest is built in order
const BUILD_STEP = (BUILD[1] - BUILD[0]) / (BLOCKS.length - 1);
const BUILD_DUR = BUILD_STEP * 2.4;

//* -- Helpers --
const smooth = THREE.MathUtils.smoothstep;
const lerp = THREE.MathUtils.lerp;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
// overshoots a little and settles, like the logo strokes in the loader
function backOut(t) {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}
const buildStart = (i) => BUILD[0] + (i - 1) * BUILD_STEP;
const buildAmount = (i, p) => (i === 0 ? 1 : backOut(clamp01((p - buildStart(i)) / BUILD_DUR)));

// The same "random" numbers on every load, so the scene looks the same each time
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
function useDelays() {
  return useMemo(() => {
    const rand = seeded(7);
    return BLOCKS.map(() => rand());
  }, []);
}

// where the scan beam is during "Automate": sweeps left to right, then starts again
const beamX = (time) => -PAGE_W / 2 - 0.4 + ((time * 0.42) % 1) * (PAGE_W + 0.8);
// how much the stage "Automate" is on (fades in and out)
const automateAmount = (p) => smooth(p, AUTOMATE[0], AUTOMATE[0] + 0.05) * (1 - smooth(p, SHIP[0], SHIP[0] + 0.06));

//* -- One element of the page --
function Block({ block, index, delay, progressRef }) {
  const meshRef = useRef(null);
  const labelRef = useRef(null);
  const base = useMemo(() => new THREE.Color(block.color), [block.color]);
  const flash = useMemo(() => new THREE.Color(C.blueSoft), []);
  const [ax, ay, aw, ah] = block.a;
  const [bx, by, bw, bh] = block.b;

  useFrame(({ clock }) => {
    const p = progressRef.current;
    const built = buildAmount(index, p);
    const ship = smooth(p, SHIP[0] + delay * 0.06, SHIP[1] - 0.06 + delay * 0.05);

    // Automate: the element lifts and lights up for a moment when the scan beam passes over it
    const auto = automateAmount(p);
    const dist = ax - beamX(clock.elapsedTime);
    const scan = auto * Math.exp(-(dist * dist) / 0.35) * (index === 0 ? 0 : 1);

    const z = block.layer * LAYER_GAP + (1 - Math.min(1, built)) * 0.9 + scan * 0.35;
    const mesh = meshRef.current;
    mesh.position.set(lerp(ax, bx, ship), lerp(ay, by, ship), z);
    const grow = Math.max(0.001, built);
    mesh.scale.set(lerp(1, bw / aw, ship) * grow, lerp(1, bh / ah, ship) * grow, grow);
    mesh.material.color.copy(base).lerp(flash, scan * (block.color === C.paper || block.color === C.card || block.color === C.chrome || block.color === C.grey ? 0.8 : 0));

    if (labelRef.current) {
      const s = buildStart(index);
      const show = smooth(p, s, s + 0.01) * (1 - smooth(p, s + BUILD_DUR + 0.015, s + BUILD_DUR + 0.04));
      labelRef.current.style.opacity = String(show);
    }
  });

  return (
    <RoundedBox ref={meshRef} args={[aw, ah, DEPTH]} radius={Math.min(0.06, ah / 2.2)} smoothness={3} castShadow receiveShadow>
      <meshPhysicalMaterial color={block.color} roughness={0.55} clearcoat={0.35} clearcoatRoughness={0.4} />
      {block.label && (
        <Html position={[-aw / 2, ah / 2, DEPTH]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <span ref={labelRef} className="scene-tag" style={{ opacity: 0 }}>
            {block.label}
          </span>
        </Html>
      )}
    </RoundedBox>
  );
}

//* -- Blueprint: dashed outlines of the elements that are not built yet --
function Outline({ block, index, progressRef }) {
  const ref = useRef(null);
  const [x, y, w, h] = block.a;
  const z = block.layer * LAYER_GAP + DEPTH / 2 + 0.01;
  const points = useMemo(
    () => [
      [x - w / 2, y - h / 2, z],
      [x + w / 2, y - h / 2, z],
      [x + w / 2, y + h / 2, z],
      [x - w / 2, y + h / 2, z],
      [x - w / 2, y - h / 2, z],
    ],
    [x, y, w, h, z],
  );

  useFrame(() => {
    const p = progressRef.current;
    const s = buildStart(index);
    ref.current.material.opacity = 0.75 * (1 - smooth(p, s, s + BUILD_DUR * 0.5));
    ref.current.visible = ref.current.material.opacity > 0.01;
  });

  return <Line ref={ref} points={points} color={C.blue} lineWidth={1.4} dashed dashSize={0.09} gapSize={0.07} transparent />;
}

//* -- The yellow cursor: builds the page, then becomes the scan beam --
function Cursor({ progressRef }) {
  const ref = useRef(null);
  const state = useRef({ x: -3.2, y: 1.6, h: 0.5 });

  useFrame(({ clock }, delta) => {
    const p = progressRef.current;
    const t = clock.elapsedTime;
    // during "Build": stand at the left edge of the element that is growing now
    let k = 1;
    for (let i = 1; i < BLOCKS.length; i += 1) if (p >= buildStart(i) - BUILD_STEP * 0.5) k = i;
    const [bx, by, bw, bh] = BLOCKS[k].a;
    const st = state.current;
    st.x = THREE.MathUtils.damp(st.x, bx - bw / 2 - 0.14, 14, delta);
    st.y = THREE.MathUtils.damp(st.y, by, 14, delta);
    st.h = THREE.MathUtils.damp(st.h, Math.max(0.36, Math.min(bh, 1.2)), 14, delta);

    const auto = automateAmount(p);
    const ship = smooth(p, SHIP[0], SHIP[0] + 0.05);
    const mesh = ref.current;
    mesh.position.set(lerp(st.x, beamX(t), auto), lerp(st.y, 0, auto), 0.62);
    mesh.scale.set(lerp(1, 0.6, auto), lerp(st.h, 5.2, auto) / 0.5, 1);
    // blink like a text cursor while waiting at the start and after the page is built
    const idle = p < BUILD[0] - 0.01 || (p > BUILD[1] + 0.02 && auto < 0.05);
    mesh.visible = ship < 0.99 && (!idle || Math.floor(t * 2) % 2 === 0);
    mesh.material.opacity = (1 - ship) * lerp(1, 0.75, auto);
  });

  return (
    <mesh ref={ref} position={[-3.2, 1.6, 0.62]}>
      <boxGeometry args={[0.11, 0.5, 0.11]} />
      <meshStandardMaterial color={C.yellow} emissive={C.yellow} emissiveIntensity={0.35} transparent />
    </mesh>
  );
}

//* -- Automate: tasks run along a conveyor through the script gate on their own --
const CHIPS = 7;
const TRACK = 8.4;
const GATE_X = 0.4;
function Conveyor({ progressRef }) {
  const groupRef = useRef(null);
  const chipRefs = useRef([]);
  const tagRef = useRef(null);
  const grey = useMemo(() => new THREE.Color(C.grey), []);
  const blue = useMemo(() => new THREE.Color(C.blue), []);

  useFrame(({ clock }) => {
    const p = progressRef.current;
    const auto = automateAmount(p);
    const group = groupRef.current;
    // the tag is HTML on top of the canvas, so it has to be hidden by hand
    if (tagRef.current) tagRef.current.style.opacity = String(smooth(auto, 0.6, 1));
    group.visible = auto > 0.01;
    if (!group.visible) return;
    group.scale.setScalar(lerp(0.6, 1, auto));
    group.position.z = lerp(-1, 0.3, auto);

    chipRefs.current.forEach((chip, i) => {
      // every chip moves at the same speed, spaced evenly, and starts again at the left
      const x = (((clock.elapsedTime * 0.9 + (i * TRACK) / CHIPS) % TRACK) + TRACK) % TRACK - TRACK / 2;
      const edge = smooth(x, -TRACK / 2, -TRACK / 2 + 0.6) * (1 - smooth(x, TRACK / 2 - 0.6, TRACK / 2));
      chip.position.x = x;
      chip.scale.setScalar(Math.max(0.001, edge * auto));
      // processed once it has passed the gate
      chip.material.color.copy(grey).lerp(blue, smooth(x, GATE_X - 0.2, GATE_X + 0.2));
    });
  });

  return (
    <group ref={groupRef} position={[0, -3.25, 0.3]} visible={false}>
      <RoundedBox args={[TRACK, 0.08, 0.5]} radius={0.03} smoothness={2} position={[0, -0.2, 0]} receiveShadow>
        <meshStandardMaterial color={C.chrome} roughness={0.8} />
      </RoundedBox>
      {/* the gate: the script that does the work */}
      <group position={[GATE_X, 0.2, 0]}>
        <mesh position={[-0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.8, 0.5]} />
          <meshStandardMaterial color={C.yellow} roughness={0.4} />
        </mesh>
        <mesh position={[0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.8, 0.5]} />
          <meshStandardMaterial color={C.yellow} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.08, 0.08, 0.5]} />
          <meshStandardMaterial color={C.yellow} roughness={0.4} />
        </mesh>
        <Html position={[-0.54, 0.44, 0.25]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <span ref={tagRef} className="scene-tag" style={{ opacity: 0 }}>
            auto.py
          </span>
        </Html>
      </group>
      {Array.from({ length: CHIPS }, (_, i) => (
        <RoundedBox
          key={i}
          ref={(el) => {
            chipRefs.current[i] = el;
          }}
          args={[0.46, 0.28, 0.3]}
          radius={0.06}
          smoothness={2}
          position={[0, 0.0, 0]}
          castShadow
        >
          <meshPhysicalMaterial color={C.grey} roughness={0.5} clearcoat={0.3} />
        </RoundedBox>
      ))}
    </group>
  );
}

//* -- Ship: a phone around the new layout and a "live" tag --
function Phone({ progressRef }) {
  const ref = useRef(null);
  const tagRef = useRef(null);
  useFrame(() => {
    const p = progressRef.current;
    const s = backOut(clamp01((p - (SHIP[0] + 0.1)) / 0.12));
    ref.current.scale.setScalar(Math.max(0.001, s));
    ref.current.visible = s > 0.002;
    if (tagRef.current) tagRef.current.style.opacity = String(smooth(p, SHIP[1] - 0.06, SHIP[1]));
  });
  return (
    <group ref={ref} visible={false}>
      <RoundedBox args={[3.15, 6.3, 0.22]} radius={0.32} smoothness={4} position={[0, -0.05, -0.16]} castShadow receiveShadow>
        <meshPhysicalMaterial color={C.ink} roughness={0.35} clearcoat={0.6} />
      </RoundedBox>
      <Html position={[0.05, 3.45, 0.1]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <span ref={tagRef} className="scene-tag scene-tag--live" style={{ opacity: 0 }}>
          ● live
        </span>
      </Html>
    </group>
  );
}

//* -- The whole page, turned by scroll and mouse --
// How much room the scene needs (in its own units) at each stage, for fitting it on phones:
// the page with tags; the page plus the conveyor below it; the tall phone with its "live" tag.
const NEED_W = { build: 7.4, automate: 7.8, ship: 3.6 };
const NEED_H = { build: 5.2, automate: 6.4, ship: 7.0 };
const CENTER = { build: 0.1, automate: -0.45, ship: 0.15 }; // vertical centre of that content

function Page({ progressRef, layoutRef, reduced }) {
  const groupRef = useRef(null);
  const smoothProgress = useRef({ current: 0 });
  const placed = useRef(false);
  const delays = useDelays();
  const { viewport, size } = useThree();

  // wide screens: page on the right of the headline; narrow: above the text
  const wide = viewport.aspect > 1.15;

  useFrame(({ pointer }, delta) => {
    // reduced motion: no scroll story, just the finished page
    const target = reduced ? BUILD[1] + 0.02 : progressRef.current;
    const sp = smoothProgress.current;
    sp.current = THREE.MathUtils.damp(sp.current, target, 5, delta);
    const p = sp.current;

    const auto = automateAmount(p);
    const ship = smooth(p, SHIP[0], SHIP[1]);
    const group = groupRef.current;
    // a calm three-quarter view while building, more depth while the script runs,
    // and face to face with the visitor when it ships (a bit flatter on phones, so it reads bigger)
    const turn = wide ? 1 : 0.7;
    const ry = (-0.3 - auto * 0.25) * turn + ship * 0.42 * (wide ? 1 : 0.6) + (reduced ? 0 : pointer.x * 0.12);
    const rx = 0.08 + auto * 0.22 - ship * 0.12 - (reduced ? 0 : pointer.y * 0.06);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, ry, 4, delta);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, rx, 4, delta);

    let scale;
    let x;
    let y;
    if (wide) {
      // the phone of the last stage must fit between the header and the stage bars
      // (about 64 + 70 px), also on short landscape screens
      const freeHeight = viewport.height * (1 - 134 / size.height) - 0.4;
      scale = Math.min(0.9, viewport.width / 15.5, freeHeight / 6.5);
      x = viewport.width * (viewport.aspect > 1.6 ? 0.23 : 0.2);
      y = auto * 0.35 * scale;
    } else {
      // phones and tablets in portrait: use all the free space between the header and the
      // text below. At the start that is the headline; once it fades, the shorter stage caption.
      const L = layoutRef.current;
      const k = viewport.height / size.height; // scene units per pixel
      const textTop = L.height ? lerp(L.introTop, L.captionsTop, smooth(p, 0, 0.08)) : size.height * 0.45;
      const top = (L.top || 64) + 10;
      const bottom = textTop - 14;
      const pick = (v) => lerp(lerp(v.build, v.automate, auto), v.ship, ship);
      scale = Math.max(0.1, Math.min((viewport.width * 0.96) / pick(NEED_W), ((bottom - top) * k) / pick(NEED_H)));
      x = 0;
      y = (size.height / 2 - (top + bottom) / 2) * k - pick(CENTER) * scale;
    }
    // first frame: jump straight to the right place, afterwards move smoothly
    const ease = placed.current ? (v, to) => THREE.MathUtils.damp(v, to, 6, delta) : (v, to) => to;
    placed.current = true;
    group.scale.setScalar(ease(group.scale.x, scale));
    group.position.x = ease(group.position.x, x);
    group.position.y = ease(group.position.y, y);
  });

  return (
    <group ref={groupRef} scale={0.4}>
      {BLOCKS.map((block, i) => (
        <Block key={block.id} block={block} index={i} delay={delays[i]} progressRef={smoothProgress.current} />
      ))}
      {BLOCKS.map((block, i) => (i === 0 || block.a[2] < 0.3 ? null : <Outline key={block.id} block={block} index={i} progressRef={smoothProgress.current} />))}
      {!reduced && <Cursor progressRef={smoothProgress.current} />}
      {!reduced && <Conveyor progressRef={smoothProgress.current} />}
      <Phone progressRef={smoothProgress.current} />
    </group>
  );
}

//* -- Canvas, light and shadow --
// phones and tablets: a little lower resolution, so the scene keeps a steady frame rate
const TOUCH = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export default function HeroScene({ progressRef, layoutRef, reduced, active }) {
  return (
    <Canvas
      shadows
      dpr={[1, TOUCH ? 1.5 : 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 14], fov: 32 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[-5, 8, 9]}
        intensity={1.8}
        castShadow
        shadow-mapSize={TOUCH ? [512, 512] : [1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
      />

      {/* studio light for soft reflections, built from shapes, no image files */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} position={[0, 5, 5]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1} position={[-6, 0, 3]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="circle" intensity={0.6} color="#ffe7a0" position={[6, -2, 3]} rotation-y={-Math.PI / 2} scale={3} />
      </Environment>

      <Page progressRef={progressRef} layoutRef={layoutRef} reduced={reduced} />
      <ContactShadows position={[0, -3.6, 0]} opacity={0.28} scale={24} blur={2.8} far={9} resolution={512} color="#1b1e26" />
    </Canvas>
  );
}
