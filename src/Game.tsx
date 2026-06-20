import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CanvasView, { type EndReason, type Input } from './Scene';
import { generateLevel } from './level';
import { PLANETS } from './planets';
import { FUEL_MAX } from './constants';
import Menu from './Menu';
import Hud from './Hud';
import GestureControls from './GestureControls';
import Overlay from './Overlay';

type Screen = 'menu' | 'playing';
type Status = 'playing' | EndReason;

export default function Game() {
  // Shared, stable input object mutated by gestures and read by the game loop.
  const inputRef = useRef<Input>({
    steer: 0,
    throttle: 0,
    jump: false,
  });
  const input = inputRef.current;

  const [screen, setScreen] = useState<Screen>('menu');
  const [planetIndex, setPlanetIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(1); // how many planets are playable
  const [runId, setRunId] = useState(0);
  const [status, setStatus] = useState<Status>('playing');
  const [distance, setDistance] = useState(0);
  const [fuel, setFuel] = useState(FUEL_MAX);

  const planet = PLANETS[planetIndex];
  // A fresh level whenever we (re)start — keyed on the planet and run counter.
  const level = useMemo(
    () => generateLevel(PLANETS[planetIndex].lengthRows),
    [runId, planetIndex]
  );

  // Latest planet index for the stable onEnd callback.
  const planetIndexRef = useRef(planetIndex);
  planetIndexRef.current = planetIndex;

  // Stable callbacks so the memoized Canvas never reconciles on HUD updates.
  const onEnd = useCallback((reason: EndReason) => {
    if (reason === 'win') {
      const next = planetIndexRef.current + 1;
      setUnlocked((u) => Math.min(PLANETS.length, Math.max(u, next + 1)));
    }
    setStatus(reason);
  }, []);
  const onStats = useCallback((d: number, f: number) => {
    setDistance(d);
    setFuel(f);
  }, []);

  const startPlanet = useCallback(
    (index: number) => {
      input.steer = 0;
      input.throttle = 0;
      input.jump = false;
      setPlanetIndex(index);
      setDistance(0);
      setFuel(FUEL_MAX);
      setStatus('playing');
      setRunId((r) => r + 1); // remounts the scene with a fresh level
      setScreen('playing');
    },
    [input]
  );

  const retry = useCallback(
    () => startPlanet(planetIndexRef.current),
    [startPlanet]
  );
  const nextPlanet = useCallback(
    () => startPlanet(planetIndexRef.current + 1),
    [startPlanet]
  );
  const toMenu = useCallback(() => {
    setStatus('playing');
    setScreen('menu');
  }, []);

  if (screen === 'menu') {
    return (
      <View style={styles.root}>
        <Menu unlocked={unlocked} onSelect={startPlanet} />
      </View>
    );
  }

  const hasNext = planetIndex + 1 < PLANETS.length;

  return (
    <View style={styles.root}>
      <CanvasView
        key={runId}
        planet={planet}
        level={level}
        input={input}
        onEnd={onEnd}
        onStats={onStats}
      />
      <Hud
        planetName={planet.name}
        distance={distance}
        total={level.length}
        fuel={fuel}
      />
      <GestureControls input={input} />
      {status !== 'playing' && (
        <Overlay
          reason={status}
          distance={distance}
          total={level.length}
          hasNext={hasNext}
          onRetry={retry}
          onNext={nextPlanet}
          onMenu={toMenu}
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
