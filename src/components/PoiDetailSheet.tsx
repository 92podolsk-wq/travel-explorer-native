import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, RefObject } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { TextInput } from "@/shared/ui/AppTextInput";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import type { Poi } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";
import { API_ORIGIN } from "@/shared/api/client";
import { submitPoiReport } from "@/shared/api/reports";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { haversineDistanceMeters } from "@/shared/lib/geo";
import { AnimatedCenterModal } from "@/components/AnimatedModal";
import { CategoryIcon } from "@/components/CategoryIcon";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { PhotoViewerModal } from "@/components/PhotoViewerModal";
import { resolveOfflinePhotoUri } from "@/shared/map/offline-maps";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type PoiDetailSheetProps = {
  poi: Poi | null;
  onClose: () => void;
};

const difficultyIconNames = {
  easy: "footsteps-outline",
  moderate: "walk-outline",
  active: "speedometer-outline"
} as const;

// Visible height of the sheet in its collapsed "peek" state — tall enough to
// still show the full photo hero (with title/badges) as a preview.
const PEEK_HEIGHT = 300;
const SPRING_CONFIG = { damping: 30, stiffness: 400 };
const ENTRANCE_SPRING = { damping: 32, stiffness: 280, mass: 0.9 };
const EXIT_DURATION = 220;
const SWIPE_NAV_THRESHOLD = 90;
const CARD_FLY_DISTANCE = 420;
const PHOTO_BOX_HEIGHT = 300;
const PHOTO_AUTO_ADVANCE_MS = 3000;

export function PoiDetailSheet({ poi: poiProp, onClose }: PoiDetailSheetProps) {
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
  const [photoBoxWidth, setPhotoBoxWidth] = useState(0);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const photoScrollRef = useRef<ScrollView>(null);
  const isPhotoDraggingRef = useRef(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState(false);

  useEffect(() => {
    if (poiProp) markPoiViewed(poiProp.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiProp?.id]);

  useEffect(() => {
    setActivePhotoIndex(0);
    photoScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [poiProp?.id]);

  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * 0.88;
  const peekOffset = Math.max(0, sheetHeight - PEEK_HEIGHT);

  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Keeps rendering the last POI while the sheet slides down and out, since
  // the parent clears its selection (and thus this prop) the instant the
  // user asks to close — without this the sheet would just vanish mid-swipe.
  const [renderedPoi, setRenderedPoi] = useState<Poi | null>(poiProp);

  // Tracks the chain of POIs visited via goForward/goBack within this sheet
  // session, so "next" always suggests the nearest place not yet seen and
  // "previous" can retrace the same path instead of a fixed list order.
  const [navHistory, setNavHistory] = useState<string[]>(poiProp ? [poiProp.id] : []);
  const isInternalNavRef = useRef(false);

  useEffect(() => {
    if (poiProp) {
      const isFreshOpen = renderedPoi === null;
      setRenderedPoi(poiProp);
      if (isFreshOpen) {
        translateY.value = sheetHeight;
        translateY.value = withSpring(0, ENTRANCE_SPRING);
        setNavHistory([poiProp.id]);
      } else if (isInternalNavRef.current) {
        isInternalNavRef.current = false;
        translateY.value = 0;
      } else {
        translateY.value = 0;
        setNavHistory([poiProp.id]);
      }
    } else if (renderedPoi) {
      translateY.value = withTiming(sheetHeight, { duration: EXIT_DURATION }, (finished) => {
        if (finished) runOnJS(setRenderedPoi)(null);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiProp?.id]);

  const poi = renderedPoi;
  const regionPois = useMemo(() => (poi ? pois.filter((p) => p.regionId === poi.regionId) : []), [pois, poi]);

  // Auto-advances the hero photo pager like an Instagram Story — 3s per
  // photo, looping back to the first — while the sheet is open. Paused
  // while the user is dragging the pager themselves or has opened the
  // fullscreen photo viewer (where they page through manually instead).
  useEffect(() => {
    const photoCount = poi?.photos.length ?? 0;
    if (!poi || photoBoxWidth === 0 || photoCount <= 1 || isPhotoViewerOpen) return;
    const timer = setTimeout(() => {
      if (isPhotoDraggingRef.current) return;
      const nextIndex = (activePhotoIndex + 1) % photoCount;
      photoScrollRef.current?.scrollTo({ x: nextIndex * photoBoxWidth, animated: true });
      setActivePhotoIndex(nextIndex);
    }, PHOTO_AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [poi, photoBoxWidth, activePhotoIndex, isPhotoViewerOpen]);

  // Computed eagerly (not just on release) so a peek preview of the
  // destination place can be shown while the user is still dragging.
  const nextPreviewPoi = useMemo(() => {
    if (!poi) return null;
    const visited = new Set(navHistory);
    let nearest: Poi | null = null;
    let nearestDistance = Infinity;
    for (const candidate of regionPois) {
      if (visited.has(candidate.id)) continue;
      const distance = haversineDistanceMeters(poi.coordinates, candidate.coordinates);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = candidate;
      }
    }
    return nearest;
  }, [poi, regionPois, navHistory]);

  const previousPreviewPoi = useMemo(() => {
    if (navHistory.length < 2) return null;
    const previousId = navHistory[navHistory.length - 2];
    return pois.find((p) => p.id === previousId) ?? null;
  }, [navHistory, pois]);

  const hasNextPlace = nextPreviewPoi !== null;
  const hasPreviousPlace = previousPreviewPoi !== null;

  function closeSheet() {
    handleClose();
  }

  // Suggests the nearest not-yet-seen place in the region, rather than the
  // next item in list order — swiping the card feels like walking toward
  // whatever is actually closest.
  function goForward() {
    if (!nextPreviewPoi) return;
    isInternalNavRef.current = true;
    setNavHistory((prev) => [...prev, nextPreviewPoi.id]);
    setSelectedPoiId(nextPreviewPoi.id);
  }

  function goBack() {
    if (!previousPreviewPoi) return;
    isInternalNavRef.current = true;
    setNavHistory((prev) => prev.slice(0, -1));
    setSelectedPoiId(previousPreviewPoi.id);
  }

  const cardX = useSharedValue(0);
  const nextPeekStyle = useAnimatedStyle(() => ({
    opacity: cardX.value < 0 ? Math.min(1, -cardX.value / CARD_FLY_DISTANCE) : 0
  }));
  const previousPeekStyle = useAnimatedStyle(() => ({
    opacity: cardX.value > 0 ? Math.min(1, cardX.value / CARD_FLY_DISTANCE) : 0
  }));

  const horizontalGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      cardX.value = event.translationX;
    })
    .onEnd((event) => {
      const flingingNext = event.velocityX < -800;
      const flingingPrevious = event.velocityX > 800;
      const pastNext = event.translationX < -SWIPE_NAV_THRESHOLD || flingingNext;
      const pastPrevious = event.translationX > SWIPE_NAV_THRESHOLD || flingingPrevious;
      if (pastNext && hasNextPlace) {
        cardX.value = withTiming(-CARD_FLY_DISTANCE, { duration: 180 }, (finished) => {
          if (finished) runOnJS(goForward)();
          cardX.value = 0;
        });
      } else if (pastPrevious && hasPreviousPlace) {
        cardX.value = withTiming(CARD_FLY_DISTANCE, { duration: 180 }, (finished) => {
          if (finished) runOnJS(goBack)();
          cardX.value = 0;
        });
      } else {
        cardX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-15, 15])
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const draggingDown = event.translationY > 0;
      // When the sheet is fully expanded, only let the drag move it once the
      // scrolled content is already back at the top — otherwise the gesture
      // scrolls the content instead, like any other bottom sheet.
      const atTop = scrollY.value <= 0;
      if (startY.value > 0 || !draggingDown || atTop) {
        translateY.value = Math.min(sheetHeight, Math.max(0, startY.value + event.translationY));
      }
    })
    .onEnd((event) => {
      const pastPeek = translateY.value > peekOffset + PEEK_HEIGHT * 0.5;
      const flickingDownFast = event.velocityY > 800;
      if (pastPeek || flickingDownFast) {
        runOnJS(closeSheet)();
        return;
      }
      const flickingUpFast = event.velocityY < -500;
      const closerToPeek = translateY.value > peekOffset / 2;
      if (!flickingUpFast && closerToPeek) {
        translateY.value = withSpring(peekOffset, SPRING_CONFIG);
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    })
    .simultaneousWithExternalGesture(scrollRef as unknown as RefObject<ComponentType>);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: cardX.value }]
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sheetHeight > 0 ? 1 - Math.min(1, Math.max(0, translateY.value / sheetHeight)) : 0
  }));

  if (!poi) return null;

  const isFavorite = favorites.includes(poi.id);
  const isVisited = visitedPoiIds.includes(poi.id);
  const poiName = poi.nameByLanguage?.[language] ?? poi.name;
  const description = poi.descriptionByLanguage?.[language] ?? poi.description;
  const bestTime = (poi.bestTimeByLanguage?.[language]?.length ? poi.bestTimeByLanguage[language]! : poi.bestTime) ?? [];
  const category = categories.find((c) => c.id === poi.category);

  const displayPhotos = poi.photos;
  const activePhoto = displayPhotos[activePhotoIndex] ?? displayPhotos[0];

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
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={styles.backdropTouch} onPress={handleClose} />
        </Animated.View>

        {nextPreviewPoi ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.peekCard, { top: windowHeight - sheetHeight, height: sheetHeight }, nextPeekStyle]}
          >
            <PeekCardHero poi={nextPreviewPoi} language={language} styles={styles} colors={colors} />
          </Animated.View>
        ) : null}
        {previousPreviewPoi ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.peekCard, { top: windowHeight - sheetHeight, height: sheetHeight }, previousPeekStyle]}
          >
            <PeekCardHero poi={previousPreviewPoi} language={language} styles={styles} colors={colors} />
          </Animated.View>
        ) : null}

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, { height: sheetHeight }, sheetAnimatedStyle]}>
            <Animated.ScrollView
              ref={scrollRef}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
          <View style={styles.photoBox} onLayout={(event) => setPhotoBoxWidth(event.nativeEvent.layout.width)}>
            {displayPhotos.length > 0 && photoBoxWidth > 0 ? (
              <ScrollView
                ref={photoScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScrollBeginDrag={() => {
                  isPhotoDraggingRef.current = true;
                }}
                onScrollEndDrag={() => {
                  isPhotoDraggingRef.current = false;
                }}
                onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / photoBoxWidth);
                  setActivePhotoIndex(index);
                }}
              >
                {displayPhotos.map((photo) => (
                  <Pressable key={photo.id} onPress={() => setIsPhotoViewerOpen(true)}>
                    <Image
                      source={{ uri: resolveOfflinePhotoUri(photo.id, photo.url) }}
                      style={[styles.photo, { width: photoBoxWidth }]}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <Ionicons name="location-outline" size={28} color={colors.textTertiary} />
              </View>
            )}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.72)"]}
              locations={[0, 1]}
              style={styles.photoGradient}
              pointerEvents="none"
            />

            {activePhoto?.author ? <Text style={styles.photoAuthor}>© {activePhoto.author}</Text> : null}

            {displayPhotos.length > 1 ? (
              <View style={styles.thumbnailRow}>
                {displayPhotos.map((photo, index) => (
                  <AnimatedPressable
                    key={photo.id}
                    onPress={() => {
                      setActivePhotoIndex(index);
                      photoScrollRef.current?.scrollTo({ x: index * photoBoxWidth, animated: true });
                    }}
                    scaleTo={0.9}
                  >
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

            <View style={styles.handleOverlay} pointerEvents="none">
              <View style={styles.handle} />
            </View>
          </View>

          <GestureDetector gesture={horizontalGesture}>
          <View>
          <View style={styles.quickMetaRow}>
            <View style={styles.quickMetaItem}>
              <Ionicons name={difficultyIconNames[poi.difficulty]} size={14} color={colors.textSecondary} />
              <Text style={styles.quickMetaLabel}>{t.difficulty[poi.difficulty]}</Text>
            </View>
            <Text style={styles.quickMetaDot}>·</Text>
            <View style={styles.quickMetaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.quickMetaLabel}>
                {poi.durationMinutes}
                {t.app.minutesShort}
              </Text>
            </View>
            <Text style={styles.quickMetaDot}>·</Text>
            <View style={styles.quickMetaItem}>
              <Ionicons name="camera-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.quickMetaLabel}>
                {poi.photos.length} {t.app.photo}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            {description ? <Text style={styles.description}>{description}</Text> : null}

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

          {hasPreviousPlace || hasNextPlace ? (
            <View style={styles.navRow}>
              {hasPreviousPlace ? (
                <AnimatedPressable style={styles.navButton} onPress={goBack} haptic={false}>
                  <Ionicons name="chevron-back" size={16} color={colors.icon} />
                  <Text style={styles.navButtonLabel}>{t.app.previousPlace}</Text>
                </AnimatedPressable>
              ) : (
                <View />
              )}
              {hasNextPlace ? (
                <AnimatedPressable style={styles.navButton} onPress={goForward} haptic={false}>
                  <Text style={styles.navButtonLabel}>{t.app.nextPlace}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                </AnimatedPressable>
              ) : null}
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
          </View>
          </GestureDetector>
            </Animated.ScrollView>
          </Animated.View>
        </GestureDetector>

        <PhotoViewerModal
          visible={isPhotoViewerOpen}
          photos={displayPhotos}
          initialIndex={activePhotoIndex}
          onClose={() => setIsPhotoViewerOpen(false)}
        />
      </GestureHandlerRootView>

      <AnimatedCenterModal
        visible={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        backdropColor={colors.overlay}
        contentStyle={styles.reportCard}
      >
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
      </AnimatedCenterModal>
    </Modal>
  );
}

function PeekCardHero({
  poi,
  language,
  styles,
  colors
}: {
  poi: Poi;
  language: Language;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const photo = poi.photos[0];
  const name = poi.nameByLanguage?.[language] ?? poi.name;
  return (
    <View style={styles.peekCardInner}>
      {photo ? (
        <Image source={{ uri: resolveOfflinePhotoUri(photo.id, photo.url) }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Ionicons name="location-outline" size={28} color={colors.textTertiary} />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.72)"]}
        locations={[0, 1]}
        style={styles.photoGradient}
        pointerEvents="none"
      />
      <View style={styles.photoTitleBox}>
        <Text style={styles.photoTitle} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  gestureRoot: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  backdropTouch: { flex: 1 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  handleOverlay: { position: "absolute", top: 10, left: 0, right: 0, alignItems: "center" },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.7)" },
  peekCard: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  peekCardInner: { height: PHOTO_BOX_HEIGHT, backgroundColor: colors.divider },
  photoBox: { height: PHOTO_BOX_HEIGHT, overflow: "hidden", backgroundColor: colors.divider },
  photo: { width: "100%", height: "100%" },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  photoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 84
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
  quickMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 12
  },
  quickMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  quickMetaLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, textTransform: "capitalize" },
  quickMetaDot: { fontSize: 13, color: colors.textTertiary },
  content: { padding: 18 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 11
  },
  actionButtonActive: { backgroundColor: colors.primary },
  actionLabel: { fontSize: 13, fontWeight: "600", color: colors.primary },
  actionLabelActive: { color: colors.textInverse },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
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
