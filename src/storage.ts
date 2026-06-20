import AsyncStorage from '@react-native-async-storage/async-storage';

// Persisted progress: how many planets are unlocked and the best distance
// reached on each planet (keyed by planet name).
export interface Progress {
  unlocked: number;
  best: Record<string, number>;
}

const KEY = 'skyroads.progress.v1';

export const DEFAULT_PROGRESS: Progress = { unlocked: 1, best: {} };

export async function loadProgress(): Promise<Progress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { unlocked: 1, best: {} };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      unlocked: typeof parsed.unlocked === 'number' ? parsed.unlocked : 1,
      best:
        parsed.best && typeof parsed.best === 'object' ? parsed.best : {},
    };
  } catch {
    return { unlocked: 1, best: {} };
  }
}

export async function saveProgress(progress: Progress): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Best-effort: a failed write just means progress isn't saved this time.
  }
}
