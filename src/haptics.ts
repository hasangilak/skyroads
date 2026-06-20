import * as Haptics from 'expo-haptics';

// Thin, fire-and-forget wrappers around expo-haptics. Errors (e.g. on web or
// unsupported devices) are swallowed so gameplay never depends on feedback.

export function hapticJump(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticPickup(): void {
  Haptics.selectionAsync().catch(() => {});
}

export function hapticCrash(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
    () => {}
  );
}
