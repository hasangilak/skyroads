import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CanvasView, { type EndReason, type Input } from './Scene';
import { generateLevel } from './level';
import { FUEL_MAX } from './constants';
import Hud from './Hud';
import GestureControls from './GestureControls';
import Overlay from './Overlay';

type Status = 'playing' | EndReason;

export default function Game() {
  // Shared, stable input object mutated by gestures and read by the game loop.
  const inputRef = useRef<Input>({
    steer: 0,
    throttle: 0,
    jump: false,
  });
  const input = inputRef.current;

  const [runId, setRunId] = useState(0);
  const level = useMemo(() => generateLevel(), [runId]);
  const [status, setStatus] = useState<Status>('playing');
  const [distance, setDistance] = useState(0);
  const [fuel, setFuel] = useState(FUEL_MAX);

  // Wrap the setters in stable callbacks so the memoized Canvas never
  // reconciles its 3D tree when only the HUD changes.
  const setStatusRef = useRef(setStatus);
  setStatusRef.current = setStatus;
  const setDistRef = useRef(setDistance);
  setDistRef.current = setDistance;
  const setFuelRef = useRef(setFuel);
  setFuelRef.current = setFuel;
  const onEnd = useCallback((r: EndReason) => setStatusRef.current(r), []);
  const onStats = useCallback((d: number, f: number) => {
    setDistRef.current(d);
    setFuelRef.current(f);
  }, []);

  const restart = useCallback(() => {
    input.steer = 0;
    input.throttle = 0;
    input.jump = false;
    setDistance(0);
    setFuel(FUEL_MAX);
    setStatus('playing');
    setRunId((r) => r + 1); // remounts the scene with a fresh level
  }, [input]);

  return (
    <View style={styles.root}>
      <CanvasView
        key={runId}
        level={level}
        input={input}
        onEnd={onEnd}
        onStats={onStats}
      />
      <Hud distance={distance} total={level.length} fuel={fuel} />
      <GestureControls input={input} />
      {status !== 'playing' && (
        <Overlay
          reason={status}
          distance={distance}
          total={level.length}
          onRestart={restart}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05060f',
  },
});
