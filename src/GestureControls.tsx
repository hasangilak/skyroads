import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

import type { Input } from './Scene';
import {
  clamp,
  GESTURE_DEADZONE,
  STEER_TRAVEL,
  THROTTLE_TRAVEL,
} from './constants';

interface GestureControlsProps {
  input: Input;
}

// Full-screen gesture surface — the whole screen is a virtual flight stick.
// Wherever you press becomes neutral; drag from there to fly:
//   - horizontal drag  -> steer (proportional)
//   - vertical drag     -> boost (up) / brake (down)
//   - quick swipe up    -> jump
// Releasing recenters to straight-ahead cruise.
export default function GestureControls({ input }: GestureControlsProps) {
  const [showHint, setShowHint] = useState(true);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .runOnJS(true)
      .onBegin(() => setShowHint(false))
      .onUpdate((e) => {
        const dx = e.translationX;
        const dy = e.translationY;
        input.steer =
          Math.abs(dx) < GESTURE_DEADZONE ? 0 : clamp(dx / STEER_TRAVEL, -1, 1);
        // Screen y grows downward, so negate: drag up -> positive throttle.
        input.throttle =
          Math.abs(dy) < GESTURE_DEADZONE
            ? 0
            : clamp(-dy / THROTTLE_TRAVEL, -1, 1);
      })
      .onFinalize(() => {
        input.steer = 0;
        input.throttle = 0;
      });

    const flickUp = Gesture.Fling()
      .direction(Directions.UP)
      .runOnJS(true)
      .onStart(() => {
        input.jump = true;
      });

    return Gesture.Simultaneous(pan, flickUp);
  }, [input]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.surface}>
        {showHint && (
          <View style={styles.hint} pointerEvents="none">
            <Text style={styles.hintTitle}>Drag to steer</Text>
            <Text style={styles.hintSub}>
              up / down to boost · brake     swipe up to jump
            </Text>
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  surface: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 70,
    alignItems: 'center',
  },
  hintTitle: {
    color: '#eef1ff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hintSub: {
    color: '#9aa6ff',
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 0.5,
  },
});
