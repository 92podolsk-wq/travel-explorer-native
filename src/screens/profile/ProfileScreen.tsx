import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, Linking, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { TextInput } from "@/shared/ui/AppTextInput";
import { Image } from "expo-image";
import { avatarIds } from "@/entities/user/model/avatars";
import { revokeToken, updateAvatar, updateProfile } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";
import { AnimatedCenterModal } from "@/components/AnimatedModal";
import { registerPushTokenApi, unregisterPushTokenApi } from "@/shared/api/push-notifications";
import { useTranslations } from "@/shared/i18n/useTranslations";
import {
  clearAllOfflinePhotoCache,
  deleteRegionOffline,
  deleteRegionPhotos,
  getOfflineStorageBytesByRegion,
  resolveOfflinePhotoUri
} from "@/shared/map/offline-maps";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { getNotificationPermissionStatus, requestDevicePushToken } from "@/shared/notifications/push";
import { clearToken, getToken } from "@/shared/storage/token-storage";
import { getUnreadNotificationCount } from "@/shared/storage/notification-history";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { refreshNearbyGeofences, requestNearbyAlertsPermissions, stopNearbyGeofencing } from "@/shared/geofencing/manage-geofences";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { LanguagePickerModal, LANGUAGE_LABELS } from "@/components/LanguagePickerModal";
import { NotificationHistoryModal } from "@/components/NotificationHistoryModal";
import { PackingChecklistCard } from "@/components/profile/PackingChecklistCard";
import { FriendsCard } from "@/components/profile/FriendsCard";
import { SharedChecklistsCard } from "@/components/profile/SharedChecklistsCard";
import { SharedItinerariesCard } from "@/components/profile/SharedItinerariesCard";
import { SharedTripModal } from "@/components/SharedTripModal";

const APP_VERSION = "1.0.0";

export function ProfileScreen() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const currentUser = useExplorerStore((state) => state.currentUser);
  const language = useExplorerStore((state) => state.language);
  const setLanguage = useExplorerStore((state) => state.setLanguage);
  const themeMode = useExplorerStore((state) => state.themeMode);
  const setThemeMode = useExplorerStore((state) => state.setThemeMode);
  const distanceUnit = useExplorerStore((state) => state.distanceUnit);
  const setDistanceUnit = useExplorerStore((state) => state.setDistanceUnit);
  const setAvatarId = useExplorerStore((state) => state.setAvatarId);
  const logout = useExplorerStore((state) => state.logout);
  const regions = useExplorerStore((state) => state.regions);
  const pois = useExplorerStore((state) => state.pois);
  const pushToken = useExplorerStore((state) => state.pushToken);
  const setPushToken = useExplorerStore((state) => state.setPushToken);
  const openAuthModal = useExplorerStore((state) => state.openAuthModal);
  const favorites = useExplorerStore((state) => state.favorites);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const itineraries = useExplorerStore((state) => state.itineraries);
  const isNearbyAlertsEnabled = useExplorerStore((state) => state.isNearbyAlertsEnabled);
  const setNearbyAlertsEnabled = useExplorerStore((state) => state.setNearbyAlertsEnabled);
  const downloadedRegionIds = useExplorerStore((state) => state.downloadedRegionIds);
  const setDownloadedRegionIds = useExplorerStore((state) => state.setDownloadedRegionIds);

  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);

  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hideFromSearchDraft, setHideFromSearchDraft] = useState(false);
  const [openSharedTripId, setOpenSharedTripId] = useState<string | null>(null);
  const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
  const [isNotificationHistoryOpen, setIsNotificationHistoryOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const [isTogglingNearbyAlerts, setIsTogglingNearbyAlerts] = useState(false);
  const [regionBytes, setRegionBytes] = useState<Record<string, number>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getOfflineStorageBytesByRegion(downloadedRegionIds, pois).then(setRegionBytes);
  }, [downloadedRegionIds, pois]);

  useFocusEffect(
    useCallback(() => {
      getUnreadNotificationCount().then(setUnreadCount);
    }, [])
  );

  async function handleSelectAvatar(avatarId: string) {
    setAvatarId(avatarId);
    setIsAvatarPickerOpen(false);
    updateAvatar(avatarId).catch(() => {});
  }

  function handleStartEditProfile() {
    setNameDraft(currentUser?.name ?? "");
    setUsernameDraft(currentUser?.username ?? "");
    setHideFromSearchDraft(currentUser?.hideFromSearch ?? false);
    setProfileError(null);
    setIsEditProfileOpen(true);
  }

  async function handleSaveProfile() {
    setProfileError(null);
    setIsSavingProfile(true);
    try {
      const { user } = await updateProfile(nameDraft, usernameDraft, hideFromSearchDraft);
      hydrateAuth(user);
      setIsEditProfileOpen(false);
    } catch (err) {
      const serverMessage = err instanceof ApiError && (err.body as { error?: string } | null)?.error;
      setProfileError(serverMessage || t.auth.registerError);
    } finally {
      setIsSavingProfile(false);
    }
  }

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

  async function handleToggleNearbyAlerts(value: boolean) {
    setIsTogglingNearbyAlerts(true);
    try {
      if (value) {
        const granted = await requestNearbyAlertsPermissions();
        if (!granted) {
          Alert.alert(t.auth.nearbyAlertsPermissionDenied, t.auth.nearbyAlertsPermissionHint, [
            { text: t.auth.cancel, style: "cancel" },
            { text: t.auth.openSettings, onPress: () => Linking.openSettings() }
          ]);
          return;
        }
        setNearbyAlertsEnabled(true);
        const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
        await refreshNearbyGeofences(favoritePois, language);
      } else {
        setNearbyAlertsEnabled(false);
        await stopNearbyGeofencing();
      }
    } finally {
      setIsTogglingNearbyAlerts(false);
    }
  }

  function handleDeleteRegion(regionId: string, regionName: string) {
    Alert.alert(t.auth.offlineMapDeleteConfirm.replace("{name}", regionName), t.auth.offlineMapDeleteConfirmBody, [
      { text: t.auth.cancel, style: "cancel" },
      {
        text: t.auth.delete,
        style: "destructive",
        onPress: async () => {
          await deleteRegionOffline(regionId);
          deleteRegionPhotos(pois.filter((p) => p.regionId === regionId));
          setDownloadedRegionIds(downloadedRegionIds.filter((id) => id !== regionId));
        }
      }
    ]);
  }

  function handleRegionMenu(regionId: string, regionName: string) {
    Alert.alert(regionName, undefined, [
      { text: t.auth.cancel, style: "cancel" },
      { text: t.auth.offlineMapDelete, style: "destructive", onPress: () => handleDeleteRegion(regionId, regionName) }
    ]);
  }

  function handleOfflineInfo() {
    Alert.alert(t.auth.offlineMapsTitle, t.auth.offlineMapsInfoHint);
  }

  function handleClearCache() {
    Alert.alert(t.auth.clearCacheConfirmTitle, t.auth.clearCacheConfirmBody, [
      { text: t.auth.cancel, style: "cancel" },
      {
        text: t.auth.clearCache,
        style: "destructive",
        onPress: () => {
          clearAllOfflinePhotoCache();
          Alert.alert(t.auth.clearCacheDone);
        }
      }
    ]);
  }

  function handleResetSettings() {
    Alert.alert(t.auth.resetSettingsConfirmTitle, t.auth.resetSettingsConfirmBody, [
      { text: t.auth.cancel, style: "cancel" },
      {
        text: t.auth.resetSettings,
        style: "destructive",
        onPress: async () => {
          setThemeMode("system");
          setLanguage("ru");
          setDistanceUnit("km");
          if (isNearbyAlertsEnabled) {
            setNearbyAlertsEnabled(false);
            await stopNearbyGeofencing();
          }
        }
      }
    ]);
  }

  function handleSupportEmail() {
    Linking.openURL("mailto:support@wayora.ru").catch(() => {});
  }

  function handleOpenWebsite() {
    Linking.openURL("https://wayora.ru").catch(() => {});
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    const token = await getToken();
    if (token) revokeToken(token).catch(() => {});
    await clearToken();
    logout();
  }

  function handleLogoutPress() {
    Alert.alert(t.auth.logoutConfirmTitle, t.auth.logoutConfirmBody, [
      { text: t.auth.cancel, style: "cancel" },
      { text: t.auth.logout, style: "destructive", onPress: handleLogout }
    ]);
  }

  function regionThumbnail(regionId: string): string | null {
    const regionPois = pois.filter((p) => p.regionId === regionId && p.photos.length > 0);
    const photo = [...regionPois].sort((a, b) => b.importance - a.importance)[0]?.photos[0];
    return photo ? resolveOfflinePhotoUri(photo.id, photo.url) : null;
  }

  const downloadedRegions = regions.filter((region) => downloadedRegionIds.includes(region.id));
  const totalOfflineBytes = Object.values(regionBytes).reduce((sum, bytes) => sum + bytes, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[colors.heroGradientStart, colors.heroGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.heroDecorCircleLarge} pointerEvents="none" />
        <View style={styles.heroDecorCircleSmall} pointerEvents="none" />

        <TouchableOpacity style={styles.bellButton} onPress={() => setIsNotificationHistoryOpen(true)}>
          <Ionicons name="notifications-outline" size={20} color={colors.heroText} />
          {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
        </TouchableOpacity>

        {currentUser ? (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setIsAvatarPickerOpen((v) => !v)} style={styles.avatarTouchable}>
              <View style={styles.avatarRing}>
                <ProfileAvatar avatarId={currentUser.avatarId} size={60} />
              </View>
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={10} color={colors.textInverse} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleStartEditProfile}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{currentUser.name || currentUser.email}</Text>
                <View style={styles.travelerBadge}>
                  <Text style={styles.travelerBadgeLabel}>{t.auth.travelerBadge}</Text>
                </View>
                <Ionicons name="pencil" size={11} color={colors.heroTextMuted} />
              </View>
              <Text style={styles.email}>@{currentUser.username}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.header}>
            <View style={styles.guestAvatar}>
              <Ionicons name="person-outline" size={28} color={colors.heroText} />
            </View>
            <Text style={styles.guestPrompt}>{t.auth.guestPrompt}</Text>
            <TouchableOpacity style={styles.guestLoginButton} onPress={openAuthModal}>
              <Text style={styles.guestLoginLabel}>{t.auth.login}</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {currentUser ? (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={18} color={colors.primary} />
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>{t.auth.statsSaved}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.statValue}>{visitedPoiIds.length}</Text>
            <Text style={styles.statLabel}>{t.app.visited}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="map-outline" size={18} color={colors.primary} />
            <Text style={styles.statValue}>{itineraries.length}</Text>
            <Text style={styles.statLabel}>{t.auth.statsRoutes}</Text>
          </View>
        </View>
      ) : null}

      {currentUser ? <FriendsCard /> : null}

      {currentUser ? <SharedChecklistsCard /> : null}

      {currentUser ? <SharedItinerariesCard onOpen={setOpenSharedTripId} /> : null}

      {isAvatarPickerOpen && currentUser ? (
        <View style={styles.avatarCard}>
          <Text style={styles.sectionTitle}>{t.auth.chooseAvatar}</Text>
          <View style={styles.avatarGrid}>
            {avatarIds.map((id) => (
              <TouchableOpacity
                key={id}
                onPress={() => handleSelectAvatar(id)}
                style={[styles.avatarOption, currentUser.avatarId === id && styles.avatarOptionSelected]}
              >
                <ProfileAvatar avatarId={id} size={44} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <TouchableOpacity style={styles.section} onPress={() => setIsLanguagePickerOpen(true)}>
        <View style={styles.languageRow}>
          <Ionicons name="globe-outline" size={18} color={colors.icon} />
          <Text style={[styles.sectionTitle, { flex: 1 }]}>{t.auth.languageTitle}</Text>
          <Text style={styles.languageValue}>{LANGUAGE_LABELS[language]}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.auth.notificationsCardTitle}</Text>
        <View style={styles.notificationRow}>
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationTitle}>{t.auth.pushNotificationsTitle}</Text>
            <Text style={styles.sectionSubtitle}>{t.auth.pushNotificationsHint}</Text>
          </View>
          <Switch value={pushToken != null} onValueChange={handleToggleNotifications} disabled={isTogglingNotifications} />
        </View>
        <View style={styles.notificationDivider} />
        <View style={styles.notificationRow}>
          <View style={styles.notificationIcon}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationTitle}>{t.auth.nearbyAlertsTitle}</Text>
            <Text style={styles.sectionSubtitle}>{t.auth.nearbyAlertsHint}</Text>
          </View>
          <Switch value={isNearbyAlertsEnabled} onValueChange={handleToggleNearbyAlerts} disabled={isTogglingNearbyAlerts} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.offlineHeaderRow}>
          <Text style={styles.sectionTitle}>{t.auth.offlineMapsTitle}</Text>
          <TouchableOpacity onPress={handleOfflineInfo} hitSlop={8}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionSubtitle}>{t.auth.offlineMapsHint}</Text>

        {downloadedRegions.length === 0 ? (
          <Text style={styles.offlineEmpty}>{t.auth.offlineMapsEmpty}</Text>
        ) : (
          <View style={{ marginTop: 10, gap: 10 }}>
            {downloadedRegions.map((region) => {
              const regionName = region.nameByLanguage[language] ?? region.name;
              const thumbnail = regionThumbnail(region.id);
              const mb = (regionBytes[region.id] ?? 0) / (1024 * 1024);
              return (
                <View key={region.id} style={styles.offlineRow}>
                  {thumbnail ? (
                    <Image source={{ uri: thumbnail }} style={styles.offlineThumbnail} contentFit="cover" />
                  ) : (
                    <View style={[styles.offlineThumbnail, styles.offlineThumbnailFallback]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offlineRegionName} numberOfLines={1}>
                      {regionName}
                    </Text>
                    <Text style={styles.offlineRegionSize}>{mb.toFixed(0)} МБ</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  <TouchableOpacity onPress={() => handleRegionMenu(region.id, regionName)} hitSlop={8} style={styles.offlineMenuButton}>
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {downloadedRegions.length > 0 ? (
          <Text style={styles.offlineSummary}>
            {t.auth.offlineMapsDownloadedSummary
              .replace("{count}", String(downloadedRegions.length))
              .replace("{total}", String(regions.length))
              .replace("{size}", (totalOfflineBytes / (1024 * 1024)).toFixed(0))}
          </Text>
        ) : null}
      </View>

      <PackingChecklistCard />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.auth.appSettingsTitle}</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t.auth.themeTitle}</Text>
          <View style={styles.segmentGroup}>
            {(
              [
                { value: "light" as const, label: t.auth.themeLight },
                { value: "dark" as const, label: t.auth.themeDark },
                { value: "system" as const, label: t.auth.themeSystem }
              ]
            ).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.segment, themeMode === option.value && styles.segmentActive]}
                onPress={() => setThemeMode(option.value)}
              >
                <Text style={[styles.segmentLabel, themeMode === option.value && styles.segmentLabelActive]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.notificationDivider} />
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t.auth.unitsTitle}</Text>
          <View style={styles.segmentGroup}>
            {(
              [
                { value: "km" as const, label: t.auth.unitsKm },
                { value: "mi" as const, label: t.auth.unitsMi }
              ]
            ).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.segment, distanceUnit === option.value && styles.segmentActive]}
                onPress={() => setDistanceUnit(option.value)}
              >
                <Text style={[styles.segmentLabel, distanceUnit === option.value && styles.segmentLabelActive]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.auth.storageTitle}</Text>
        <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
          <Ionicons name="trash-outline" size={16} color={colors.icon} />
          <Text style={styles.actionRowLabel}>{t.auth.clearCache}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
        <View style={styles.notificationDivider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleResetSettings}>
          <Ionicons name="refresh-outline" size={16} color={colors.danger} />
          <Text style={[styles.actionRowLabel, { color: colors.danger }]}>{t.auth.resetSettings}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.auth.aboutTitle}</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.settingLabel}>Wayora</Text>
          <Text style={styles.aboutValue}>
            {t.auth.aboutVersion} {APP_VERSION}
          </Text>
        </View>
        <View style={styles.notificationDivider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleSupportEmail}>
          <Ionicons name="mail-outline" size={16} color={colors.icon} />
          <Text style={styles.actionRowLabel}>{t.auth.aboutSupport}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
        <View style={styles.notificationDivider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleOpenWebsite}>
          <Ionicons name="globe-outline" size={16} color={colors.icon} />
          <Text style={styles.actionRowLabel}>{t.auth.aboutWebsite}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {currentUser ? (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress} disabled={isLoggingOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutLabel}>{t.auth.logout}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.danger} style={styles.logoutChevron} />
        </TouchableOpacity>
      ) : null}

      <LanguagePickerModal
        visible={isLanguagePickerOpen}
        language={language}
        onSelect={setLanguage}
        onClose={() => setIsLanguagePickerOpen(false)}
      />
      <NotificationHistoryModal visible={isNotificationHistoryOpen} onClose={() => setIsNotificationHistoryOpen(false)} />

      <AnimatedCenterModal
        visible={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        backdropColor="rgba(0,0,0,0.4)"
        contentStyle={styles.editProfileCard}
      >
        <Text style={styles.sectionTitle}>{t.auth.editProfile}</Text>
        <Text style={[styles.settingLabel, { marginTop: 12 }]}>{t.auth.name}</Text>
        <TextInput style={styles.editProfileInput} value={nameDraft} onChangeText={setNameDraft} autoCapitalize="words" />
        <Text style={[styles.settingLabel, { marginTop: 10 }]}>{t.auth.username}</Text>
        <TextInput
          style={styles.editProfileInput}
          value={usernameDraft}
          onChangeText={(value) => setUsernameDraft(value.toLowerCase())}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.sectionSubtitle}>{t.auth.usernameHint}</Text>
        <View style={styles.hideFromSearchRow}>
          <Text style={[styles.settingLabel, { flex: 1 }]}>{t.auth.hideFromSearch}</Text>
          <Switch value={hideFromSearchDraft} onValueChange={setHideFromSearchDraft} />
        </View>
        {profileError ? <Text style={[styles.sectionSubtitle, { color: colors.danger, marginTop: 6 }]}>{profileError}</Text> : null}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <TouchableOpacity onPress={() => setIsEditProfileOpen(false)} style={styles.editProfileCancelButton}>
            <Text style={styles.editProfileCancelLabel}>{t.auth.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void handleSaveProfile()} disabled={isSavingProfile} style={styles.editProfileSaveButton}>
            <Text style={styles.editProfileSaveLabel}>{t.auth.save}</Text>
          </TouchableOpacity>
        </View>
      </AnimatedCenterModal>

      <SharedTripModal itineraryId={openSharedTripId} onClose={() => setOpenSharedTripId(null)} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    headerGradient: { borderRadius: 22, padding: 14, marginBottom: 16, overflow: "hidden" },
    heroDecorCircleLarge: {
      position: "absolute",
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: "rgba(255,255,255,0.07)",
      top: -60,
      right: -40
    },
    heroDecorCircleSmall: {
      position: "absolute",
      width: 75,
      height: 75,
      borderRadius: 38,
      backgroundColor: "rgba(255,255,255,0.06)",
      bottom: -24,
      left: -16
    },
    bellButton: {
      position: "absolute",
      right: 16,
      top: 16,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.14)"
    },
    bellDot: {
      position: "absolute",
      top: 6,
      right: 7,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#4fd88a",
      borderWidth: 1.5,
      borderColor: colors.heroGradientStart
    },
    header: { alignItems: "center" },
    avatarTouchable: { position: "relative" },
    avatarRing: { borderRadius: 34, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", padding: 2 },
    editBadge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.heroGradientStart
    },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
    name: { fontSize: 17, fontWeight: "800", color: colors.heroText },
    travelerBadge: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    travelerBadgeLabel: { fontSize: 11, fontWeight: "700", color: colors.heroText },
    email: { fontSize: 13, color: colors.heroTextMuted, marginTop: 1 },
    guestAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(255,255,255,0.14)",
      alignItems: "center",
      justifyContent: "center"
    },
    guestPrompt: { fontSize: 14, color: colors.heroTextMuted, marginTop: 10, textAlign: "center", paddingHorizontal: 20 },
    guestLoginButton: { backgroundColor: colors.heroText, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 32, marginTop: 10 },
    guestLoginLabel: { color: colors.heroGradientEnd, fontSize: 14, fontWeight: "700" },
    statsCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16
    },
    statItem: { flex: 1, alignItems: "center", gap: 4 },
    statDivider: { width: 1, height: 36, backgroundColor: colors.divider },
    statValue: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
    statLabel: { fontSize: 11, color: colors.textTertiary },
    avatarCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 16 },
    avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
    avatarOption: { borderRadius: 26, padding: 3, borderWidth: 2, borderColor: "transparent" },
    avatarOptionSelected: { borderColor: colors.primary },
    section: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
    sectionSubtitle: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
    languageRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    languageValue: { fontSize: 13, fontWeight: "600", color: colors.primary },
    notificationRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
    notificationIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center"
    },
    notificationTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
    notificationDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
    offlineHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    offlineEmpty: { fontSize: 12, color: colors.textTertiary, marginTop: 12, lineHeight: 17 },
    offlineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    offlineThumbnail: { width: 40, height: 40, borderRadius: 20 },
    offlineThumbnailFallback: { backgroundColor: colors.surfaceAlt },
    offlineRegionName: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
    offlineRegionSize: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
    offlineMenuButton: { marginLeft: 2 },
    offlineSummary: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginTop: 14 },
    settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
    settingLabel: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
    segmentGroup: { flexDirection: "row", backgroundColor: colors.background, borderRadius: 8, padding: 2, gap: 2 },
    segment: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    segmentActive: { backgroundColor: colors.primary },
    segmentLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
    segmentLabelActive: { color: colors.textInverse },
    actionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 },
    actionRowLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.textPrimary },
    aboutRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    aboutValue: { fontSize: 12, color: colors.textTertiary },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginTop: 4
    },
    logoutLabel: { fontSize: 14, fontWeight: "700", color: colors.danger },
    logoutChevron: { marginLeft: "auto" },
    editProfileCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 18 },
    hideFromSearchRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
    editProfileInput: {
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 4,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary
    },
    editProfileCancelButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
    editProfileCancelLabel: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
    editProfileSaveButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
    editProfileSaveLabel: { fontSize: 13, fontWeight: "700", color: colors.textInverse }
  });
}
