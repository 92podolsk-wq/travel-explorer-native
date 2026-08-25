import { useState } from "react";
import { Alert, Linking } from "react-native";
import { registerPushTokenApi, unregisterPushTokenApi } from "@/shared/api/push-notifications";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { getNotificationPermissionStatus, requestDevicePushToken } from "@/shared/notifications/push";

export function usePushNotificationToggle() {
  const t = useTranslations();
  const pushToken = useExplorerStore((state) => state.pushToken);
  const setPushToken = useExplorerStore((state) => state.setPushToken);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);

  async function handleToggleNotifications(value: boolean) {
    setIsTogglingNotifications(true);
    try {
      if (value) {
        const status = await getNotificationPermissionStatus();
        if (status === "denied") {
          Alert.alert(t.auth.pushNotificationsDenied, t.auth.pushNotificationsHint, [
            { text: t.auth.cancel, style: "cancel" },
            { text: t.auth.openSettings, onPress: () => Linking.openSettings() }
          ]);
          return;
        }
        const token = await requestDevicePushToken();
        if (token) {
          setPushToken(token);
          await registerPushTokenApi(token).catch(() => {});
        }
      } else if (pushToken) {
        await unregisterPushTokenApi(pushToken).catch(() => {});
        setPushToken(null);
      }
    } finally {
      setIsTogglingNotifications(false);
    }
  }

  return { pushToken, isTogglingNotifications, handleToggleNotifications };
}
