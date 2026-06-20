import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { gravityLabel, PLANETS } from './planets';

interface MenuProps {
  unlocked: number; // number of unlocked planets
  best: Record<string, number>; // best distance per planet name
  onSelect: (index: number) => void;
}

// Title screen / planet select. Planets unlock as you finish the previous one.
export default function Menu({ unlocked, best, onSelect }: MenuProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>SKYROADS</Text>
      <Text style={styles.subtitle}>SELECT PLANET</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {PLANETS.map((p, i) => {
          const locked = i >= unlocked;
          const bestDist = best[p.name] ?? 0;
          const completed = bestDist >= p.lengthRows;
          return (
            <Pressable
              key={p.name}
              disabled={locked}
              onPress={() => onSelect(i)}
              style={({ pressed }) => [
                styles.card,
                { borderColor: p.theme.roadA },
                pressed && !locked && styles.cardPressed,
                locked && styles.cardLocked,
              ]}
            >
              <View
                style={[styles.swatch, { backgroundColor: p.theme.roadA }]}
              />
              <View style={styles.cardText}>
                <Text style={[styles.cardName, locked && styles.lockedText]}>
                  {locked ? 'LOCKED' : p.name}
                </Text>
                <Text style={[styles.cardSub, locked && styles.lockedText]}>
                  {locked
                    ? `Finish ${PLANETS[i - 1].name} to unlock`
                    : `${gravityLabel(p.gravity)} · ${p.lengthRows} m`}
                </Text>
                {!locked && bestDist > 0 && (
                  <Text style={styles.cardBest}>
                    {completed ? '✓ COMPLETE' : `BEST ${bestDist} m`}
                  </Text>
                )}
              </View>
              {locked && <Text style={styles.lock}>🔒</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05060f',
    paddingTop: 90,
    paddingHorizontal: 24,
  },
  title: {
    color: '#eef1ff',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#9aa6ff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 135, 220, 0.12)',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  cardPressed: {
    backgroundColor: 'rgba(120, 135, 220, 0.28)',
  },
  cardLocked: {
    opacity: 0.45,
    borderColor: 'rgba(120, 135, 220, 0.3)',
  },
  swatch: {
    width: 14,
    height: 44,
    borderRadius: 4,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardName: {
    color: '#eef1ff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cardSub: {
    color: '#9aa6ff',
    fontSize: 13,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  cardBest: {
    color: '#7CFFB2',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 1,
  },
  lockedText: {
    color: '#8088b0',
  },
  lock: {
    fontSize: 22,
    marginLeft: 10,
  },
});
