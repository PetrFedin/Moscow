import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticEvent =
  | 'button'
  | 'epoch-snap'
  | 'route-stop'
  | 'anchor-created'
  | 'anchor-verified'
  | 'field-warning'
  | 'destructive-warning';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export async function haptic(event: HapticEvent) {
  if (!supported) return;

  try {
    switch (event) {
      case 'button':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      case 'epoch-snap':
        await Haptics.selectionAsync();
        return;
      case 'route-stop':
      case 'anchor-created':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      case 'anchor-verified':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      case 'field-warning':
      case 'destructive-warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
    }
  } catch {
    // Haptics are enhancement only; failure must never block the interaction.
  }
}
