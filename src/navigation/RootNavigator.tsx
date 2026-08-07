import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { LocationManager } from "@maplibre/maplibre-react-native";
import * as Notifications from "expo-notifications";
import { getBootstrap } from "@/shared/api/bootstrap";
import { getMe } from "@/shared/api/auth";
import { registerPushTokenApi } from "@/shared/api/push-notifications";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { requestDevicePushToken } from "@/shared/notifications/push";
import { hasSeenIntro, markIntroSeen } from "@/shared/storage/intro-storage";
import { refreshNearbyGeofences } from "@/shared/geofencing/manage-geofences";
import { NEARBY_POI_NOTIFICATION_TYPE } from "@/shared/geofencing/nearby-locations-task";
import { addNotificationHistoryEntry } from "@/shared/storage/notification-history";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { AuthScreen } from "@/screens/auth/AuthScreen";
import { WelcomeIntro } from "@/components/WelcomeIntro";
import { TabNavigator, navigationRef } from "./TabNavigator";

export function RootNavigator() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const authStatus = useExplorerStore((state) => state.authStatus);
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const setBootstrapData = useExplorerStore((state) => state.setBootstrapData);
  const setPushToken = useExplorerStore((state) => state.setPushToken);
  const isAuthModalOpen = useExplorerStore((state) => state.isAuthModalOpen);
  const closeAuthModal = useExplorerStore((state) => state.closeAuthModal);
  const isNearbyAlertsEnabled = useExplorerStore((state) => state.isNearbyAlertsEnabled);
  const favorites = useExplorerStore((state) => state.favorites);
  const pois = useExplorerStore((state) => state.pois);
  const language = useExplorerStore((state) => state.language);
  const setActiveRegionId = useExplorerStore((state) => state.setActiveRegionId);
  const setSelectedPoiId = useExplorerStore((state) => state.setSelectedPoiId);
  const hasRequestedPushPermission = useRef(false);
  const [bootError, setBootError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    hasSeenIntro().then((seen) => setShowIntro(!seen));
  }, []);

  function handleIntroFinish() {
    setShowIntro(false);
    markIntroSeen();
  }

  const loadBootstrap = useCallback(async () => {
    try {
      const [me, bootstrap] = await Promise.all([getMe(), getBootstrap()]);
      hydrateAuth(
        me.user,
        me.user
          ? {
              favoritePoiIds: me.favoritePoiIds ?? [],
              viewedPoiIds: me.viewedPoiIds ?? [],
              visitedPoiIds: me.visitedPoiIds ?? []
            }
          : undefined
      );
      setBootstrapData(bootstrap);
      setBootError(false);
    } catch {
      setBootError(true);
    } finally {
      setIsRetrying(false);
    }
  }, [hydrateAuth, setBootstrapData]);

  useEffect(() => {
    loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRetry() {
    setIsRetrying(true);
    loadBootstrap();
  }

  // Requested once per app session, right after the user's first successful
  // auth — this is the app's "first launch" moment from the user's
  // perspective. <UserLocation> on MapScreen doesn't prompt for permission
  // on its own (confirmed empirically — ACCESS_FINE_LOCATION stayed
  // ungranted after Map mounted), so it's requested explicitly here via the
  // same PermissionsAndroid path MapLibre's own LocationManager uses.
  useEffect(() => {
    if (authStatus === "loading" || hasRequestedPushPermission.current) return;
    hasRequestedPushPermission.current = true;
    LocationManager.requestPermissions().catch(() => {});
    requestDevicePushToken()
      .then((token) => {
        if (!token) return;
        setPushToken(token);
        registerPushTokenApi(token).catch(() => {});
      })
      .catch(() => {});
  }, [authStatus, setPushToken]);

  useEffect(() => {
    if (!isNearbyAlertsEnabled) return;
    const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
    refreshNearbyGeofences(favoritePois, language).catch(() => {});
  }, [isNearbyAlertsEnabled, favorites, pois, language]);

  useEffect(() => {
    function handleNotificationResponse(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data as { type?: string; poiId?: string; regionId?: string };
      if (data?.type !== NEARBY_POI_NOTIFICATION_TYPE || !data.poiId) return;
      if (data.regionId) setActiveRegionId(data.regionId);
      setSelectedPoiId(data.poiId);
      if (navigationRef.isReady()) navigationRef.navigate("Map");
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, [setActiveRegionId, setSelectedPoiId]);

  // Remote (FCM) pushes only — the geofencing task already logs nearby-POI
  // notifications directly so they still show up even if the app was killed.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = content.data as { type?: string } | undefined;
      if (data?.type === NEARBY_POI_NOTIFICATION_TYPE) return;
      addNotificationHistoryEntry({
        title: content.title ?? "",
        body: content.body ?? "",
        receivedAt: Date.now(),
        data
      }).catch(() => {});
    });
    return () => subscription.remove();
  }, []);

  let content;
  if (bootError) {
    content = (
      <View style={styles.bootErrorContainer}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textTertiary} />
        <Text style={styles.bootErrorTitle}>{t.auth.bootErrorTitle}</Text>
        <Text style={styles.bootErrorBody}>{t.auth.bootErrorBody}</Text>
        <TouchableOpacity style={styles.bootErrorButton} onPress={handleRetry} disabled={isRetrying}>
          {isRetrying ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.bootErrorButtonLabel}>{t.auth.retry}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  } else if (authStatus === "loading") {
    content = <LoadingScreen />;
  } else {
    content = (
      <NavigationContainer ref={navigationRef}>
        <TabNavigator />
        <Modal visible={isAuthModalOpen} animationType="slide" onRequestClose={closeAuthModal}>
          <Pressable style={styles.modalClose} onPress={closeAuthModal} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.icon} />
          </Pressable>
          <AuthScreen />
        </Modal>
      </NavigationContainer>
    );
  }

  return (
    <>
      {content}
      {showIntro ? <WelcomeIntro onFinish={handleIntroFinish} /> : null}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bootErrorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.background },
    bootErrorTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginTop: 14, textAlign: "center" },
    bootErrorBody: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: "center" },
    bootErrorButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 28,
      marginTop: 20,
      minWidth: 140,
      alignItems: "center"
    },
    bootErrorButtonLabel: { color: colors.textInverse, fontSize: 14, fontWeight: "700" },
    modalClose: {
      position: "absolute",
      top: 56,
      right: 20,
      zIndex: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface
    }
  });
}
