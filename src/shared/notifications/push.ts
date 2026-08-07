import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// The backend broadcasts via the Firebase Admin SDK directly
// (messaging.sendEachForMulticast — see src/shared/server/push-notifications.ts
// on the web repo), not through Expo's push relay. That means we need the raw
// FCM device token (getDevicePushTokenAsync), not an Expo push token
// (getExpoPushTokenAsync) — the latter is only deliverable via Expo's own
// push service and would be silently unsendable from the admin SDK.
export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestDevicePushToken(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }

  const tokenResponse = await Notifications.getDevicePushTokenAsync();
  return tokenResponse.data;
}
