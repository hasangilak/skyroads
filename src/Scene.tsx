import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

import Ship from './Ship';
import { isSolid, type Level } from './level';
import {
  LANES,
  HALF,
  TILE,
  TILE_GAP,
  TILE_THICKNESS,
  BASE_SPEED,
  MIN_SPEED,
  MAX_SPEED,
  ACCEL,
  STRAFE_SPEED,
  JUMP_V,
  GRAVITY,
  PLAYER_Y,
  VISIBLE_AHEAD,
  VISIBLE_BEHIND,
  MAX_TILES,
  CAMERA_BACK,
  CAMERA_HEIGHT,
  CAMERA_LOOK_AHEAD,
  COLORS,
  clamp,
  lerp,
} from './constants';

export interface Input {
  left: boolean;
  right: boolean;
  jump: boolean;
  boost: boolean;
  brake: boolean;
}

export type EndStatus = 'dead' | 'won';
type Status = 'playing' | EndStatus;

interface GameState {
  x: number; // lateral position (lane space, -HALF..HALF)
  z: number; // forward position
  py: number; // height above the road surface
  vy: number; // vertical velocity
  speed: number;
  bank: number; // visual roll while strafing
  grounded: boolean;
  status: Status;
  lastDist: number;
}

interface SceneProps {
  level: Level;
  input: Input;
  onEnd: (status: EndStatus) => void;
  onDistance: (distance: number) => void;
}

const COLOR_A = new THREE.Color(COLORS.roadA);
const COLOR_B = new THREE.Color(COLORS.roadB);

function freshState(): GameState {
  return {
    x: 0,
    z: 0,
    py: 0,
    vy: 0,
    speed: BASE_SPEED,
    bank: 0,
    grounded: true,
    status: 'playing',
    lastDist: -1,
  };
}

// The actual scene + game loop. Lives inside <Canvas>.
function Scene({ level, input, onEnd, onDistance }: SceneProps) {
  const game = useRef<GameState>(freshState());
  const roadRef = useRef<THREE.InstancedMesh>(null);
  const playerRef = useRef<THREE.Group>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Re-position every visible road instance for the current craft position.
  const updateRoad = (g: GameState) => {
    const mesh = roadRef.current;
    if (!mesh) return;

    let i = 0;
    const startRow = Math.floor(g.z) - VISIBLE_BEHIND;
    const endRow = startRow + VISIBLE_AHEAD + VISIBLE_BEHIND;

    for (let row = startRow; row < endRow && i < MAX_TILES; row++) {
      if (row < 0 || row >= level.grid.length) continue;
      const cells = level.grid[row];
      for (let lane = 0; lane < LANES && i < MAX_TILES; lane++) {
        if (!cells[lane]) continue;
        dummy.position.set(lane - HALF, -TILE_THICKNESS / 2, row);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, (row + lane) % 2 === 0 ? COLOR_A : COLOR_B);
        i++;
      }
    }

    // Park any unused instances out of sight.
    for (; i < MAX_TILES; i++) {
      dummy.position.set(0, -999, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  const die = (g: GameState) => {
    if (g.status !== 'playing') return;
    g.status = 'dead';
    onEnd('dead');
  };

  const win = (g: GameState) => {
    if (g.status !== 'playing') return;
    g.status = 'won';
    onEnd('won');
  };

  // One step of gameplay physics.
  const tick = (g: GameState, dt: number) => {
    // Forward speed eases toward boost / brake / cruise target.
    let target = BASE_SPEED;
    if (input.boost) target = MAX_SPEED;
    else if (input.brake) target = MIN_SPEED;
    g.speed += clamp(target - g.speed, -ACCEL * dt, ACCEL * dt);
    g.z += g.speed * dt;

    // Strafe left / right, clamped to the road width.
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    g.x = clamp(g.x + dir * STRAFE_SPEED * dt, -HALF, HALF);
    g.bank = lerp(g.bank, dir * 0.3, 0.15);

    // Jump (edge-triggered; only from the ground).
    if (input.jump && g.grounded) {
      g.vy = JUMP_V;
      g.grounded = false;
    }
    input.jump = false;

    // Gravity.
    g.vy -= GRAVITY * dt;
    g.py += g.vy * dt;

    // Ground / gap resolution. You're safe over a gap only while airborne;
    // descend to road level over open space and you fall.
    const row = Math.floor(g.z);
    const lane = Math.round(g.x + HALF);
    const onSolid = isSolid(level.grid, row, lane);
    if (g.py <= 0) {
      if (onSolid) {
        g.py = 0;
        g.vy = 0;
        g.grounded = true;
      } else {
        die(g);
      }
    } else {
      g.grounded = false;
    }

    if (g.z >= level.grid.length - 1) win(g);
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); // clamp to survive frame hitches
    const g = game.current;

    if (g.status === 'playing') {
      tick(g, dt);
      const d = Math.max(0, Math.floor(g.z));
      if (d !== g.lastDist) {
        g.lastDist = d;
        onDistance(d);
      }
    } else if (g.status === 'dead') {
      // Tumble into the void.
      g.vy -= GRAVITY * dt;
      g.py += g.vy * dt;
      g.z += g.speed * 0.25 * dt;
      g.bank += dt * 2;
    } else if (g.status === 'won') {
      g.z += g.speed * 0.6 * dt;
    }

    if (playerRef.current) {
      playerRef.current.position.set(g.x, PLAYER_Y + g.py, g.z);
      playerRef.current.rotation.z = g.bank;
    }

    updateRoad(g);

    // Chase camera: locked behind in z, eased in x / y.
    const cam = state.camera;
    const tx = g.x * 0.4;
    const ty = CAMERA_HEIGHT + Math.max(0, g.py) * 0.4;
    cam.position.x += (tx - cam.position.x) * 0.12;
    cam.position.y += (ty - cam.position.y) * 0.12;
    cam.position.z = g.z - CAMERA_BACK;
    cam.lookAt(g.x * 0.4, 0.6, g.z + CAMERA_LOOK_AHEAD);
  });

  const tileSize = TILE - TILE_GAP;

  return (
    <>
      <color attach="background" args={[COLORS.bg]} />
      <fog attach="fog" args={[COLORS.bg, 25, 88]} />

      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 10, 6]} intensity={1.1} />

      {/* The road: one instanced mesh covering the whole visible window. */}
      <instancedMesh
        ref={roadRef}
        args={[undefined, undefined, MAX_TILES]}
        frustumCulled={false}
      >
        <boxGeometry args={[tileSize, TILE_THICKNESS, tileSize]} />
        <meshStandardMaterial roughness={0.55} metalness={0.15} />
      </instancedMesh>

      {/* The craft. */}
      <group ref={playerRef}>
        <Ship />
      </group>
    </>
  );
}

// Memoized so HUD/state updates in the parent never reconcile the 3D tree.
const CanvasView = React.memo(function CanvasView({
  level,
  input,
  onEnd,
  onDistance,
}: SceneProps) {
  return (
    <Canvas
      style={{ flex: 1 }}
      camera={{
        fov: 60,
        near: 0.1,
        far: 200,
        position: [0, CAMERA_HEIGHT, -CAMERA_BACK],
      }}
    >
      <Scene level={level} input={input} onEnd={onEnd} onDistance={onDistance} />
    </Canvas>
  );
});

export default CanvasView;
