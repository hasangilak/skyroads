import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

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

// Steering is a full-screen virtual flight stick; jump is a dedicated button.
// Wherever you press becomes neutral; drag from there to fly:
//   - horizontal drag  -> steer (proportional)
//   - vertical drag     -> boost (up) / brake (down)
// Releasing recenters to straight-ahead cruise. The JUMP button is edge-
// triggered: the game loop consumes the flag, so press-in is enough.
export default function GestureControls({ input }: GestureControlsProps) {
  const [showHint, setShowHint] = useState(true);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onBegin(() => setShowHint(false))
        .onUpdate((e) => {
          const dx = e.translationX;
          const dy = e.translationY;
          input.steer =
            Math.abs(dx) < GESTURE_DEADZONE
              ? 0
              : clamp(dx / STEER_TRAVEL, -1, 1);
          // Screen y grows downward, so negate: drag up -> positive throttle.
          input.throttle =
            Math.abs(dy) < GESTURE_DEADZONE
              ? 0
              : clamp(-dy / THROTTLE_TRAVEL, -1, 1);
        })
        .onFinalize(() => {
          input.steer = 0;
          input.throttle = 0;
        }),
    [input]
  );

  return (
    <>
      <GestureDetector gesture={pan}>
        <View style={styles.surface}>
          {showHint && (
            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintTitle}>Drag to steer</Text>
              <Text style={styles.hintSub}>up / down to boost · brake</Text>
            </View>
          )}
        </View>
      </GestureDetector>

      <Pressable
        onPressIn={() => {
          input.jump = true;
        }}
        style={({ pressed }) => [styles.jumpBtn, pressed && styles.jumpPressed]}
      >
        <Text style={styles.jumpText}>JUMP</Text>
      </Pressable>
    </>
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
  jumpBtn: {
    position: 'absolute',
    right: 28,
    bottom: 44,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 107, 53, 0.32)',
    borderWidth: 2,
    borderColor: 'rgba(255, 170, 120, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpPressed: {
    backgroundColor: 'rgba(255, 140, 70, 0.6)',
  },
  jumpText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
