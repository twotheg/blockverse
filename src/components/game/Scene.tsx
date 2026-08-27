import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useEffect, useRef, useMemo, useCallback, memo } from 'react';
import * as THREE from 'three';
import Character from '../Character';
import {
  buildTower,
  StaticBlockMesh,
  SpinnerMesh,
  MovingBlockMesh,
  JumpPadMesh,
} from '../Tower';
import { useGameStore } from '../../store/useGameStore';
import { input, gameState, gameEvents, useKeyboard } from './input';

const WALK_SPEED = 9;
const RUN_SPEED = 14;
const JUMP_V = 15;
const GRAVITY = 32;
const CHAR_R = 0.6;
const CHAR_H = 1;
const KILL_Y = -20;
const AIR_JUMPS = 1;

function aabb(
  px: number, py: number, pz: number,
  bx: number, by: number, bz: number,
  bw: number, bh: number, bd: number,
) {
  const ox = (CHAR_R + bw / 2) - Math.abs(px - bx);
  const oy = (CHAR_H + bh / 2) - Math.abs(py - by);
  const oz = (CHAR_R + bd / 2) - Math.abs(pz - bz);
  return { hit: ox > 0 && oy > 0 && oz > 0, ox, oy, oz };
}

const UP = new THREE.Vector3(0, 1, 0);

function Player() {
  const { camera } = useThree();
  const ref = useRef<THREE.Group>(null);
  const vel = useRef({ x: 0, y: 0, z: 0 });
  const grounded = useRef(true);
  const phase = useRef(0);
  const cam = useRef({ yaw: 0, pitch: 0.35 });
  const cp = useRef(0);
  const coyote = useRef(0);
  const cooldown = useRef(0);
  const airJumps = useRef(AIR_JUMPS);
  const errored = useRef(false);

  // 재사용 벡터 (매 프레임 new 방지 → GC 부담 감소)
  const vFwd = useRef(new THREE.Vector3());
  const vRight = useRef(new THREE.Vector3());
  const vCam = useRef(new THREE.Vector3());

  const character = useGameStore((s) => s.character);
  useKeyboard();

  const tower = useMemo(() => buildTower(), []);
  const movRefs = useMemo(
    () => tower.movingBlocks.map(() => ({ current: null as THREE.Mesh | null })),
    [tower.movingBlocks]
  );

  const placeAt = useCallback((x: number, y: number, z: number) => {
    const g = ref.current;
    if (!g) return;
    g.position.set(x, y, z);
    vel.current.x = 0; vel.current.y = 0; vel.current.z = 0;
        grounded.current = true;
    cooldown.current = 1.5;
    airJumps.current = AIR_JUMPS;
  }, []);

  const respawn = useCallback(() => {
    const p = tower.checkpoints[cp.current] || tower.spawnPoint;
    placeAt(p.x, p.y + 1.5, p.z);
  }, [tower, placeAt]);

  const restart = useCallback(() => {
    cp.current = 0;
    gameState.stage = 0;
    placeAt(tower.spawnPoint.x, tower.spawnPoint.y + 1.5, tower.spawnPoint.z);
  }, [tower, placeAt]);

  useEffect(() => {
    placeAt(tower.spawnPoint.x, tower.spawnPoint.y + 1.5, tower.spawnPoint.z);
    gameState.stage = 0;
    gameState.height = 0;
  }, [tower, placeAt]);

  useEffect(() => {
    (window as any).__respawnCheckpoint = respawn;
    (window as any).__resetToBeginning = restart;
    return () => {
      delete (window as any).__respawnCheckpoint;
      delete (window as any).__resetToBeginning;
    };
  }, [respawn, restart]);

    const die = () => {
    if (cooldown.current > 0) return;
    cooldown.current = 1.5;
    respawn();
    gameEvents.onDeath?.();
  };

  useFrame((state, delta) => {
    if (errored.current) return;
    const g = ref.current;
    if (!g) return;

    try {
      const dt = Math.min(Math.max(delta, 0.0001), 1 / 30);
      const pos = g.position;

      // ── NaN 안전장치 ──
      if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) {
        const p = tower.checkpoints[cp.current] || tower.spawnPoint;
        pos.set(p.x, p.y + 1.5, p.z);
        vel.current.x = 0; vel.current.y = 0; vel.current.z = 0;
        return;
      }

      if (cooldown.current > 0) cooldown.current -= dt;

      // ── 카메라 회전 ──
      cam.current.yaw -= input.lookDX * 0.004;
      cam.current.pitch = Math.max(-0.35, Math.min(1.2, cam.current.pitch + input.lookDY * 0.004));
      input.lookDX = 0;
      input.lookDY = 0;

      // ── 이동 ──
      const len = Math.hypot(input.moveX, input.moveY);
      if (len > 0.05) {
        camera.getWorldDirection(vFwd.current);
        vFwd.current.y = 0;
        if (vFwd.current.lengthSq() < 1e-6) vFwd.current.set(0, 0, -1);
        vFwd.current.normalize();
        vRight.current.crossVectors(vFwd.current, UP).normalize();

        const ix = input.moveX / len;
        const iy = input.moveY / len;
        const wx = vRight.current.x * ix + vFwd.current.x * iy;
        const wz = vRight.current.z * ix + vFwd.current.z * iy;

        let d = Math.atan2(wx, wz) - g.rotation.y;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        g.rotation.y += d * 0.25;

        const sp = input.run ? RUN_SPEED : WALK_SPEED;
        const mag = Math.min(len, 1);
        const acc = grounded.current ? 20 : 8;
        vel.current.x += (wx * sp * mag - vel.current.x) * Math.min(1, acc * dt);
        vel.current.z += (wz * sp * mag - vel.current.z) * Math.min(1, acc * dt);
        phase.current = (phase.current + dt * (input.run ? 3 : 2)) % 1;
      } else if (grounded.current) {
        vel.current.x *= Math.pow(0.001, dt);
        vel.current.z *= Math.pow(0.001, dt);
      }

      // ── 점프 (더블 점프 지원) ──
      coyote.current -= dt;
      if (input.jump) {
        if (grounded.current || coyote.current > 0) {
          vel.current.y = JUMP_V;
          grounded.current = false;
          coyote.current = 0;
          airJumps.current = AIR_JUMPS;
        } else if (airJumps.current > 0) {
          vel.current.y = JUMP_V * 0.9;
          airJumps.current -= 1;
        }
      }
      input.jump = false;

      vel.current.y = Math.max(-40, vel.current.y - GRAVITY * dt);

      let nx = pos.x + vel.current.x * dt;
      let ny = pos.y + vel.current.y * dt;
      let nz = pos.z + vel.current.z * dt;

      const was = grounded.current;
      grounded.current = false;

      // ── 정적 블록 충돌 ──
      for (let i = 0; i < tower.staticBlocks.length; i++) {
        const b = tower.staticBlocks[i];
        // 광역 컬링 (성능)
        if (Math.abs(ny - b.y) > b.h / 2 + 4) continue;
        const c = aabb(nx, ny, nz, b.x, b.y, b.z, b.w, b.h, b.d);
        if (!c.hit) continue;
        const m = Math.min(c.ox, c.oy, c.oz);
        if (m === c.oy) {
          if (ny > b.y) {
            ny = b.y + b.h / 2 + CHAR_H;
            if (vel.current.y < 0) vel.current.y = 0;
            grounded.current = true;
            if (b.type === 'checkpoint') {
              let best = cp.current, bd = Infinity;
              for (let k = 0; k < tower.checkpoints.length; k++) {
                const q = tower.checkpoints[k];
                const dd = Math.hypot(nx - q.x, nz - q.z) + Math.abs(ny - q.y);
                if (dd < bd) { bd = dd; best = k; }
              }
              if (best > cp.current) {
                cp.current = best;
                gameState.stage = best;
                gameEvents.onStage?.(best);
              }
            } else if (b.type === 'goal') {
              gameEvents.onGoal?.();
            }
          } else {
            ny = b.y - b.h / 2 - 0.1;
            if (vel.current.y > 0) vel.current.y = 0;
          }
        } else if (m === c.ox) {
          nx = nx > b.x ? b.x + b.w / 2 + CHAR_R : b.x - b.w / 2 - CHAR_R;
          vel.current.x = 0;
        } else {
          nz = nz > b.z ? b.z + b.d / 2 + CHAR_R : b.z - b.d / 2 - CHAR_R;
          vel.current.z = 0;
        }
      }

      // ── 이동 블록 충돌 ──
      for (let i = 0; i < tower.movingBlocks.length; i++) {
        const mb = tower.movingBlocks[i];
        const me = movRefs[i].current;
        if (!me) continue;
        const bx = me.position.x, by = me.position.y, bz = me.position.z;
        if (Math.abs(ny - by) > mb.h / 2 + 4) continue;
        const c = aabb(nx, ny, nz, bx, by, bz, mb.w, mb.h, mb.d);
        if (!c.hit) continue;
        const m = Math.min(c.ox, c.oy, c.oz);
        if (m === c.oy) {
          if (ny > by) {
            ny = by + mb.h / 2 + CHAR_H;
            if (vel.current.y < 0) vel.current.y = 0;
            grounded.current = true;
            if (mb.axis === 'y') {
              const t = state.clock.elapsedTime;
              ny += Math.sin((t + dt) * mb.speed + mb.phase) * mb.amp
                  - Math.sin(t * mb.speed + mb.phase) * mb.amp;
            }
          } else {
            ny = by - mb.h / 2 - 0.1;
            if (vel.current.y > 0) vel.current.y = 0;
          }
        } else if (m === c.ox) {
          nx = nx > bx ? bx + mb.w / 2 + CHAR_R : bx - mb.w / 2 - CHAR_R;
        } else {
          nz = nz > bz ? bz + mb.d / 2 + CHAR_R : bz - mb.d / 2 - CHAR_R;
        }
      }

      // ── 톱날 충돌 ──
      for (let i = 0; i < tower.spinners.length; i++) {
        const s = tower.spinners[i];
        const dy = ny - s.y;
        if (Math.abs(dy) > 5) continue;
        const dx = nx - s.x, dz = nz - s.z;
        if (Math.abs(dx) > 8 || Math.abs(dz) > 8) continue;
        const a = state.clock.elapsedTime * s.speed;
        if (s.axis === 'y') {
          const ax = Math.sin(a), az = Math.cos(a);
          const t = Math.max(-s.length / 2, Math.min(s.length / 2, dx * ax + dz * az));
          if (Math.abs(dy) < s.height + CHAR_H && Math.hypot(dx - t * ax, dz - t * az) < CHAR_R + 0.4) {
            die();
            break;
          }
        } else {
          const ay = Math.sin(a), az = Math.cos(a);
          const t = Math.max(-s.length / 2, Math.min(s.length / 2, dy * ay + dz * az));
          if (Math.abs(dx) < s.height + CHAR_R && Math.hypot(dy - t * ay, dz - t * az) < CHAR_R + 0.4) {
            die();
            break;
          }
        }
      }

      // ── 점프 패드 ──
      for (let i = 0; i < tower.jumpPads.length; i++) {
        const j = tower.jumpPads[i];
        const dx = nx - j.x, dz = nz - j.z, dy = ny - j.y;
        if (dx * dx + dz * dz < 4 && dy < 1.8 && dy > -0.5) {
          vel.current.y = j.power;
          grounded.current = false;
        }
      }

      if (was && !grounded.current) coyote.current = 0.15;
      if (grounded.current) {
        coyote.current = 0.15;
        airJumps.current = AIR_JUMPS;
      }

            if (ny < KILL_Y) {
        die();
        return;
      }

      // 최종 NaN 체크
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) {
        const p = tower.checkpoints[cp.current] || tower.spawnPoint;
        nx = p.x; ny = p.y + 1.5; nz = p.z;
        vel.current.x = 0; vel.current.y = 0; vel.current.z = 0;
      }

      pos.set(nx, ny, nz);
      gameState.height = ny;

      // ── 카메라 팔로우 ──
      const { yaw, pitch } = cam.current;
      const D = 8;
      const tx = nx, ty = ny + 1.2, tz = nz;
      vCam.current.set(
        tx - Math.sin(yaw) * Math.cos(pitch) * D,
        ty + Math.sin(pitch) * D,
        tz - Math.cos(yaw) * Math.cos(pitch) * D,
      );
      camera.position.lerp(vCam.current, 1 - Math.pow(0.001, dt));
      camera.lookAt(tx, ty, tz);
    } catch (err) {
      errored.current = true;
      console.error('[Scene] 물리 연산 오류:', err);
    }
  });

  return (
    <>
      <group ref={ref}>
        <Character style={character} walkPhase={phase.current} isJumping={!grounded.current} />
      </group>
      {tower.staticBlocks.map((b, i) => <StaticBlockMesh key={`s${i}`} block={b} />)}
      {tower.spinners.map((s, i) => <SpinnerMesh key={`p${i}`} spinner={s} />)}
      {tower.movingBlocks.map((b, i) => <MovingBlockMesh key={`m${i}`} block={b} meshRef={movRefs[i]} />)}
      {tower.jumpPads.map((j, i) => <JumpPadMesh key={`j${i}`} pad={j} />)}
    </>
  );
}

function MouseLook() {
  const { gl } = useThree();
  useEffect(() => {
    const dom = gl.domElement;
    let locked = false;
    const click = () => {
      if (!locked && dom.requestPointerLock) {
        try { dom.requestPointerLock(); } catch { /* noop */ }
      }
    };
    const change = () => { locked = document.pointerLockElement === dom; };
    const move = (e: MouseEvent) => {
      if (!locked) return;
      input.lookDX += e.movementX;
      input.lookDY += e.movementY;
    };
    dom.addEventListener('click', click);
    document.addEventListener('pointerlockchange', change);
    document.addEventListener('mousemove', move);
    return () => {
      dom.removeEventListener('click', click);
      document.removeEventListener('pointerlockchange', change);
      document.removeEventListener('mousemove', move);
    };
  }, [gl]);
  return null;
}

/** WebGL 컨텍스트 손실 감지 및 복구 */
function ContextGuard() {
  const { gl } = useThree();
  useEffect(() => {
    const dom = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      console.error('[Scene] WebGL 컨텍스트 손실 — 복구 시도 중');
    };
    const onRestored = () => {
      console.warn('[Scene] WebGL 컨텍스트 복구됨');
    };
    dom.addEventListener('webglcontextlost', onLost as EventListener);
    dom.addEventListener('webglcontextrestored', onRestored);
    return () => {
      dom.removeEventListener('webglcontextlost', onLost as EventListener);
      dom.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl]);
  return null;
}

/** props 없음 → memo로 완전히 리렌더 차단 */
function SceneInner() {
  return (
    <>
      <Sky sunPosition={[100, 60, 100]} turbidity={4} rayleigh={0.4} />
      <fog attach="fog" args={['#c5dcf0', 90, 320]} />
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[40, 80, 30]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={70}
        shadow-camera-bottom={-15}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />
      <directionalLight position={[-30, 20, -30]} intensity={0.3} color="#a8c8ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#5a8b3f" />
      </mesh>
      <Player />
      <MouseLook />
      <ContextGuard />
    </>
  );
}

export default memo(SceneInner);
