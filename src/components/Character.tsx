import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CharacterStyle } from '../store/useGameStore';

interface Props {
  style: CharacterStyle;
  walkPhase?: number; // 0..1 for limb swing
  isJumping?: boolean;
  isIdle?: boolean;
}

// Lego-style proportions (in meters-ish units, scaled up)
const HEAD = 0.9;
const TORSO_W = 1.1;
const TORSO_H = 1.2;
const TORSO_D = 0.7;
const ARM_W = 0.32;
const ARM_H = 1.1;
const ARM_D = 0.32;
const LEG_W = 0.45;
const LEG_H = 1.1;
const LEG_D = 0.55;
const SHOE_H = 0.25;

export default function Character({ style, walkPhase = 0, isJumping = false, isIdle = false }: Props) {
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const swing = isJumping ? 0 : Math.sin(walkPhase * Math.PI * 2) * 0.7;
    const bob = isIdle ? 0 : Math.abs(Math.sin(walkPhase * Math.PI * 2)) * 0.08;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * 0.9;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.9;
    if (bodyRef.current) bodyRef.current.position.y = bob;
  });

  const eyeGeo = useMemo(() => new THREE.SphereGeometry(0.09, 16, 16), []);
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0b1220' }), []);
  const whiteGeo = useMemo(() => new THREE.SphereGeometry(0.14, 16, 16), []);
  const whiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff' }), []);
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b1e1e' }), []);

  const hatY = HEAD / 2; // top of head
  const hatColor = style.hatColor;

  return (
    <group>
      <group ref={bodyRef}>
        {/* Torso */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[TORSO_W, TORSO_H, TORSO_D]} />
          <meshStandardMaterial color={style.shirt} />
        </mesh>
        {/* Shirt detail - little collar */}
        <mesh position={[0, TORSO_H / 2 - 0.08, TORSO_D / 2 + 0.01]}>
          <boxGeometry args={[0.35, 0.12, 0.02]} />
          <meshStandardMaterial color={style.skin} />
        </mesh>

        {/* Head group (pivot at neck) */}
        <group position={[0, TORSO_H / 2, 0]}>
          {/* Head */}
          <mesh position={[0, HEAD / 2, 0]} castShadow>
            <boxGeometry args={[HEAD, HEAD, HEAD]} />
            <meshStandardMaterial color={style.skin} />
          </mesh>

          {/* Eyes (face points to +Z) */}
          <mesh position={[-0.18, HEAD / 2 + 0.05, HEAD / 2 + 0.02]} geometry={whiteGeo} material={whiteMat} />
          <mesh position={[0.18, HEAD / 2 + 0.05, HEAD / 2 + 0.02]} geometry={whiteGeo} material={whiteMat} />
          <mesh position={[-0.18, HEAD / 2 + 0.05, HEAD / 2 + 0.1]} geometry={eyeGeo} material={eyeMat} />
          <mesh position={[0.18, HEAD / 2 + 0.05, HEAD / 2 + 0.1]} geometry={eyeGeo} material={eyeMat} />

          {/* Mouth */}
          <mesh position={[0, HEAD / 2 - 0.22, HEAD / 2 + 0.02]}>
            <boxGeometry args={[0.32, 0.06, 0.02]} />
            <meshStandardMaterial color={mouthMat.color} />
          </mesh>

          {/* Mustache */}
          {style.mustache === 'goatee' && (
            <mesh position={[0, HEAD / 2 - 0.3, HEAD / 2 + 0.02]}>
              <boxGeometry args={[0.22, 0.08, 0.02]} />
              <meshStandardMaterial color={style.mustacheColor} />
            </mesh>
          )}
          {style.mustache === 'full' && (
            <group>
              <mesh position={[0, HEAD / 2 - 0.12, HEAD / 2 + 0.02]}>
                <boxGeometry args={[0.4, 0.07, 0.02]} />
                <meshStandardMaterial color={style.mustacheColor} />
              </mesh>
              <mesh position={[0, HEAD / 2 - 0.3, HEAD / 2 + 0.02]}>
                <boxGeometry args={[0.28, 0.08, 0.02]} />
                <meshStandardMaterial color={style.mustacheColor} />
              </mesh>
            </group>
          )}
          {style.mustache === 'stubble' && (
            <mesh position={[0, HEAD / 2 - 0.15, HEAD / 2 + 0.02]}>
              <boxGeometry args={[0.35, 0.1, 0.02]} />
              <meshStandardMaterial color={style.mustacheColor} />
            </mesh>
          )}

          {/* Glasses */}
          {style.glasses === 'round' && (
            <group position={[0, HEAD / 2 + 0.05, HEAD / 2 + 0.02]}>
              <mesh position={[-0.18, 0, 0.05]}>
                <torusGeometry args={[0.16, 0.03, 12, 24]} />
                <meshStandardMaterial color={style.glassesColor} />
              </mesh>
              <mesh position={[0.18, 0, 0.05]}>
                <torusGeometry args={[0.16, 0.03, 12, 24]} />
                <meshStandardMaterial color={style.glassesColor} />
              </mesh>
              <mesh position={[0, 0, 0.05]}>
                <boxGeometry args={[0.06, 0.03, 0.02]} />
                <meshStandardMaterial color={style.glassesColor} />
              </mesh>
            </group>
          )}
          {style.glasses === 'square' && (
            <group position={[0, HEAD / 2 + 0.05, HEAD / 2 + 0.02]}>
              <mesh position={[-0.18, 0, 0.05]}>
                <boxGeometry args={[0.28, 0.2, 0.03]} />
                <meshStandardMaterial color={style.glassesColor} transparent opacity={0.85} />
              </mesh>
              <mesh position={[0.18, 0, 0.05]}>
                <boxGeometry args={[0.28, 0.2, 0.03]} />
                <meshStandardMaterial color={style.glassesColor} transparent opacity={0.85} />
              </mesh>
              <mesh position={[0, 0, 0.05]}>
                <boxGeometry args={[0.08, 0.03, 0.02]} />
                <meshStandardMaterial color={style.glassesColor} />
              </mesh>
            </group>
          )}
          {style.glasses === 'sun' && (
            <group position={[0, HEAD / 2 + 0.05, HEAD / 2 + 0.02]}>
              <mesh position={[-0.18, 0, 0.05]}>
                <boxGeometry args={[0.3, 0.18, 0.02]} />
                <meshStandardMaterial color="#0a0a0a" />
              </mesh>
              <mesh position={[0.18, 0, 0.05]}>
                <boxGeometry args={[0.3, 0.18, 0.02]} />
                <meshStandardMaterial color="#0a0a0a" />
              </mesh>
              <mesh position={[0, 0, 0.05]}>
                <boxGeometry args={[0.08, 0.03, 0.02]} />
                <meshStandardMaterial color={style.glassesColor} />
              </mesh>
            </group>
          )}

          {/* Hat */}
          {style.hat === 'cap' && (
            <group position={[0, hatY + 0.1, 0]}>
              <mesh position={[0, 0.15, 0]}>
                <sphereGeometry args={[HEAD / 2 + 0.02, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={hatColor} />
              </mesh>
              <mesh position={[0, 0.1, HEAD / 2 + 0.05]} rotation={[-0.15, 0, 0]}>
                <boxGeometry args={[HEAD + 0.1, 0.05, 0.4]} />
                <meshStandardMaterial color={hatColor} />
              </mesh>
            </group>
          )}
          {style.hat === 'beanie' && (
            <group position={[0, hatY + 0.05, 0]}>
              <mesh position={[0, 0.15, 0]}>
                <sphereGeometry args={[HEAD / 2 + 0.05, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
                <meshStandardMaterial color={hatColor} />
              </mesh>
              <mesh position={[0, 0.4, 0]}>
                <sphereGeometry args={[0.12, 12, 12]} />
                <meshStandardMaterial color={hatColor} />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[HEAD / 2 + 0.06, HEAD / 2 + 0.06, 0.12, 24]} />
                <meshStandardMaterial color={hatColor} />
              </mesh>
            </group>
          )}
          {style.hat === 'top' && (
            <group position={[0, hatY, 0]}>
              <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[HEAD / 2 - 0.02, HEAD / 2 - 0.02, 0.7, 24]} />
                <meshStandardMaterial color={hatColor} />
              </mesh>
              <mesh position={[0, 0.18, 0]}>
                <cylinderGeometry args={[HEAD / 2 + 0.1, HEAD / 2 + 0.1, 0.08, 24]} />
                <meshStandardMaterial color={hatColor} />
              </mesh>
            </group>
          )}
          {style.hat === 'helmet' && (
            <group position={[0, hatY, 0]}>
              <mesh position={[0, 0.2, 0]}>
                <sphereGeometry args={[HEAD / 2 + 0.1, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
                <meshStandardMaterial color={hatColor} metalness={0.4} roughness={0.3} />
              </mesh>
            </group>
          )}
        </group>

        {/* Left Arm */}
        <group position={[-(TORSO_W / 2 + ARM_W / 2 + 0.02), TORSO_H / 2 - 0.05, 0]}>
          <group ref={leftArmRef}>
            <mesh position={[0, -ARM_H / 2, 0]} castShadow>
              <boxGeometry args={[ARM_W, ARM_H, ARM_D]} />
              <meshStandardMaterial color={style.shirt} />
            </mesh>
            {/* hand */}
            <mesh position={[0, -ARM_H - 0.12, 0]} castShadow>
              <boxGeometry args={[ARM_W + 0.05, 0.25, ARM_D + 0.05]} />
              <meshStandardMaterial color={style.skin} />
            </mesh>
          </group>
        </group>

        {/* Right Arm */}
        <group position={[(TORSO_W / 2 + ARM_W / 2 + 0.02), TORSO_H / 2 - 0.05, 0]}>
          <group ref={rightArmRef}>
            <mesh position={[0, -ARM_H / 2, 0]} castShadow>
              <boxGeometry args={[ARM_W, ARM_H, ARM_D]} />
              <meshStandardMaterial color={style.shirt} />
            </mesh>
            <mesh position={[0, -ARM_H - 0.12, 0]} castShadow>
              <boxGeometry args={[ARM_W + 0.05, 0.25, ARM_D + 0.05]} />
              <meshStandardMaterial color={style.skin} />
            </mesh>
          </group>
        </group>

        {/* Legs */}
        <group position={[-0.28, -TORSO_H / 2, 0]}>
          <group ref={leftLegRef}>
            <mesh position={[0, -LEG_H / 2, 0]} castShadow>
              <boxGeometry args={[LEG_W, LEG_H, LEG_D]} />
              <meshStandardMaterial color={style.pants} />
            </mesh>
            {/* Shoe */}
            <mesh position={[0, -LEG_H - SHOE_H / 2 + 0.02, 0.08]} castShadow>
              <boxGeometry args={[LEG_W + 0.05, SHOE_H, LEG_D + 0.2]} />
              <meshStandardMaterial color={style.shoes} />
            </mesh>
          </group>
        </group>
        <group position={[0.28, -TORSO_H / 2, 0]}>
          <group ref={rightLegRef}>
            <mesh position={[0, -LEG_H / 2, 0]} castShadow>
              <boxGeometry args={[LEG_W, LEG_H, LEG_D]} />
              <meshStandardMaterial color={style.pants} />
            </mesh>
            <mesh position={[0, -LEG_H - SHOE_H / 2 + 0.02, 0.08]} castShadow>
              <boxGeometry args={[LEG_W + 0.05, SHOE_H, LEG_D + 0.2]} />
              <meshStandardMaterial color={style.shoes} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
