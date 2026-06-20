import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CanvasView, { type EndStatus, type Input } from './Scene';
import { generateLevel } from './level';
import Hud from './Hud';
import Controls from './Controls';
import Overlay from './Overlay';

type Status = 'playing' | EndStatus;

export default function Game() {
  // Shared, stable input object mutated by Controls and read by the game loop.
  const inputRef = useRef<Input>({
    left: false,
    right: false,
    jump: false,
    boost: false,
    brake: false,
  });
  const input = inputRef.current;

  const [runId, setRunId] = useState(0);
  const level = useMemo(() => generateLevel(), [runId]);
  const [status, setStatus] = useState<Status>('playing');
  const [distance, setDistance] = useState(0);

  // Wrap the setters in stable callbacks so the memoized Canvas never
  // reconciles its 3D tree when only the HUD changes.
  const setStatusRef = useRef(setStatus);
  setStatusRef.current = setStatus;
  const setDistRef = useRef(setDistance);
  setDistRef.current = setDistance;
  const onEnd = useCallback((s: EndStatus) => setStatusRef.current(s), []);
  const onDistance = useCallback((d: number) => setDistRef.current(d), []);

  const restart = useCallback(() => {
    input.left = false;
    input.right = false;
    input.jump = false;
    input.boost = false;
    input.brake = false;
    setDistance(0);
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
        onDistance={onDistance}
      />
      <Hud distance={distance} total={level.length} />
      <Controls input={input} />
      {status !== 'playing' && (
        <Overlay
          status={status}
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
