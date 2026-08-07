import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import type { Poi, Season } from "@/entities/poi/model/types";
import { API_ORIGIN } from "@/shared/api/client";
import { submitPoiReport } from "@/shared/api/reports";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { CategoryIcon } from "@/components/CategoryIcon";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { resolveOfflinePhotoUri } from "@/shared/map/offline-maps";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type PoiDetailSheetProps = {
  poi: Poi | null;
  onClose: () => void;
};

const seasons: Season[] = ["spring", "summer", "autumn", "winter"];
const seasonIconNames: Record<Season, keyof typeof Ionicons.glyphMap> = {
  spring: "flower-outline",
  summer: "sunny-outline",
  autumn: "leaf-outline",
  winter: "snow-outline"
};
const difficultyIconNames = {
  easy: "footsteps-outline",
  moderate: "walk-outline",
  active: "speedometer-outline"
} as const;

export function PoiDetailSheet({ poi, onClose }: PoiDetailSheetProps) {
  const pois = useExplorerStore((state) => state.pois);
  const categories = useExplorerStore((state) => state.categories);
  const favorites = useExplorerStore((state) => state.favorites);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const toggleVisited = useExplorerStore((state) => state.toggleVisited);
  const markPoiViewed = useExplorerStore((state) => state.markPoiViewed);
  const setSelectedPoiId = useExplorerStore((state) => state.setSelectedPoiId);
  const language = useExplorerStore((state) => state.language);
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState(false);

  useEffect(() => {
    if (poi) markPoiViewed(poi.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi?.id]);

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [poi?.id, selectedSeasons]);

  const regionPois = useMemo(() => (poi ? pois.filter((p) => p.regionId === poi.regionId) : []), [pois, poi]);

  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi?.id]);

  function closeSheet() {
    translateY.value = 0;
    handleClose();
  }

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 800) {
        runOnJS(closeSheet)();
      } else {
        translateY.value = withSpring(0, { damping: 30, stiffness: 400 });
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  if (!poi) return null;

  const isFavorite = favorites.includes(poi.id);
  const isVisited = visitedPoiIds.includes(poi.id);
  const poiName = poi.nameByLanguage?.[language] ?? poi.name;
  const description = poi.descriptionByLanguage?.[language] ?? poi.description;
  const bestTime = (poi.bestTimeByLanguage?.[language]?.length ? poi.bestTimeByLanguage[language]! : poi.bestTime) ?? [];
  const category = categories.find((c) => c.id === poi.category);

  const seasonFilteredPhotos =
    selectedSeasons.length === 0 ? poi.photos : poi.photos.filter((photo) => !photo.season || selectedSeasons.includes(photo.season));
  const displayPhotos = seasonFilteredPhotos.length > 0 ? seasonFilteredPhotos : poi.photos;
  const hasSeasonSpecificMatch = selectedSeasons.length > 0 && poi.photos.some((photo) => photo.season && selectedSeasons.includes(photo.season));
  const showSeasonFallbackHint = selectedSeasons.length > 0 && !hasSeasonSpecificMatch;
  const activePhoto = displayPhotos[activePhotoIndex] ?? displayPhotos[0];

  const currentIndex = regionPois.findIndex((p) => p.id === poi.id);
  const hasMultiplePlaces = regionPois.length > 1 && currentIndex !== -1;

  function toggleSeason(season: Season) {
    setSelectedSeasons((prev) => (prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]));
  }

  function goToOffset(offset: number) {
    if (!hasMultiplePlaces) return;
    const nextIndex = (currentIndex + offset + regionPois.length) % regionPois.length;
    setSelectedPoiId(regionPois[nextIndex].id);
  }

  async function handleShare() {
    try {
      await Share.share({ message: `${poiName} — ${API_ORIGIN}/?poi=${poi!.id}` });
    } catch {
      // user dismissed the share sheet; nothing to do
    }
  }

  function handleClose() {
    setIsReportOpen(false);
    setReportMessage("");
    setReportSent(false);
    setReportError(false);
    onClose();
  }

  async function handleSubmitReport() {
    if (!reportMessage.trim() || isSendingReport) return;
    setIsSendingReport(true);
    setReportError(false);
    try {
      await submitPoiReport(poi!.id, reportMessage.trim());
      setReportSent(true);
    } catch {
      setReportError(true);
    } finally {
      setIsSendingReport(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View style={[styles.sheet, sheetAnimatedStyle]}>
          <GestureDetector gesture={panGesture}>
            <View style={styles.handleTouchArea}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>
          <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.photoBox}>
            {activePhoto ? (
              <Image key={activePhoto.id} source={{ uri: resolveOfflinePhotoUri(activePhoto.id, activePhoto.url) }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <Ionicons name="location-outline" size={28} color={colors.textTertiary} />
              </View>
            )}
            <View style={styles.photoGradient} />

            {activePhoto?.author ? <Text style={styles.photoAuthor}>© {activePhoto.author}</Text> : null}

            {displayPhotos.length > 1 ? (
              <View style={styles.thumbnailRow}>
                {displayPhotos.map((photo, index) => (
                  <AnimatedPressable key={photo.id} onPress={() => setActivePhotoIndex(index)} scaleTo={0.9}>
                    <Image
                      source={{ uri: resolveOfflinePhotoUri(photo.id, photo.url) }}
                      style={[styles.thumbnail, index === activePhotoIndex && styles.thumbnailActive]}
                    />
                  </AnimatedPressable>
                ))}
              </View>
            ) : null}

            <View style={styles.badgeRow}>
              {poi.mustVisit ? (
                <View style={styles.badge}>
                  <Ionicons name="sparkles" size={11} color="#1a1a1a" />
                  <Text style={styles.badgeLabel}>{t.app.mustVisit}</Text>
                </View>
              ) : null}
              <View style={styles.badge}>
                <Ionicons name="camera" size={11} color="#1a1a1a" />
                <Text style={styles.badgeLabel}>
                  {t.app.photo} {poi.photos.length}
                </Text>
              </View>
            </View>

            <View style={styles.photoTitleBox}>
              <Text style={styles.photoTitle} numberOfLines={2}>
                {poiName}
              </Text>
              <View style={styles.photoStatsRow}>
                {poi.favoritesCount > 0 ? (
                  <View style={styles.photoStatChip}>
                    <Ionicons name="heart" size={12} color="#fff" />
                    <Text style={styles.photoStatLabel}>{poi.favoritesCount}</Text>
                  </View>
                ) : null}
                <View style={styles.photoStatChip}>
                  <Text style={styles.photoStatLabel}>{t.difficulty[poi.difficulty]}</Text>
                </View>
              </View>
            </View>

            <AnimatedPressable style={styles.closeButton} onPress={handleClose} scaleTo={0.85} haptic={false}>
              <Ionicons name="close" size={16} color="#fff" />
            </AnimatedPressable>
          </View>

          <View style={styles.seasonRow}>
            {seasons.map((season) => {
              const isActive = selectedSeasons.includes(season);
              return (
                <AnimatedPressable
                  key={season}
                  style={[styles.seasonChip, isActive && styles.seasonChipActive]}
                  onPress={() => toggleSeason(season)}
                  scaleTo={0.94}
                >
                  <Ionicons name={seasonIconNames[season]} size={12} color={isActive ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.seasonChipLabel, isActive && styles.seasonChipLabelActive]}>{t.season[season]}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
          {showSeasonFallbackHint ? <Text style={styles.seasonHint}>{t.app.noSeasonPhotoHint}</Text> : null}

          <View style={styles.content}>
            <View style={styles.actionsRow}>
              <AnimatedPressable
                style={[styles.actionButton, isFavorite && styles.actionButtonActive]}
                onPress={() => toggleFavorite(poi.id)}
                scaleTo={0.93}
              >
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={isFavorite ? colors.textInverse : colors.primary} />
                <Text style={[styles.actionLabel, isFavorite && styles.actionLabelActive]}>{t.app.save}</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.actionButton, isVisited && styles.actionButtonActive]}
                onPress={() => toggleVisited(poi.id)}
                scaleTo={0.93}
              >
                <Ionicons
                  name={isVisited ? "checkmark-circle" : "checkmark-circle-outline"}
                  size={18}
                  color={isVisited ? colors.textInverse : colors.primary}
                />
                <Text style={[styles.actionLabel, isVisited && styles.actionLabelActive]}>{t.app.visited}</Text>
              </AnimatedPressable>
            </View>

            {description ? <Text style={styles.description}>{description}</Text> : null}

            <View style={styles.metricsRow}>
              <View style={styles.metricTile}>
                <Ionicons name="sunny-outline" size={16} color={colors.primary} />
                <Text style={styles.metricLabel}>{t.app.best}</Text>
                <Text style={styles.metricValue} numberOfLines={1}>
                  {bestTime[0] ?? "—"}
                </Text>
              </View>
              <View style={styles.metricTile}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.metricLabel}>{t.app.duration}</Text>
                <Text style={styles.metricValue} numberOfLines={1}>
                  {poi.durationMinutes}
                  {t.app.minutesShort}
                </Text>
              </View>
              <View style={styles.metricTile}>
                <Ionicons name={difficultyIconNames[poi.difficulty]} size={16} color={colors.primary} />
                <Text style={styles.metricLabel}>{t.app.effort}</Text>
                <Text style={styles.metricValue} numberOfLines={1}>
                  {t.difficulty[poi.difficulty]}
                </Text>
              </View>
            </View>

            {bestTime.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.app.bestTime}</Text>
                <View style={styles.chipWrap}>
                  {bestTime.map((time) => (
                    <View key={time} style={styles.plainChip}>
                      <Text style={styles.plainChipLabel}>{time}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.app.signals}</Text>
              <View style={styles.chipWrap}>
                {category ? (
                  <View style={styles.plainChip}>
                    <CategoryIcon icon={category.icon} size={11} color={colors.icon} />
                    <Text style={styles.plainChipLabel}>{category.nameByLanguage[language] ?? category.name}</Text>
                  </View>
                ) : null}
                {poi.tags.map((tag) => (
                  <View key={tag} style={styles.plainChip}>
                    <Text style={styles.plainChipLabel}>{t.tag[tag]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {hasMultiplePlaces ? (
            <View style={styles.navRow}>
              <AnimatedPressable style={styles.navButton} onPress={() => goToOffset(-1)} haptic={false}>
                <Ionicons name="chevron-back" size={16} color={colors.icon} />
                <Text style={styles.navButtonLabel}>{t.app.previousPlace}</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.navButton} onPress={() => goToOffset(1)} haptic={false}>
                <Text style={styles.navButtonLabel}>{t.app.nextPlace}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.icon} />
              </AnimatedPressable>
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <AnimatedPressable style={styles.footerButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.footerButtonLabel}>{t.app.share}</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.footerButton} onPress={() => setIsReportOpen(true)}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.footerButtonLabel}>{t.report.cta}</Text>
            </AnimatedPressable>
          </View>
          </ScrollView>
        </Animated.View>
      </GestureHandlerRootView>

      <Modal visible={isReportOpen} transparent animationType="fade" onRequestClose={() => setIsReportOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsReportOpen(false)}>
          <View style={styles.reportCard} onStartShouldSetResponder={() => true}>
            {reportSent ? (
              <>
                <Text style={styles.reportTitle}>{t.report.thanks}</Text>
                <AnimatedPressable style={styles.reportSubmitButton} onPress={() => setIsReportOpen(false)}>
                  <Text style={styles.reportSubmitLabel}>{t.report.close}</Text>
                </AnimatedPressable>
              </>
            ) : (
              <>
                <Text style={styles.reportTitle}>{t.report.title}</Text>
                <TextInput
                  style={styles.reportInput}
                  placeholder={t.report.placeholder}
                  value={reportMessage}
                  onChangeText={setReportMessage}
                  multiline
                  numberOfLines={4}
                />
                {reportError ? <Text style={styles.reportError}>{t.report.error}</Text> : null}
                <View style={styles.reportActionsRow}>
                  <AnimatedPressable style={styles.reportCancelButton} onPress={() => setIsReportOpen(false)}>
                    <Text style={styles.reportCancelLabel}>{t.report.cancel}</Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={styles.reportSubmitButton}
                    onPress={handleSubmitReport}
                    disabled={isSendingReport || !reportMessage.trim()}
                  >
                    {isSendingReport ? (
                      <ActivityIndicator color={colors.textInverse} size="small" />
                    ) : (
                      <Text style={styles.reportSubmitLabel}>{t.report.submit}</Text>
                    )}
                  </AnimatedPressable>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  gestureRoot: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", padding: 24 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  handleTouchArea: { alignItems: "center", width: "100%", paddingTop: 12, paddingBottom: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border },
  photoBox: { height: 260, marginHorizontal: 12, borderRadius: 14, overflow: "hidden", backgroundColor: colors.divider },
  photo: { width: "100%", height: "100%" },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  photoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: "rgba(0,0,0,0.45)"
  },
  photoAuthor: { position: "absolute", bottom: 6, right: 12, fontSize: 10, color: "rgba(255,255,255,0.75)" },
  thumbnailRow: { position: "absolute", left: 14, top: 52, flexDirection: "row", gap: 6 },
  thumbnail: { width: 34, height: 34, borderRadius: 6, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  thumbnailActive: { borderColor: "#fff" },
  badgeRow: { position: "absolute", left: 14, top: 12, flexDirection: "row", gap: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  badgeLabel: { fontSize: 10, fontWeight: "700", color: "#1a1a1a" },
  photoTitleBox: { position: "absolute", left: 16, right: 16, bottom: 14 },
  photoTitle: { fontSize: 21, fontWeight: "800", color: "#fff" },
  photoStatsRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  photoStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  photoStatLabel: { fontSize: 11, fontWeight: "600", color: "#fff", textTransform: "capitalize" },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center"
  },
  seasonRow: { flexDirection: "row", gap: 6, paddingHorizontal: 16, marginTop: 10 },
  seasonChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  seasonChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  seasonChipLabel: { fontSize: 10, fontWeight: "600", color: colors.textTertiary },
  seasonChipLabelActive: { color: colors.primary },
  seasonHint: { fontSize: 11, color: colors.textTertiary, marginTop: 6, marginHorizontal: 16 },
  content: { padding: 18 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 11
  },
  actionButtonActive: { backgroundColor: colors.primary },
  actionLabel: { fontSize: 13, fontWeight: "600", color: colors.primary },
  actionLabelActive: { color: colors.textInverse },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  metricsRow: { flexDirection: "row", gap: 8, marginTop: 20 },
  metricTile: { flex: 1, borderWidth: 1, borderColor: colors.divider, borderRadius: 10, padding: 10, gap: 4 },
  metricLabel: { fontSize: 9, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.4 },
  metricValue: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  plainChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  plainChipLabel: { fontSize: 12, color: colors.textSecondary, textTransform: "capitalize" },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider
  },
  navButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  navButtonLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  footerRow: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider
  },
  footerButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerButtonLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  reportCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 18 },
  reportTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 },
  reportInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: "top",
    color: colors.textPrimary
  },
  reportError: { fontSize: 12, color: colors.danger, marginTop: 8 },
  reportActionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  reportCancelButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 11 },
  reportCancelLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  reportSubmitButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 11
  },
  reportSubmitLabel: { fontSize: 13, fontWeight: "700", color: colors.textInverse }
  });
}
