import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EndStatus } from './Scene';

interface OverlayProps {
  status: EndStatus;
  distance: number;
  total: number;
  onRestart: () => void;
}

// Full-screen end-of-run panel for crash / finish, with a restart button.
export default function Overlay({
  status,
  distance,
  total,
  onRestart,
}: OverlayProps) {
  const won = status === 'won';
  return (
    <View style={styles.root}>
      <Text style={[styles.title, won ? styles.win : styles.lose]}>
        {won ? 'FINISHED!' : 'CRASHED'}
      </Text>
      <Text style={styles.sub}>
        {won ? `You cleared all ${total} m` : `You reached ${distance} m`}
      </Text>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={onRestart}
      >
        <Text style={styles.btnText}>RESTART</Text>
      </Pressable>
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
  btn: {
    marginTop: 32,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(120, 135, 220, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(160, 175, 255, 0.7)',
  },
  btnPressed: {
    backgroundColor: 'rgba(160, 175, 255, 0.6)',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
