//* -- Hero scene: an isometric "web factory" --
// A small low-poly workshop on a floating floor. A conveyor belt runs through three
// stations and keeps working on its own:
//   1. Build     a gantry "prints" each page from raw blocks, a monitor shows code
//   2. Automate  pages pass a scanner tunnel ("auto.py"), gears turn, every page gets a check
//   3. Ship      finished pages rise into a big phone, a beacon sends out "live" rings
// Scrolling moves the isometric camera: overview, then station by station.
// Hero.jsx shows the captions at the same scroll points (STAGE_STARTS).
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, OrthographicCamera, RoundedBox } from '@react-three/drei';

//* -- Palette (matches src/styles/_tokens.scss) --
const C = {
  floor: '#ffffff',
  base: '#d9dee6',
  chrome: '#e3e7ee',
  ink: '#1b1e26',
  grey: '#c5cbd6',
  blue: '#2142d9',
  blueSoft: '#cfd8ff',
  yellow: '#ffcc33',
  card: '#f1f3f6',
};

//* -- Layout of the factory (scene units) --
const S1 = -6.4; // Build
const S2 = 0; // Automate
const S3 = 6.6; // Ship
const PHONE_X = 8.6;
const BELT_START = -12.2;
const BELT_END = 7.4;
const BELT_Y = 0.75; // top of the belt
const ITEMS = 8;
const SPEED = 1.05;
const LOOP = PHONE_X + 0.6 - BELT_START;

//* -- Helpers --
const smooth = THREE.MathUtils.smoothstep;
const lerp = THREE.MathUtils.lerp;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
function backOut(t) {
  const c1 = 1.8;
  return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}
const pop = (t) => Math.max(0.0001, backOut(clamp01(t)));

// which station the camera looks at: 0 overview, 1 build, 2 automate, 3 ship (with blends)
function stageWeights(p) {
  const toBuild = smooth(p, 0.02, 0.12);
  const toAuto = smooth(p, 0.29, 0.39);
  const toShip = smooth(p, 0.59, 0.69);
  return { toBuild, toAuto, toShip };
}

//* -- Small building blocks --
function Box({ size, color, radius = 0.06, ...props }) {
  return (
    <RoundedBox args={size} radius={Math.min(radius, Math.min(...size) / 2.2)} smoothness={2} castShadow receiveShadow {...props}>
      <meshStandardMaterial color={color} roughness={0.6} />
    </RoundedBox>
  );
}

function Tag({ position, children, tagRef, live = false }) {
  return (
    <Html position={position} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <span ref={tagRef} className={`scene-tag scene-tag--static ${live ? 'scene-tag--live' : ''}`}>
        {children}
      </span>
    </Html>
  );
}

//* -- Floor, belt and decoration --
function Floor() {
  return (
    <group>
      <Box size={[26.5, 0.5, 8.6]} color={C.floor} radius={0.25} position={[-1.6, -0.25, -0.3]} />
      <Box size={[25.9, 0.7, 8]} color={C.base} radius={0.25} position={[-1.6, -0.75, -0.3]} />
      {/* yellow safety marks around the stations */}
      {[S1, S2, S3].map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.005, 0]} receiveShadow>
          <ringGeometry args={[2.05, 2.15, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color={C.yellow} />
        </mesh>
      ))}
    </group>
  );
}

function Belt() {
  const rollers = useMemo(() => Array.from({ length: 26 }, (_, i) => BELT_START + 0.4 + i * 0.76), []);
  const len = BELT_END - BELT_START;
  return (
    <group>
      <Box size={[len, 0.16, 1.5]} color={C.ink} radius={0.07} position={[(BELT_START + BELT_END) / 2, BELT_Y - 0.08, 0]} />
      {/* side rails */}
      {[-0.82, 0.82].map((z) => (
        <Box key={z} size={[len, 0.22, 0.12]} color={C.grey} radius={0.04} position={[(BELT_START + BELT_END) / 2, BELT_Y - 0.02, z]} />
      ))}
      {/* legs */}
      {rollers
        .filter((_, i) => i % 4 === 0)
        .map((x) => [-0.7, 0.7].map((z) => <Box key={`${x}${z}`} size={[0.14, BELT_Y - 0.16, 0.14]} color={C.grey} position={[x, (BELT_Y - 0.16) / 2, z]} />))}
      {/* material crate at the start of the line */}
      <Box size={[1.4, 1.1, 1.8]} color={C.yellow} radius={0.1} position={[BELT_START - 0.6, 0.55, 0]} />
      <Box size={[1.2, 0.08, 1.6]} color={C.ink} radius={0.03} position={[BELT_START - 0.6, 1.12, 0]} />
    </group>
  );
}

function Tree({ position, color, size = 1 }) {
  return (
    <group position={position} scale={size}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 0.7, 6]} />
        <meshStandardMaterial color={C.ink} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1, 0]} castShadow>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} roughness={0.5} flatShading />
      </mesh>
    </group>
  );
}

//* -- The things on the belt: raw blocks -> a page -> a checked page -> into the phone --
function Item({ index }) {
  const ref = useRef(null);
  const raw = useRef(null);
  const page = useRef([]);
  const badge = useRef(null);
  const tray = useRef(null);
  const trayBase = useMemo(() => new THREE.Color(C.floor), []);
  const trayFlash = useMemo(() => new THREE.Color(C.yellow), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const d = (((t * SPEED + (index * LOOP) / ITEMS) % LOOP) + LOOP) % LOOP;
    const x = BELT_START + d;
    const built = smooth(x, S1 - 0.9, S1 + 0.6);
    const checked = smooth(x, S2 + 0.6, S2 + 1.1);
    const lift = smooth(x, S3 - 0.2, PHONE_X);
    const spawn = smooth(x, BELT_START, BELT_START + 0.8);
    const gone = 1 - smooth(x, PHONE_X - 0.5, PHONE_X + 0.4);

    const g = ref.current;
    g.position.set(Math.min(x, lerp(x, PHONE_X - 0.15, lift)), BELT_Y + lift * 3.1, -lift * 0.35);
    g.scale.setScalar(Math.max(0.0001, spawn * gone * lerp(1, 0.55, lift)));
    g.rotation.y = lift * 0.5;

    raw.current.scale.setScalar(Math.max(0.0001, 1 - built));
    page.current.forEach((m, i) => m && m.scale.setScalar(pop((built - i * 0.12) * 1.6)));
    badge.current.scale.setScalar(pop(checked * 1.2));
    // a short yellow flash while the scanner reads the page
    const flash = Math.exp(-((x - (S2 - 0.2)) ** 2) / 0.08);
    tray.current.material.color.copy(trayBase).lerp(trayFlash, flash * 0.8);
  });

  return (
    <group ref={ref}>
      {/* raw material: three blocks */}
      <group ref={raw}>
        <Box size={[0.36, 0.36, 0.36]} color={C.grey} position={[-0.25, 0.18, 0.15]} />
        <Box size={[0.3, 0.3, 0.3]} color={C.blue} position={[0.2, 0.15, -0.2]} />
        <Box size={[0.26, 0.26, 0.26]} color={C.yellow} position={[0.15, 0.13, 0.25]} />
      </group>
      {/* the page: tray and its elements, grown in order */}
      <group
        ref={(m) => {
          page.current[0] = m;
        }}
      >
        <RoundedBox ref={tray} args={[1.3, 0.1, 1]} radius={0.04} smoothness={2} position={[0, 0.05, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={C.floor} roughness={0.5} />
        </RoundedBox>
      </group>
      <group
        ref={(m) => {
          page.current[1] = m;
        }}
      >
        <Box size={[1.2, 0.08, 0.18]} color={C.chrome} radius={0.03} position={[0, 0.14, -0.36]} />
      </group>
      <group
        ref={(m) => {
          page.current[2] = m;
        }}
      >
        <Box size={[0.5, 0.1, 0.5]} color={C.yellow} radius={0.03} position={[0.3, 0.15, 0.1]} />
      </group>
      <group
        ref={(m) => {
          page.current[3] = m;
        }}
      >
        <Box size={[0.42, 0.06, 0.08]} color={C.ink} radius={0.02} position={[-0.28, 0.13, -0.08]} />
        <Box size={[0.34, 0.05, 0.06]} color={C.grey} radius={0.02} position={[-0.32, 0.12, 0.06]} />
        <Box size={[0.24, 0.08, 0.12]} color={C.blue} radius={0.03} position={[-0.36, 0.14, 0.26]} />
      </group>
      {/* the check from the automation */}
      <group ref={badge} position={[0.62, 0.32, 0.45]}>
        <mesh rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.08, 16]} />
          <meshStandardMaterial color={C.blue} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

//* -- Station 1: Build --
function BuildStation({ progressRef }) {
  const head = useRef(null);
  const bars = useRef([]);
  const tag = useRef(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    head.current.position.z = Math.sin(t * 2.4) * 0.45;
    head.current.position.y = 2.15 + Math.abs(Math.sin(t * 4.8)) * -0.12;
    // the code on the monitor keeps changing
    bars.current.forEach((b, i) => b && b.scale.set(0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + i * 1.7)), 1, 1));
    if (tag.current) tag.current.style.opacity = String(focusOn(progressRef.current, 1));
  });
  return (
    <group position={[S1, 0, 0]}>
      {/* gantry */}
      {[-1.1, 1.1].map((z) => (
        <Box key={z} size={[0.18, 2.4, 0.18]} color={C.ink} position={[0, 1.2, z]} />
      ))}
      <Box size={[0.26, 0.22, 2.6]} color={C.ink} position={[0, 2.45, 0]} />
      <group ref={head} position={[0, 2.15, 0]}>
        <Box size={[0.5, 0.4, 0.5]} color={C.yellow} radius={0.08} />
        <mesh position={[0, -0.38, 0]} castShadow>
          <coneGeometry args={[0.12, 0.3, 8]} />
          <meshStandardMaterial color={C.ink} />
        </mesh>
      </group>
      {/* monitor with code */}
      <group position={[-0.4, 0, -2.3]}>
        <Box size={[0.12, 0.9, 0.12]} color={C.grey} position={[0, 0.45, 0]} />
        <Box size={[2, 1.3, 0.12]} color={C.ink} radius={0.08} position={[0, 1.5, 0]} />
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[-0.75, 1.88 - i * 0.19, 0.07]}>
            <mesh
              ref={(m) => {
                bars.current[i] = m;
              }}
              position={[0, 0, 0]}
            >
              <boxGeometry args={[1.3, 0.08, 0.02]} />
              <meshBasicMaterial color={[C.blueSoft, C.yellow, C.grey, C.blueSoft, C.grey][i]} />
            </mesh>
          </group>
        ))}
        <Tag position={[0, 2.45, 0]} tagRef={tag}>
          npm run build
        </Tag>
      </group>
    </group>
  );
}

// how much the camera is looking at a station right now (0..1), for its tag
function focusOn(p, station) {
  const { toBuild, toAuto, toShip } = stageWeights(p);
  const w = [1 - toBuild, toBuild * (1 - toAuto), toAuto * (1 - toShip), toShip];
  return smooth(w[station], 0.5, 0.9);
}

//* -- Station 2: Automate --
function Gear({ position, radius, speed, color }) {
  const ref = useRef(null);
  const teeth = Math.round(radius * 14);
  useFrame(({ clock }) => {
    ref.current.rotation.z = clock.elapsedTime * speed;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, 0.16, 24]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {Array.from({ length: teeth }, (_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} rotation-y={-a} castShadow>
            <boxGeometry args={[0.14, 0.16, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

function AutomateStation({ progressRef }) {
  const laser = useRef(null);
  const leds = useRef([]);
  const tag = useRef(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    laser.current.material.opacity = 0.35 + 0.25 * Math.sin(t * 18);
    leds.current.forEach((m, i) => m && (m.visible = Math.sin(t * (2 + i * 0.7) + i) > -0.2));
    if (tag.current) tag.current.style.opacity = String(focusOn(progressRef.current, 2));
  });
  return (
    <group position={[S2, 0, 0]}>
      {/* the scanner tunnel over the belt */}
      {[-1, 1].map((z) => (
        <Box key={z} size={[1.8, 2, 0.3]} color={C.chrome} radius={0.1} position={[0, 1, z]} />
      ))}
      <Box size={[2, 0.4, 2.4]} color={C.blue} radius={0.12} position={[0, 2.15, 0]} />
      <mesh ref={laser} position={[-0.2, 1.3, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.7, 1.1]} />
        <meshBasicMaterial color={C.yellow} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* gears on the roof, standing up so they face the camera */}
      <group position={[0, 2.35, 0]} rotation-y={Math.PI / 4}>
        <group rotation-x={Math.PI / 2}>
          <Gear position={[-0.42, 0, -0.68]} radius={0.62} speed={1.2} color={C.yellow} />
          <Gear position={[0.62, 0, -0.98]} radius={0.42} speed={-1.77} color={C.ink} />
        </group>
      </group>
      {/* a small server rack with blinking lights */}
      <group position={[1.4, 0, -2.5]}>
        <Box size={[1, 2.2, 0.9]} color={C.ink} radius={0.08} position={[0, 1.1, 0]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            ref={(m) => {
              leds.current[i] = m;
            }}
            position={[-0.25 + (i % 2) * 0.5, 0.5 + Math.floor(i / 2) * 0.55, 0.46]}
          >
            <boxGeometry args={[0.16, 0.08, 0.02]} />
            <meshBasicMaterial color={i % 3 === 0 ? C.yellow : C.blueSoft} />
          </mesh>
        ))}
      </group>
      <Tag position={[0, 3.3, 0]} tagRef={tag}>
        auto.py
      </Tag>
    </group>
  );
}

//* -- Station 3: Ship --
function ShipStation({ progressRef }) {
  const ring = useRef(null);
  const tag = useRef(null);
  useFrame(({ clock }) => {
    const f = (clock.elapsedTime * 0.7) % 1;
    ring.current.scale.setScalar(0.4 + f * 2.2);
    ring.current.material.opacity = 0.7 * (1 - f);
    if (tag.current) tag.current.style.opacity = String(Math.max(0.35, focusOn(progressRef.current, 3)));
  });
  return (
    <group>
      {/* the phone, turned towards the camera */}
      <group position={[PHONE_X, 0, -0.4]} rotation-y={Math.PI / 4}>
        <Box size={[2.1, 3.9, 0.28]} color={C.ink} radius={0.3} position={[0, 1.95, 0]} />
        <Box size={[1.85, 3.5, 0.06]} color={C.floor} radius={0.18} position={[0, 1.95, 0.15]} />
        {/* the shipped page on its screen */}
        <Box size={[1.7, 0.3, 0.04]} color={C.chrome} radius={0.05} position={[0, 3.45, 0.19]} />
        <Box size={[0.6, 0.14, 0.04]} color={C.blue} radius={0.04} position={[-0.5, 3.05, 0.19]} />
        <Box size={[1.5, 0.2, 0.04]} color={C.ink} radius={0.04} position={[0, 2.75, 0.19]} />
        <Box size={[1.5, 0.9, 0.04]} color={C.yellow} radius={0.06} position={[0, 2.05, 0.19]} />
        {[0, 1, 2].map((i) => (
          <Box key={i} size={[1.5, 0.22, 0.04]} color={C.card} radius={0.04} position={[0, 1.35 - i * 0.32, 0.19]} />
        ))}
      </group>
      {/* the beacon: the site is live */}
      <group position={[PHONE_X, 4.35, -0.4]}>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
          <meshStandardMaterial color={C.ink} />
        </mesh>
        <mesh castShadow>
          <sphereGeometry args={[0.16, 16, 12]} />
          <meshStandardMaterial color={C.yellow} emissive={C.yellow} emissiveIntensity={0.6} />
        </mesh>
        <mesh ref={ring} rotation-x={-Math.PI / 2}>
          <torusGeometry args={[0.4, 0.03, 8, 40]} />
          <meshBasicMaterial color={C.blue} transparent />
        </mesh>
        <Tag position={[0, 0.65, 0]} tagRef={tag} live>
          ● live
        </Tag>
      </group>
    </group>
  );
}

//* -- Camera: overview, then station by station --
const VIEWS = {
  overview: { focus: [-1.4, 1.2, 0], w: 25, h: 11 },
  build: { focus: [S1 - 0.3, 1.2, -0.3], w: 12.5, h: 8 },
  automate: { focus: [S2, 1.3, -0.3], w: 12.5, h: 8 },
  ship: { focus: [S3 + 1, 2, -0.4], w: 11, h: 8.5 },
};
const DIR = new THREE.Vector3(1, 0.95, 1).normalize();
const tmp = { f: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3(), d: new THREE.Vector3() };

function CameraRig({ progressRef, layoutRef, reduced }) {
  const camRef = useRef(null);
  const state = useRef({ zoom: 0, f: new THREE.Vector3(), sx: 0, sy: 0 });
  const { size } = useThree();

  useFrame(({ pointer }, delta) => {
    const cam = camRef.current;
    const p = reduced ? 0 : progressRef.current;
    const { toBuild, toAuto, toShip } = stageWeights(p);
    const mix = (key) => {
      const o = VIEWS.overview[key];
      const b = VIEWS.build[key];
      const a = VIEWS.automate[key];
      const s = VIEWS.ship[key];
      const one = (i) => lerp(lerp(lerp(o[i] ?? o, b[i] ?? b, toBuild), a[i] ?? a, toAuto), s[i] ?? s, toShip);
      return Array.isArray(o) ? [one(0), one(1), one(2)] : one();
    };
    // between two stations the camera pulls back a little, like a crane shot
    const travel = Math.sin(Math.PI * toAuto) + Math.sin(Math.PI * toShip);
    const w = mix('w') * (1 + 0.35 * travel);
    const h = mix('h') * (1 + 0.35 * travel);

    // the free area on screen, in pixels
    const wide = size.width / size.height > 1.15;
    let availW;
    let availH;
    let sx;
    let sy;
    const L = layoutRef.current;
    // the stage bars at the bottom of the hero: the scene must stay above them
    const stepsTop = L.stepsTop || size.height - 70;
    if (wide) {
      const top = (L.top || 64) + 12;
      const bottom = stepsTop - 24;
      availW = size.width * 0.52;
      availH = bottom - top;
      sx = size.width * 0.22;
      sy = size.height / 2 - (top + bottom) / 2;
    } else {
      const textTop = L.height ? lerp(L.introTop, L.captionsTop, smooth(p, 0, 0.08)) : size.height * 0.45;
      const top = (L.top || 64) + 8;
      const bottom = Math.min(textTop, stepsTop) - 10;
      availW = size.width * 0.96;
      availH = Math.max(80, bottom - top);
      sx = 0;
      sy = size.height / 2 - (top + bottom) / 2;
    }
    // portrait phones: the stations may run off the sides a little, so they can be bigger
    const crop = wide ? 1 : lerp(1, 0.66, toBuild);
    const zoom = Math.min(availW / (w * crop), availH / h);

    const st = state.current;
    const first = st.zoom === 0;
    const k = first ? 1 : 1 - Math.exp(-5 * delta);
    st.zoom = lerp(st.zoom, zoom, k);
    st.f.lerp(tmp.f.set(...mix('focus')), k);
    st.sx = lerp(st.sx, sx, k);
    st.sy = lerp(st.sy, sy, k);

    // look along the isometric direction, turned a little by the mouse
    const yaw = reduced ? 0 : pointer.x * 0.08;
    tmp.d.copy(DIR).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    cam.position.copy(st.f).addScaledVector(tmp.d, 40);
    cam.lookAt(st.f);
    cam.updateMatrixWorld();
    // shift the view so the focus lands in the free area (right of the text, or above it)
    tmp.r.setFromMatrixColumn(cam.matrixWorld, 0);
    tmp.u.setFromMatrixColumn(cam.matrixWorld, 1);
    cam.position.addScaledVector(tmp.r, -st.sx / st.zoom).addScaledVector(tmp.u, -st.sy / st.zoom);
    cam.zoom = st.zoom;
    cam.updateProjectionMatrix();
  });

  return <OrthographicCamera ref={camRef} makeDefault near={0.1} far={200} position={[40, 38, 40]} zoom={20} />;
}

//* -- The whole scene --
function Factory({ progressRef, layoutRef, reduced }) {
  return (
    <>
      <CameraRig progressRef={progressRef} layoutRef={layoutRef} reduced={reduced} />
      <Floor />
      <Belt />
      {Array.from({ length: ITEMS }, (_, i) => (
        <Item key={i} index={i} />
      ))}
      <BuildStation progressRef={progressRef} />
      <AutomateStation progressRef={progressRef} />
      <ShipStation progressRef={progressRef} />
      <Tree position={[-13.6, 0, 3]} color={C.blueSoft} size={1.1} />
      <Tree position={[-11.8, 0, -3.5]} color={C.yellow} size={0.8} />
      <Tree position={[3.4, 0, 3]} color={C.blueSoft} size={0.9} />
      <Tree position={[10.6, 0, 2.6]} color={C.yellow} size={1} />
      <Tree position={[-3.4, 0, -3.6]} color={C.blueSoft} size={0.75} />
    </>
  );
}

// phones and tablets: a little lower resolution, so the scene keeps a steady frame rate
const TOUCH = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export default function FactoryScene({ progressRef, layoutRef, reduced, active }) {
  return (
    <Canvas
      shadows
      dpr={[1, TOUCH ? 1.5 : 1.75]}
      frameloop={reduced ? 'demand' : active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[-8, 16, 10]}
        intensity={1.9}
        castShadow
        shadow-mapSize={TOUCH ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
      />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} position={[0, 5, 5]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1} position={[-6, 0, 3]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="circle" intensity={0.6} color="#ffe7a0" position={[6, -2, 3]} rotation-y={-Math.PI / 2} scale={3} />
      </Environment>
      <Factory progressRef={progressRef} layoutRef={layoutRef} reduced={reduced} />
    </Canvas>
  );
}
