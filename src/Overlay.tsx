import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EndReason } from './Scene';

interface OverlayProps {
  reason: EndReason;
  distance: number;
  total: number;
  hasNext: boolean;
  onRetry: () => void;
  onNext: () => void;
  onMenu: () => void;
}

const TITLES: Record<EndReason, string> = {
  win: 'FINISHED!',
  crash: 'CRASHED',
  fuel: 'OUT OF FUEL',
};

function Button({
  label,
  primary,
  onPress,
}: {
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        primary && styles.btnPrimary,
        pressed && styles.btnPressed,
      ]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

// Full-screen end-of-run panel with context-appropriate actions.
export default function Overlay({
  reason,
  distance,
  total,
  hasNext,
  onRetry,
  onNext,
  onMenu,
}: OverlayProps) {
  const won = reason === 'win';
  return (
    <View style={styles.root}>
      <Text style={[styles.title, won ? styles.win : styles.lose]}>
        {TITLES[reason]}
      </Text>
      <Text style={styles.sub}>
        {won ? `You cleared all ${total} m` : `You reached ${distance} m`}
      </Text>

      <View style={styles.buttons}>
        {won && hasNext ? (
          <Button label="NEXT PLANET" primary onPress={onNext} />
        ) : (
          <Button label={won ? 'REPLAY' : 'RETRY'} primary onPress={onRetry} />
        )}
        <Button label="MENU" onPress={onMenu} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 6, 15, 0.72)',
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 2,
  },
  win: {
    color: '#7CFFB2',
  },
  lose: {
    color: '#ff6b35',
  },
  sub: {
    color: '#c7cdf0',
    fontSize: 16,
    marginTop: 10,
  },
  buttons: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 32,
  },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(120, 135, 220, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(160, 175, 255, 0.7)',
  },
  btnPrimary: {
    backgroundColor: 'rgba(255, 107, 53, 0.4)',
    borderColor: 'rgba(255, 170, 120, 0.8)',
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
