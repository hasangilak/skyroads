import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

import { COLORS } from './constants';

// A low-poly hover-racer built from primitives:
//   - tapered octagonal fuselage with a pointed nose
//   - tinted cockpit canopy + dorsal accent stripe
//   - swept wings with glowing nav-light tips
//   - twin thrusters with an animated flame and a warm light that spills
//     onto the road behind the craft
//
// Forward is +z (the direction of travel). The parent group (in Scene) handles
// world position and strafe-banking; here we add a gentle idle hover/roll and
// pulse the engines so the craft always feels alive.
export default function Ship() {
  const bob = useRef<THREE.Group>(null);
  const flameL = useRef<THREE.Mesh>(null);
  const flameR = useRef<THREE.Mesh>(null);
  const engineLight = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (bob.current) {
      bob.current.position.y = Math.sin(t * 2.4) * 0.025; // hover
      bob.current.rotation.z = Math.sin(t * 1.3) * 0.04; // lazy roll
    }

    // Fast flicker for the thrusters, slower swell for the cast light.
    const flicker = 1 + Math.sin(t * 22) * 0.3 + Math.sin(t * 13.7) * 0.12;
    if (flameL.current) flameL.current.scale.set(0.85, flicker, 0.85);
    if (flameR.current) flameR.current.scale.set(0.85, flicker, 0.85);
    if (engineLight.current) {
      engineLight.current.intensity = 1.6 + Math.sin(t * 9) * 0.5;
    }
  });

  return (
    <group ref={bob}>
      {/* Fuselage: tapered octagon, wide at the tail, narrow at the nose. */}
      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.3, 1.2, 8]} />
        <meshStandardMaterial
          color={COLORS.hull}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>

      {/* Pointed nose, matched to the fuselage's front radius. */}
      <mesh position={[0, 0, 0.825]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, 0.55, 8]} />
        <meshStandardMaterial
          color={COLORS.hull}
          metalness={0.55}
          roughness={0.3}
        />
      </mesh>

      {/* Dorsal accent stripe running along the spine. */}
      <mesh position={[0, 0.16, 0.05]}>
        <boxGeometry args={[0.08, 0.05, 1.0]} />
        <meshStandardMaterial
          color={COLORS.accent}
          emissive={COLORS.accent}
          emissiveIntensity={0.35}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>

      {/* Cockpit canopy: a tinted glass dome. */}
      <mesh position={[0, 0.17, 0.14]} scale={[1.1, 1, 1.5]}>
        <sphereGeometry args={[0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={COLORS.canopy}
          emissive={COLORS.canopy}
          emissiveIntensity={0.25}
          metalness={0.2}
          roughness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Wings, engines and lights, mirrored on both sides. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Swept wing. */}
          <mesh
            position={[side * 0.34, -0.02, -0.18]}
            rotation={[0, side * 0.5, side * 0.12]}
          >
            <boxGeometry args={[0.5, 0.05, 0.5]} />
            <meshStandardMaterial
              color={COLORS.hullDark}
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>

          {/* Wingtip nav light. */}
          <mesh position={[side * 0.6, 0, -0.32]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial
              color={COLORS.light}
              emissive={COLORS.light}
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>

          {/* Engine housing. */}
          <mesh
            position={[side * 0.16, 0, -0.72]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.1, 0.12, 0.28, 8]} />
            <meshStandardMaterial
              color={COLORS.hullDark}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>

          {/* Glowing engine ring. */}
          <mesh
            position={[side * 0.16, 0, -0.86]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.075, 0.075, 0.04, 8]} />
            <meshStandardMaterial
              color={COLORS.engineGlow}
              emissive={COLORS.engineGlow}
              emissiveIntensity={1.8}
              toneMapped={false}
            />
          </mesh>

          {/* Animated thruster flame (points backward). */}
          <mesh
            ref={side === -1 ? flameL : flameR}
            position={[side * 0.16, 0, -1.0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <coneGeometry args={[0.09, 0.4, 8]} />
            <meshStandardMaterial
              color={COLORS.engine}
              emissive={COLORS.engine}
              emissiveIntensity={1.8}
              transparent
              opacity={0.85}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Warm engine glow cast onto the road behind the craft. */}
      <pointLight
        ref={engineLight}
        position={[0, 0.06, -1.0]}
        color={COLORS.engine}
        intensity={1.6}
        distance={5}
        decay={2}
      />
    </group>
  );
}
