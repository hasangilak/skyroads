import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

import Ship from './Ship';
import { isSolid, tileAt, Tile, type Level } from './level';
import type { Planet } from './planets';
import {
  LANES,
  HALF,
  TILE,
  TILE_GAP,
  TILE_THICKNESS,
  BASE_SPEED,
  MIN_SPEED,
  MAX_SPEED,
  BOOST_SPEED,
  ACCEL,
  STRAFE_SPEED,
  STEER_GRIP,
  ICE_GRIP,
  FUEL_MAX,
  FUEL_DRAIN,
  FUEL_BOOST_DRAIN,
  FUEL_PICKUP,
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
  steer: number; // -1 (full left) .. +1 (full right)
  throttle: number; // -1 (brake) .. 0 (cruise) .. +1 (boost)
  jump: boolean; // edge-triggered
}

export type EndReason = 'crash' | 'fuel' | 'win';
type Status = 'playing' | EndReason;

interface GameState {
  x: number; // lateral position (lane space, -HALF..HALF)
  vx: number; // lateral velocity (for grip / ice)
  z: number; // forward position
  py: number; // height above the road surface
  vy: number; // vertical velocity
  speed: number;
  fuel: number;
  bank: number; // visual roll while strafing
  grounded: boolean;
  status: Status;
  lastFuelKey: number; // de-dupes fuel pickups per cell
  lastDist: number;
  lastFuelInt: number;
}

interface SceneProps {
  planet: Planet;
  level: Level;
  input: Input;
  onEnd: (reason: EndReason) => void;
  onStats: (distance: number, fuel: number) => void;
}

const COLOR_ICE = new THREE.Color(COLORS.ice);
const COLOR_BOOST = new THREE.Color(COLORS.boost);
const COLOR_LAVA = new THREE.Color(COLORS.lava);
const COLOR_FUEL = new THREE.Color(COLORS.fuel);

function freshState(): GameState {
  return {
    x: 0,
    vx: 0,
    z: 0,
    py: 0,
    vy: 0,
    speed: BASE_SPEED,
    fuel: FUEL_MAX,
    bank: 0,
    grounded: true,
    status: 'playing',
    lastFuelKey: -1,
    lastDist: -1,
    lastFuelInt: -1,
  };
}

function isGlowTile(t: Tile): boolean {
  return t === Tile.Boost || t === Tile.Lava || t === Tile.Fuel;
}

// The actual scene + game loop. Lives inside <Canvas>.
function Scene({ planet, level, input, onEnd, onStats }: SceneProps) {
  const game = useRef<GameState>(freshState());
  const litRef = useRef<THREE.InstancedMesh>(null); // normal + ice (lit)
  const glowRef = useRef<THREE.InstancedMesh>(null); // boost + lava + fuel (unlit/glowing)
  const playerRef = useRef<THREE.Group>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Themed normal-road colours for this planet.
  const colorA = useMemo(() => new THREE.Color(planet.theme.roadA), [planet]);
  const colorB = useMemo(() => new THREE.Color(planet.theme.roadB), [planet]);

  // Re-place every visible road instance, routing each tile to the lit or the
  // glowing mesh and coloring it by type.
  const updateRoad = (g: GameState) => {
    const lit = litRef.current;
    const glow = glowRef.current;
    if (!lit || !glow) return;

    let iLit = 0;
    let iGlow = 0;
    const startRow = Math.floor(g.z) - VISIBLE_BEHIND;
    const endRow = startRow + VISIBLE_AHEAD + VISIBLE_BEHIND;

    for (let row = startRow; row < endRow; row++) {
      if (row < 0 || row >= level.grid.length) continue;
      const cells = level.grid[row];
      for (let lane = 0; lane < LANES; lane++) {
        const t = cells[lane];
        if (t === Tile.Gap) continue;

        dummy.position.set(lane - HALF, -TILE_THICKNESS / 2, row);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();

        if (isGlowTile(t) && iGlow < MAX_TILES) {
          glow.setMatrixAt(iGlow, dummy.matrix);
          glow.setColorAt(
            iGlow,
            t === Tile.Lava
              ? COLOR_LAVA
              : t === Tile.Fuel
                ? COLOR_FUEL
                : COLOR_BOOST
          );
          iGlow++;
        } else if (iLit < MAX_TILES) {
          lit.setMatrixAt(iLit, dummy.matrix);
          lit.setColorAt(
            iLit,
            t === Tile.Ice
              ? COLOR_ICE
              : (row + lane) % 2 === 0
                ? colorA
                : colorB
          );
          iLit++;
        }
      }
    }

    // Park unused instances out of sight.
    for (; iLit < MAX_TILES; iLit++) {
      dummy.position.set(0, -999, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      lit.setMatrixAt(iLit, dummy.matrix);
    }
    for (; iGlow < MAX_TILES; iGlow++) {
      dummy.position.set(0, -999, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      glow.setMatrixAt(iGlow, dummy.matrix);
    }

    lit.instanceMatrix.needsUpdate = true;
    if (lit.instanceColor) lit.instanceColor.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
  };

  const end = (g: GameState, reason: EndReason) => {
    if (g.status !== 'playing') return;
    g.status = reason;
    onEnd(reason);
  };

  // One step of gameplay physics.
  const tick = (g: GameState, dt: number) => {
    // The tile we're currently riding (only matters while grounded).
    const ridingTile = g.grounded
      ? tileAt(level.grid, Math.floor(g.z), Math.round(g.x + HALF))
      : Tile.Gap;

    // Forward speed eases toward a throttle-driven target; boost pads override
    // it upward with a stronger acceleration.
    let target =
      input.throttle >= 0
        ? BASE_SPEED + input.throttle * (MAX_SPEED - BASE_SPEED)
        : BASE_SPEED + input.throttle * (BASE_SPEED - MIN_SPEED);
    let accel = ACCEL;
    if (ridingTile === Tile.Boost) {
      target = BOOST_SPEED;
      accel = ACCEL * 2.5;
    }
    g.speed += clamp(target - g.speed, -accel * dt, accel * dt);
    g.z += g.speed * dt;

    // Lateral motion via velocity + grip. The chase camera faces +z, so world
    // +x is screen-LEFT — negate steer so a "right" gesture goes right. Ice has
    // far less grip, so the craft keeps sliding.
    const grip = ridingTile === Tile.Ice ? ICE_GRIP : STEER_GRIP;
    const targetVx = -input.steer * STRAFE_SPEED;
    g.vx = lerp(g.vx, targetVx, grip);
    g.x += g.vx * dt;
    if (g.x < -HALF) {
      g.x = -HALF;
      g.vx = 0;
    } else if (g.x > HALF) {
      g.x = HALF;
      g.vx = 0;
    }
    g.bank = lerp(g.bank, clamp(g.vx / STRAFE_SPEED, -1, 1) * 0.4, 0.15);

    // Jump (edge-triggered; only from the ground).
    if (input.jump && g.grounded) {
      g.vy = planet.jumpV;
      g.grounded = false;
    }
    input.jump = false;

    // Gravity (per-planet).
    g.vy -= planet.gravity * dt;
    g.py += g.vy * dt;

    // Ground / gap / hazard resolution at the landing cell.
    const row = Math.floor(g.z);
    const lane = Math.round(g.x + HALF);
    const landTile = tileAt(level.grid, row, lane);
    if (g.py <= 0) {
      if (landTile === Tile.Gap) {
        end(g, 'crash'); // fell into the void
        return;
      }
      if (landTile === Tile.Lava) {
        end(g, 'crash'); // touched down on lava
        return;
      }
      g.py = 0;
      g.vy = 0;
      g.grounded = true;

      // Fuel pickup — once per distinct cell.
      if (landTile === Tile.Fuel) {
        const key = row * LANES + lane;
        if (key !== g.lastFuelKey) {
          g.lastFuelKey = key;
          g.fuel = Math.min(FUEL_MAX, g.fuel + FUEL_PICKUP);
        }
      }
    } else {
      g.grounded = false;
    }

    // Fuel drain — faster while throttling up.
    g.fuel -= (FUEL_DRAIN + Math.max(0, input.throttle) * FUEL_BOOST_DRAIN) * dt;
    if (g.fuel <= 0) {
      g.fuel = 0;
      end(g, 'fuel');
      return;
    }

    if (g.z >= level.grid.length - 1) end(g, 'win');
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); // clamp to survive frame hitches
    const g = game.current;

    if (g.status === 'playing') {
      tick(g, dt);
      const d = Math.max(0, Math.floor(g.z));
      const f = Math.ceil(g.fuel);
      if (d !== g.lastDist || f !== g.lastFuelInt) {
        g.lastDist = d;
        g.lastFuelInt = f;
        onStats(d, g.fuel);
      }
    } else if (g.status === 'win') {
      g.z += g.speed * 0.6 * dt;
    } else {
      // crash / fuel: tumble into the void.
      g.vy -= planet.gravity * dt;
      g.py += g.vy * dt;
      g.z += g.speed * 0.25 * dt;
      g.bank += dt * 2;
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
      <color attach="background" args={[planet.theme.bg]} />
      <fog attach="fog" args={[planet.theme.bg, 25, 88]} />

      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 10, 6]} intensity={1.1} />

      {/* Lit road tiles (normal + ice). */}
      <instancedMesh
        ref={litRef}
        args={[undefined, undefined, MAX_TILES]}
        frustumCulled={false}
      >
        <boxGeometry args={[tileSize, TILE_THICKNESS, tileSize]} />
        <meshStandardMaterial roughness={0.55} metalness={0.15} />
      </instancedMesh>

      {/* Glowing road tiles (boost + lava + fuel) — unlit so they read as emissive. */}
      <instancedMesh
        ref={glowRef}
        args={[undefined, undefined, MAX_TILES]}
        frustumCulled={false}
      >
        <boxGeometry args={[tileSize, TILE_THICKNESS, tileSize]} />
        <meshBasicMaterial toneMapped={false} />
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
  planet,
  level,
  input,
  onEnd,
  onStats,
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
      <Scene
        planet={planet}
        level={level}
        input={input}
        onEnd={onEnd}
        onStats={onStats}
      />
    </Canvas>
  );
});

export default CanvasView;
