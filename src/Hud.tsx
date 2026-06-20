import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface HudProps {
  distance: number;
  total: number;
}

// Top-of-screen heads-up display: title and a distance / progress readout.
export default function Hud({ distance, total }: HudProps) {
  const pct = Math.min(1, total > 0 ? distance / total : 0);
  return (
    <View style={styles.root} pointerEvents="none">
      <Text style={styles.title}>SKYROADS</Text>
      <Text style={styles.distance}>
        {distance} / {total} m
      </Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
  },
  title: {
    color: '#9aa6ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
  },
  distance: {
    color: '#eef1ff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  barBg: {
    marginTop: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(120, 135, 220, 0.25)',
    overflow: 'hidden',
  },
  barFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ff6b35',
  },
});
