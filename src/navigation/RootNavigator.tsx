import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, PermissionsAndroid, Platform, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationManager } from "@maplibre/maplibre-react-native";
import * as Notifications from "expo-notifications";
import { getBootstrap } from "@/shared/api/bootstrap";
import { getMe } from "@/shared/api/auth";
import { registerPushTokenApi } from "@/shared/api/push-notifications";
import { useExplorerStore, waitForStoreHydration } from "@/shared/model/explorer-store";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { requestDevicePushToken } from "@/shared/notifications/push";
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
  const insets = useSafeAreaInsets();
  const authStatus = useExplorerStore((state) => state.authStatus);
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const setBootstrapData = useExplorerStore((state) => state.setBootstrapData);
  const setPushToken = useExplorerStore((state) => state.setPushToken);
  const isAuthModalOpen = useExplorerStore((state) => state.isAuthModalOpen);
  const closeAuthModal = useExplorerStore((state) => state.closeAuthModal);
  const isNearbyAlertsEnabled = useExplorerStore((state) => state.isNearbyAlertsEnabled);
  const isOffline = useExplorerStore((state) => state.isOffline);
  const setIsOffline = useExplorerStore((state) => state.setIsOffline);
  const setHasPreciseLocation = useExplorerStore((state) => state.setHasPreciseLocation);
  const flushPendingPoiActions = useExplorerStore((state) => state.flushPendingPoiActions);
  const favorites = useExplorerStore((state) => state.favorites);
  const pois = useExplorerStore((state) => state.pois);
  const language = useExplorerStore((state) => state.language);
  const setActiveRegion = useExplorerStore((state) => state.setActiveRegion);
  const setSelectedPoiId = useExplorerStore((state) => state.setSelectedPoiId);
  const hasRequestedPushPermission = useRef(false);
  const [bootError, setBootError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  function handleIntroFinish() {
    setShowIntro(false);
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
      setIsOffline(false);
      setBootError(false);
      flushPendingPoiActions();
    } catch {
      // Network/server failure — fall back to whatever reference data is
      // cached on-device (see explorer-store's persist partialize) instead
      // of hard-blocking the whole app. Only show the error screen when
      // there's truly nothing to fall back to (e.g. very first launch with
      // no network). hasHydrated may not have flipped yet if AsyncStorage
      // hasn't finished reading, so wait for it before deciding.
      await waitForStoreHydration();
      const hasCachedData = useExplorerStore.getState().regions.length > 0;
      if (hasCachedData) {
        hydrateAuth(null);
        setIsOffline(true);
        setBootError(false);
      } else {
        setBootError(true);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [hydrateAuth, setBootstrapData, setIsOffline, flushPendingPoiActions]);

  useEffect(() => {
    loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While running on cached data with no network, periodically retry the
  // bootstrap fetch in the background so the app recovers on its own once
  // connectivity returns, instead of requiring a manual restart.
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => {
      loadBootstrap();
    }, 20000);
    return () => clearInterval(interval);
  }, [isOffline, loadBootstrap]);

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

  useEffect(() => {
    if (!isNearbyAlertsEnabled) return;
    const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
    refreshNearbyGeofences(favoritePois, language).catch(() => {});
  }, [isNearbyAlertsEnabled, favorites, pois, language]);

  useEffect(() => {
    function handleNotificationResponse(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data as { type?: string; poiId?: string; regionId?: string };
      if (data?.type !== NEARBY_POI_NOTIFICATION_TYPE || !data.poiId) return;
      if (data.regionId) setActiveRegion(data.regionId);
      setSelectedPoiId(data.poiId);
      if (navigationRef.isReady()) navigationRef.navigate("Map");
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, [setActiveRegion, setSelectedPoiId]);

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
      {isOffline && !bootError ? (
        <View style={[styles.offlineBanner, { top: insets.top + 8 }]} pointerEvents="none">
          <Ionicons name="cloud-offline-outline" size={14} color="#ffffff" />
          <Text style={styles.offlineBannerText}>
            {t.auth.offlineModeBanner} · {pois.length}
          </Text>
        </View>
      ) : null}
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
    },
    offlineBanner: {
      position: "absolute",
      left: 16,
      right: 16,
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "#e8672e",
      borderRadius: 20,
      paddingVertical: 9,
      paddingHorizontal: 14,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 6
    },
    offlineBannerText: { color: "#ffffff", fontSize: 13, fontWeight: "800" }
  });
}
