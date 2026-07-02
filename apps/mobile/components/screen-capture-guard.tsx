import { useEffect } from "react";
import { Alert } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

/**
 * The one place true screenshot/recording protection is possible: native.
 *
 * - Android: usePreventScreenCapture() sets FLAG_SECURE → screenshots fail and
 *   screen recordings/casts show a black frame while this is mounted.
 * - iOS: the OS does NOT allow blocking screenshots; expo-screen-capture
 *   obscures the app during screen recording and lets us DETECT screenshots.
 *   So on iOS we can only nudge the user after the fact.
 *
 * Mounted at the app root, so protection is active everywhere.
 */
export function ScreenCaptureGuard() {
  // Prevents capture (Android FLAG_SECURE / iOS recording obscure) while mounted.
  ScreenCapture.usePreventScreenCapture();

  useEffect(() => {
    // iOS can't block screenshots — detect them and remind the user it's protected.
    const sub = ScreenCapture.addScreenshotListener(() => {
      Alert.alert(
        "EYF content is protected",
        "Screenshots of your prep content aren't allowed. Please don't share it.",
      );
    });
    return () => sub.remove();
  }, []);

  return null;
}
