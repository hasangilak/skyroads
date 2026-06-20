import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FUEL_MAX } from './constants';

interface HudProps {
  distance: number;
  total: number;
  fuel: number;
}

// Top-of-screen heads-up display: distance / progress and a fuel gauge.
export default function Hud({ distance, total, fuel }: HudProps) {
  const progress = Math.min(1, total > 0 ? distance / total : 0);
  const fuelPct = Math.max(0, Math.min(1, fuel / FUEL_MAX));
  const fuelColor =
    fuelPct > 0.5 ? '#7CFFB2' : fuelPct > 0.25 ? '#ffd23f' : '#ff5a3c';

  return (
    <View style={styles.root} pointerEvents="none">
      <Text style={styles.title}>SKYROADS</Text>
      <Text style={styles.distance}>
        {distance} / {total} m
      </Text>
      <View style={styles.barBg}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.fuelRow}>
        <Text style={styles.fuelLabel}>FUEL</Text>
        <View style={styles.fuelBarBg}>
          <View
            style={[
              styles.fuelFill,
              { width: `${fuelPct * 100}%`, backgroundColor: fuelColor },
            ]}
          />
        </View>
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
  progressFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ff6b35',
  },
  fuelRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fuelLabel: {
    color: '#9aa6ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    width: 44,
  },
  fuelBarBg: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(120, 135, 220, 0.25)',
    overflow: 'hidden',
  },
  fuelFill: {
    height: 9,
    borderRadius: 5,
  },
});
