import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "EYF",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E8FF47",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
    ?? Constants.easConfig?.projectId;
  const tokenResult = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = tokenResult.data;

  try {
    await apiFetch("/push/register", {
      method: "POST",
      body: JSON.stringify({
        token,
        platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
        lang: "en",
      }),
    });
  } catch { /* silent — user can retry from settings */ }

  return token;
}
