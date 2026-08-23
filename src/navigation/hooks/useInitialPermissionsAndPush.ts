import { useEffect, useRef } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { LocationManager } from "@maplibre/maplibre-react-native";
import { registerPushTokenApi } from "@/shared/api/push-notifications";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { requestDevicePushToken } from "@/shared/notifications/push";

// Requested once per app session, right after the user's first successful
// auth — this is the app's "first launch" moment from the user's
// perspective. <UserLocation> on MapScreen doesn't prompt for permission
// on its own (confirmed empirically — ACCESS_FINE_LOCATION stayed
// ungranted after Map mounted), so it's requested explicitly here via the
// same PermissionsAndroid path MapLibre's own LocationManager uses.
export function useInitialPermissionsAndPush() {
  const authStatus = useExplorerStore((state) => state.authStatus);
  const setPushToken = useExplorerStore((state) => state.setPushToken);
  const setHasPreciseLocation = useExplorerStore((state) => state.setHasPreciseLocation);
  const hasRequestedPushPermission = useRef(false);

  useEffect(() => {
    if (authStatus === "loading" || hasRequestedPushPermission.current) return;
    hasRequestedPushPermission.current = true;
    LocationManager.requestPermissions()
      .then(() => {
        if (Platform.OS !== "android") return;
        return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(setHasPreciseLocation);
      })
      .catch(() => {});
    requestDevicePushToken()
      .then((token) => {
        if (!token) return;
        setPushToken(token);
        registerPushTokenApi(token).catch(() => {});
      })
      .catch(() => {});
  }, [authStatus, setPushToken, setHasPreciseLocation]);
}
