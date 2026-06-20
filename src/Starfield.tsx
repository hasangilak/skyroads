import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

const COUNT = 350;
const SPREAD_X = 60;
const Y_MIN = -8;
const Y_MAX = 42;
const AHEAD = 130; // how far ahead of the camera stars spawn
const BEHIND = 25; // recycle once a star is this far behind the camera

// A field of stars that streams past as the craft flies forward. Stars that
// fall behind the camera are recycled out ahead, so the field is effectively
// infinite for the cost of a few hundred points.
export default function Starfield() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      a[i * 3] = (Math.random() * 2 - 1) * SPREAD_X;
      a[i * 3 + 1] = Y_MIN + Math.random() * (Y_MAX - Y_MIN);
      a[i * 3 + 2] = Math.random() * AHEAD;
    }
    return a;
  }, []);

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    const camZ = state.camera.position.z;
    const attr = pts.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const zi = i * 3 + 2;
      if (arr[zi] < camZ - BEHIND) {
        arr[zi] = camZ + AHEAD + Math.random() * 40;
        arr[i * 3] = (Math.random() * 2 - 1) * SPREAD_X;
        arr[i * 3 + 1] = Y_MIN + Math.random() * (Y_MAX - Y_MIN);
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#cdd6ff"
        size={2}
        sizeAttenuation={false}
        transparent
        opacity={0.9}
        depthWrite={false}
        toneMapped={false}
        fog={false}
      />
    </points>
  );
}
