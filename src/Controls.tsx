import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { Input } from './Scene';

interface HoldButtonProps {
  label: string;
  onDown: () => void;
  onUp?: () => void;
  big?: boolean;
  style?: StyleProp<ViewStyle>;
}

function HoldButton({ label, onDown, onUp, big, style }: HoldButtonProps) {
  return (
    <Pressable
      onPressIn={onDown}
      onPressOut={onUp}
      style={({ pressed }) => [
        styles.btn,
        big && styles.btnBig,
        style,
        pressed && styles.btnPressed,
      ]}
    >
      <Text style={[styles.btnText, big && styles.btnTextBig]}>{label}</Text>
    </Pressable>
  );
}

interface ControlsProps {
  input: Input;
}

// On-screen touch controls. Each button toggles a flag on the shared `input`
// object that the game loop reads every frame. JUMP is edge-triggered: the
// loop consumes the flag, so we only need to set it on press.
export default function Controls({ input }: ControlsProps) {
  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.cluster} pointerEvents="box-none">
        <HoldButton
          label="◀"
          onDown={() => (input.left = true)}
          onUp={() => (input.left = false)}
        />
        <HoldButton
          label="▶"
          onDown={() => (input.right = true)}
          onUp={() => (input.right = false)}
        />
      </View>

      <View style={styles.cluster} pointerEvents="box-none">
        <View style={styles.speedColumn} pointerEvents="box-none">
          <HoldButton
            label="BOOST"
            style={styles.smallBtn}
            onDown={() => (input.boost = true)}
            onUp={() => (input.boost = false)}
          />
          <HoldButton
            label="BRAKE"
            style={styles.smallBtn}
            onDown={() => (input.brake = true)}
            onUp={() => (input.brake = false)}
          />
        </View>
        <HoldButton label="JUMP" big onDown={() => (input.jump = true)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cluster: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  speedColumn: {
    gap: 10,
    marginRight: 14,
  },
  btn: {
    width: 66,
    height: 66,
    borderRadius: 16,
    backgroundColor: 'rgba(80, 95, 180, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(160, 175, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBig: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 107, 53, 0.35)',
    borderColor: 'rgba(255, 170, 120, 0.7)',
  },
  smallBtn: {
    width: 80,
    height: 44,
    borderRadius: 12,
  },
  btnPressed: {
    backgroundColor: 'rgba(160, 175, 255, 0.55)',
  },
  btnText: {
    color: '#eef1ff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnTextBig: {
    fontSize: 20,
  },
});
