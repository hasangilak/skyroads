import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CanvasView, { type EndReason, type Input } from './Scene';
import { generateLevel } from './level';
import { PLANETS } from './planets';
import { FUEL_MAX } from './constants';
import { loadProgress, saveProgress } from './storage';
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
  const [best, setBest] = useState<Record<string, number>>({});
  const [record, setRecord] = useState(false); // did the last run set a new best?
  const [runId, setRunId] = useState(0);
  const [status, setStatus] = useState<Status>('playing');
  const [distance, setDistance] = useState(0);
  const [fuel, setFuel] = useState(FUEL_MAX);

  // Load saved progress once on startup.
  useEffect(() => {
    loadProgress().then((p) => {
      setUnlocked(p.unlocked);
      setBest(p.best);
    });
  }, []);

  const planet = PLANETS[planetIndex];
  // A fresh level whenever we (re)start — keyed on the planet and run counter.
  const level = useMemo(
    () =>
      generateLevel(
        PLANETS[planetIndex].lengthRows,
        PLANETS[planetIndex].difficulty
      ),
    [runId, planetIndex]
  );

  // Mirror state into refs so the stable callbacks can read current values.
  const planetIndexRef = useRef(planetIndex);
  planetIndexRef.current = planetIndex;
  const unlockedRef = useRef(unlocked);
  unlockedRef.current = unlocked;
  const bestRef = useRef(best);
  bestRef.current = best;
  const distRef = useRef(0);

  // Stable callbacks so the memoized Canvas never reconciles on HUD updates.
  const onEnd = useCallback((reason: EndReason) => {
    const i = planetIndexRef.current;
    const name = PLANETS[i].name;
    const reached =
      reason === 'win' ? PLANETS[i].lengthRows : distRef.current;

    const prevBest = bestRef.current[name] ?? 0;
    const isRecord = reached > prevBest;
    const newBest = isRecord
      ? { ...bestRef.current, [name]: reached }
      : bestRef.current;
    const newUnlocked =
      reason === 'win'
        ? Math.min(PLANETS.length, Math.max(unlockedRef.current, i + 2))
        : unlockedRef.current;

    setRecord(isRecord);
    setBest(newBest);
    setUnlocked(newUnlocked);
    saveProgress({ unlocked: newUnlocked, best: newBest });
    setStatus(reason);
  }, []);

  const onStats = useCallback((d: number, f: number) => {
    distRef.current = d;
    setDistance(d);
    setFuel(f);
  }, []);

  const startPlanet = useCallback(
    (index: number) => {
      input.steer = 0;
      input.throttle = 0;
      input.jump = false;
      distRef.current = 0;
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
        <Menu unlocked={unlocked} best={best} onSelect={startPlanet} />
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
          best={best[planet.name] ?? 0}
          isRecord={record}
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
