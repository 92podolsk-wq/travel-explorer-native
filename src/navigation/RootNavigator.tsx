import { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { AuthScreen } from "@/screens/auth/AuthScreen";
import { WelcomeIntro } from "@/components/WelcomeIntro";
import { TabNavigator, navigationRef } from "./TabNavigator";
import { useAppBootstrap } from "./hooks/useAppBootstrap";
import { useInitialPermissionsAndPush } from "./hooks/useInitialPermissionsAndPush";
import { useNearbyAlertsRefresh } from "./hooks/useNearbyAlertsRefresh";
import { useNotificationRouting } from "./hooks/useNotificationRouting";

export function RootNavigator() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const authStatus = useExplorerStore((state) => state.authStatus);
  const isAuthModalOpen = useExplorerStore((state) => state.isAuthModalOpen);
  const closeAuthModal = useExplorerStore((state) => state.closeAuthModal);
  const isOffline = useExplorerStore((state) => state.isOffline);
  const pois = useExplorerStore((state) => state.pois);
  const [showIntro, setShowIntro] = useState(true);

  const { bootError, isRetrying, handleRetry } = useAppBootstrap();
  useInitialPermissionsAndPush();
  useNearbyAlertsRefresh();
  useNotificationRouting();

  function handleIntroFinish() {
    setShowIntro(false);
  }

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
