import { Suspense, useEffect, useMemo, useRef, useLayoutEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, Grid, useGLTF } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import asset from '@/assets/avatar.asset.json';
import { avatarStore, useAvatar } from '@/lib/avatar-controller';

function token(name: string) {
  const css = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d'); if (!context) return css;
  context.fillStyle = css; context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}
type Palette = { violet: string; highlight: string; cyan: string; grid: string; metal: string; void: string };
function palette(): Palette { return { violet: token('--holo-violet'), highlight: token('--holo-highlight'), cyan: token('--holo-cyan'), grid: token('--scene-grid'), metal: token('--scene-metal'), void: token('--scene-void') }; }

function Humanoid({ colors }: { colors: Palette }) {
  const { scene, animations } = useGLTF(asset.url);
  const group = useRef<THREE.Group>(null);
  const data = useMemo(() => {
    const object = clone(scene);
    const mixer = new THREE.AnimationMixer(object);
    const idle = animations.find(a => a.name === 'Idle');
    if (idle) mixer.clipAction(idle).play();
    mixer.update(0);
    object.updateMatrixWorld(true);
    object.traverse(item => { if (item instanceof THREE.SkinnedMesh) item.computeBoundingBox(); });
    const box = new THREE.Box3().setFromObject(object);
    object.scale.multiplyScalar(3.25 / Math.max(box.max.y - box.min.y, .01));
    const normalized = new THREE.Box3().setFromObject(object);
    const center = normalized.getCenter(new THREE.Vector3());
    object.position.set(-center.x, -normalized.min.y + .16, -center.z);
    const uniforms = { time: { value: 0 }, glow: { value: 1 }, scan: { value: 1 }, tint: { value: new THREE.Color(colors.violet) } };
    const material = new THREE.MeshStandardMaterial({ color: colors.violet, emissive: colors.violet, emissiveIntensity: .6, metalness: .55, roughness: .28, transparent: true, opacity: .76, depthWrite: true });
    material.onBeforeCompile = shader => {
      shader.uniforms['uTime'] = uniforms.time; shader.uniforms['uGlow'] = uniforms.glow; shader.uniforms['uScan'] = uniforms.scan; shader.uniforms['uTint'] = uniforms.tint;
      shader.vertexShader = 'varying vec3 vHoloPosition;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvHoloPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = 'varying vec3 vHoloPosition; uniform float uTime; uniform float uGlow; uniform float uScan; uniform vec3 uTint;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        float fresnel = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.1);
        float scan = pow(0.5 + 0.5 * sin(vHoloPosition.y * 145.0 - uTime * 2.0), 13.0) * uScan;
        float pulse = pow(0.5 + 0.5 * sin(vHoloPosition.y * 5.0 - uTime * 1.6), 24.0);
        vec2 circuitUV = vHoloPosition.xy * vec2(22.0, 7.0);
        vec2 cell = abs(fract(circuitUV) - 0.5);
        float circuit = (1.0 - smoothstep(0.0, 0.025, min(cell.x, cell.y))) * 0.24;
        outgoingLight = outgoingLight * 0.45 + uTint * uGlow * (0.25 + fresnel * 1.8 + scan * 0.9 + pulse * 0.2 + circuit);
        diffuseColor.a = clamp(0.48 + fresnel * 0.46 + scan * 0.08, 0.0, 0.95);
        #include <opaque_fragment>
      `);
    };
    const meshes: THREE.Mesh[] = [];
    object.traverse(item => { if (item instanceof THREE.Mesh) { item.material = material; item.frustumCulled = false; meshes.push(item); } });
    return { object, material, uniforms, mixer, meshes };
  }, [scene, animations, colors]);
  const bones = useRef<Record<string, THREE.Object3D>>({});
  const eyes = useRef<THREE.Group>(null);
  const gestureTime = useRef(10);
  const seenGesture = useRef(-1);
  const seenBlink = useRef(-1);
  const blinkTime = useRef(10);
  const time = useRef(0);
  const rotation = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  useLayoutEffect(() => {
    const found: Record<string, THREE.Object3D> = {};
    data.object.traverse(item => { if (item instanceof THREE.Bone) found[item.name] = item; });
    bones.current = found;
    const eyeGroup = new THREE.Group();
    for (const x of [-.105, .105]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: colors.cyan, toneMapped: false }));
      eye.position.set(x, .23, .235); eye.scale.set(.057, .019, .021); eyeGroup.add(eye);
    }
    found['Head']?.add(eyeGroup); eyes.current = eyeGroup;
    return () => { eyeGroup.removeFromParent(); eyeGroup.children.forEach(item => { if (item instanceof THREE.Mesh) { item.geometry.dispose(); if (item.material instanceof THREE.Material) item.material.dispose(); } }); };
  }, [data, colors]);
  useEffect(() => () => { data.mixer.stopAllAction(); data.mixer.uncacheRoot(data.object); data.material.dispose(); }, [data]);
  useFrame((_, rawDelta) => {
    const s = avatarStore.getSnapshot();
    if (s.paused) return;
    const dt = Math.min(rawDelta, .05) * s.speed;
    time.current += dt;
    const t = time.current;
    data.mixer.update(dt * .65);
    data.uniforms.time.value = t;
    data.uniforms.scan.value = s.scanlines ? 1 : 0;
    data.uniforms.glow.value = .3 + s.glow / 65 + (s.state === 'thinking' ? Math.sin(t * 5) * .2 : 0);
    data.uniforms.tint.value.lerp(new THREE.Color(s.state === 'listening' ? colors.cyan : s.state === 'speaking' ? colors.highlight : colors.violet), 1 - Math.exp(-3 * dt));
    const b = bones.current;
    const amp = s.amplitude / 50;
    if (b['Torso']) { const breath = s.breathing ? Math.sin(t * 1.8) * .013 * amp : 0; b['Torso'].scale.set(1 + breath, 1 + breath * .3, 1 + breath * 1.4); }
    if (b['Head']) {
      euler.set(s.headMovement ? Math.sin(t * .6) * .045 * amp : 0, s.headMovement ? Math.sin(t * .36) * .13 * amp : 0, s.emotion === 'curious' ? .18 : s.headMovement ? Math.sin(t * .45) * .035 * amp : 0);
      b['Head'].quaternion.multiply(rotation.setFromEuler(euler));
    }
    if (seenGesture.current !== s.gestureId) { seenGesture.current = s.gestureId; gestureTime.current = 0; }
    gestureTime.current += dt;
    const g = gestureTime.current;
    const envelope = Math.min(g * 3, 1) * Math.min(Math.max(4.2 - g, 0) * 2, 1);
    if (s.gesture === 'wave' && b['UpperArmR'] && b['LowerArmR']) {
      euler.set(0, 0, -1.85 * envelope); b['UpperArmR'].quaternion.multiply(rotation.setFromEuler(euler));
      euler.set(-.2 * envelope, 0, -(.75 + Math.sin(g * 10) * .3) * envelope); b['LowerArmR'].quaternion.multiply(rotation.setFromEuler(euler));
    }
    if (s.gesture === 'nod' && b['Head']) { euler.set(Math.sin(g * 6) * .25 * envelope, 0, 0); b['Head'].quaternion.multiply(rotation.setFromEuler(euler)); }
    if (s.state === 'speaking' || (s.gesture === 'talk' && g < 4.2)) {
      for (const side of ['L', 'R']) {
        const arm = b[`UpperArm${side}`]; const forearm = b[`LowerArm${side}`];
        if (arm) { euler.set(-.18 + Math.sin(t * 2 + (side === 'L' ? 1 : 0)) * .15 * amp, 0, side === 'L' ? -.18 : .18); arm.quaternion.multiply(rotation.setFromEuler(euler)); }
        if (forearm) { euler.set(-.35 + Math.sin(t * 2.8) * .13 * amp, 0, 0); forearm.quaternion.multiply(rotation.setFromEuler(euler)); }
      }
    }
    if (seenBlink.current !== s.blinkId) { seenBlink.current = s.blinkId; blinkTime.current = 0; }
    blinkTime.current += dt;
    if (s.blinking && blinkTime.current > 3.6 + Math.sin(t) * .7) blinkTime.current = 0;
    if (eyes.current) eyes.current.scale.y = blinkTime.current < .2 ? Math.max(.06, Math.abs(Math.cos(blinkTime.current / .2 * Math.PI))) : 1;
    if (group.current) { group.current.position.y = Math.sin(t * 1.2) * .014; if (s.rotation) group.current.rotation.y += dt * .24; }
  });
  return <group ref={group}><primitive object={data.object} /></group>;
}

function Energy({ colors }: { colors: Palette }) {
  const points = useRef<THREE.Points>(null);
  const rings = useRef<THREE.Group>(null);
  const time = useRef(0);
  const coords = useMemo(() => {
    const p = new Float32Array(220 * 3);
    for (let i = 0; i < 220; i++) { const a = i * 2.39996; const r = .65 + ((i * 37) % 100) / 100 * 1.3; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = ((i * 19) % 100) / 100 * 4; p[i * 3 + 2] = Math.sin(a) * r; }
    return p;
  }, []);
  useFrame((_, rawDelta) => {
    const s = avatarStore.getSnapshot(); if (s.paused) return;
    const dt = Math.min(rawDelta, .05); time.current += dt;
    if (points.current) { points.current.visible = s.particles; points.current.rotation.y += dt * (s.state === 'thinking' ? .4 : .07); const attr = points.current.geometry.getAttribute('position'); for (let i = 0; i < 220; i++) attr.setY(i, ((coords[i * 3 + 1] ?? 0) + time.current * .08) % 4); attr.needsUpdate = true; }
    if (rings.current) { rings.current.rotation.y += dt * .08; rings.current.children.forEach((ring, i) => { const scale = 1 + Math.sin(time.current * (s.state === 'idle' ? 1 : 3) + i) * (s.state === 'idle' ? .015 : .09); ring.scale.setScalar(scale); }); }
  });
  return <>
    <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[coords.slice(), 3]} /></bufferGeometry><pointsMaterial color={colors.highlight} size={.018} transparent opacity={.75} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>
    <group ref={rings}>{[1.12, 1.4, 1.72].map((r, i) => <mesh key={r} position-y={.09 - i * .013} rotation-x={-Math.PI / 2}><torusGeometry args={[r, i === 0 ? .013 : .005, 8, 120]} /><meshBasicMaterial color={i === 1 ? colors.cyan : colors.violet} transparent opacity={i === 0 ? .85 : .3} toneMapped={false} /></mesh>)}</group>
    <mesh position-y={-.04}><cylinderGeometry args={[1.15, 1.22, .13, 80]} /><meshStandardMaterial color={colors.metal} roughness={.3} metalness={.8} /></mesh>
    <Grid position={[0, -.12, 0]} args={[30, 30]} cellSize={.55} sectionSize={2.75} cellColor={colors.grid} sectionColor={colors.grid} cellThickness={.45} sectionThickness={.8} fadeDistance={13} fadeStrength={2.5} infiniteGrid />
  </>;
}

function CameraControls() {
  const controls = useRef<OrbitControlsType>(null);
  const s = useAvatar();
  useEffect(() => { if (controls.current) controls.current.reset(); }, [s.cameraReset]);
  return <OrbitControls ref={controls} makeDefault target={[0, 1.65, 0]} enablePan={false} minDistance={4.5} maxDistance={12} minPolarAngle={.45} maxPolarAngle={1.72} enableDamping dampingFactor={.08} />;
}

export function AvatarScene() {
  const [colors, setColors] = useState<Palette | null>(null);
  useEffect(() => { setColors(palette()); }, []);
  const s = useAvatar();
  if (!colors) return null;
  return <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2.1, 7.7], fov: 37 }} gl={{ antialias: true, alpha: false }}>
    <color attach="background" args={[colors.void]} />
    <ambientLight intensity={.65} />
    <directionalLight position={[3, 4, 5]} intensity={2.3} color={colors.highlight} />
    <pointLight position={[-3, 2, 2]} intensity={6} color={colors.cyan} />
    <Environment resolution={128}><Lightformer intensity={2} position={[0, 4, 3]} scale={[8, 8, 1]} /><Lightformer intensity={1.5} color={colors.violet} position={[-4, 1, -1]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} /></Environment>
    <Energy colors={colors} />
    <Suspense fallback={null}><Humanoid colors={colors} /></Suspense>
    <CameraControls />
    <EffectComposer multisampling={0}><Bloom mipmapBlur luminanceThreshold={.55} intensity={s.glow / 90} radius={.6} /></EffectComposer>
  </Canvas>;
}