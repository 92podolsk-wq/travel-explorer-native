import { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Image } from "expo-image";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Extrapolation
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import type { Poi } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { hapticSelection, hapticSuccess, hapticSwipe } from "@/shared/haptics";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { resolveOfflinePhotoUri } from "@/shared/map/offline-maps";

type NeighboringSwipeRegion = { id: string; name: string; count: number };

type SwipeDiscoveryModalProps = {
  pois: Poi[];
  language: Language;
  onLike: (poiId: string) => void;
  onSkip: (poiId: string) => void;
  onClose: () => void;
  neighboringRegions?: NeighboringSwipeRegion[];
  onSwitchRegion?: (regionId: string) => void;
};

const SWIPE_THRESHOLD = 110;
const FLY_OUT_DISTANCE = 500;

function SwipeCard({
  poi,
  name,
  description,
  onLike,
  onSkip
}: {
  poi: Poi;
  name: string;
  description: string;
  onLike: () => void;
  onSkip: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const crossed = useSharedValue(0);

  useEffect(() => {
    x.value = 0;
    y.value = 0;
    crossed.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi.id]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      x.value = event.translationX;
      y.value = event.translationY * 0.35;
      if (event.translationX > SWIPE_THRESHOLD) {
        if (crossed.value !== 1) {
          crossed.value = 1;
          runOnJS(hapticSelection)();
        }
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        if (crossed.value !== -1) {
          crossed.value = -1;
          runOnJS(hapticSelection)();
        }
      } else {
        crossed.value = 0;
      }
    })
    .onEnd((event) => {
      crossed.value = 0;
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(hapticSuccess)();
        x.value = withTiming(FLY_OUT_DISTANCE, { duration: 260 });
        y.value = withTiming(150, { duration: 260 }, (finished) => {
          if (finished) runOnJS(onLike)();
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(hapticSwipe)();
        x.value = withTiming(-FLY_OUT_DISTANCE, { duration: 260 });
        y.value = withTiming(150, { duration: 260 }, (finished) => {
          if (finished) runOnJS(onSkip)();
        });
      } else {
        x.value = withSpring(0, { damping: 30, stiffness: 400 });
        y.value = withSpring(0, { damping: 30, stiffness: 400 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${interpolate(x.value, [-320, 320], [-16, 16], Extrapolation.CLAMP)}deg` }
    ]
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [20, 130], [0, 1], Extrapolation.CLAMP)
  }));
  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-130, -20], [1, 0], Extrapolation.CLAMP)
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.photoWrap}>
          {poi.photos[0] ? (
            <Image
              source={{ uri: resolveOfflinePhotoUri(poi.photos[0].id, poi.photos[0].url) }}
              style={styles.photo}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.photo, styles.photoFallback]} />
          )}
          {poi.mustVisit && (
            <View style={styles.mustVisitBadge}>
              <Text style={styles.mustVisitText}>Must Visit</Text>
            </View>
          )}
          <Animated.View style={[styles.likeBadge, likeStyle]}>
            <Text style={styles.likeBadgeText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.skipBadge, skipStyle]}>
            <Text style={styles.skipBadgeText}>SKIP</Text>
          </Animated.View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={1}>
            {description}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export function SwipeDiscoveryModal({
  pois,
  language,
  onLike,
  onSkip,
  onClose,
  neighboringRegions = [],
  onSwitchRegion
}: SwipeDiscoveryModalProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [deck] = useState(() => pois);
  const [index, setIndex] = useState(0);

  const current = deck[index];
  const next = deck[index + 1];
  const next2 = deck[index + 2];

  const backCards = useMemo(
    () => [
      { poi: next2, scale: 0.94, translateY: 14, opacity: 0.75 },
      { poi: next, scale: 0.97, translateY: 7, opacity: 0.9 }
    ],
    [next, next2]
  );

  function handleLike() {
    if (!current) return;
    onLike(current.id);
    setIndex((i) => i + 1);
  }

  function handleSkip() {
    if (!current) return;
    onSkip(current.id);
    setIndex((i) => i + 1);
  }

  function handleLikeButton() {
    hapticSuccess();
    handleLike();
  }

  function handleSkipButton() {
    hapticSwipe();
    handleSkip();
  }

  const nameFor = (poi: Poi) => poi.nameByLanguage?.[language] ?? poi.name;
  const descriptionFor = (poi: Poi) => poi.descriptionByLanguage?.[language] ?? poi.description;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{t.app.swipeDiscovery}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={10}>
              <Ionicons name="close" size={18} color="#1a1a1a" />
            </TouchableOpacity>
          </View>

          <View style={styles.stack}>
            {!current ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t.app.swipeEmpty}</Text>
                {neighboringRegions.length > 0 && (
                  <View style={styles.continueList}>
                    <Text style={styles.continueHint}>{t.app.swipeContinueHint}</Text>
                    {neighboringRegions.map((region) => (
                      <TouchableOpacity
                        key={region.id}
                        style={styles.continueButton}
                        onPress={() => onSwitchRegion?.(region.id)}
                      >
                        <Text style={styles.continueButtonText}>
                          {t.app.swipeContinueIn.replace("{region}", region.name).replace("{count}", String(region.count))}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <>
                {backCards.map(
                  ({ poi, scale, translateY, opacity }) =>
                    poi && (
                      <View
                        key={poi.id}
                        style={[
                          styles.backCard,
                          { transform: [{ scale }, { translateY }], opacity }
                        ]}
                      >
                        {poi.photos[0] && (
                          <Image
                            source={{ uri: resolveOfflinePhotoUri(poi.photos[0].id, poi.photos[0].url) }}
                            style={styles.photo}
                            contentFit="cover"
                          />
                        )}
                      </View>
                    )
                )}
                <SwipeCard
                  key={current.id}
                  poi={current}
                  name={nameFor(current)}
                  description={descriptionFor(current)}
                  onLike={handleLike}
                  onSkip={handleSkip}
                />
              </>
            )}
          </View>

          {current && (
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSkipButton}>
                <Ionicons name="close" size={26} color="#dc2626" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleLikeButton}>
                <Ionicons name="heart" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {current && (
            <Text style={styles.progressText}>
              {t.app.swipeProgress.replace("{current}", String(index + 1)).replace("{total}", String(deck.length))}
            </Text>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20
    },
    headerRow: {
      position: "absolute",
      top: 56,
      left: 20,
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    headerTitle: { fontSize: 14, fontWeight: "700", color: colors.textInverse },
    closeButton: {
      // Deliberately literal: this chrome button stays a fixed near-white
      // pill regardless of theme, floating on the always-dark backdrop.
      backgroundColor: "rgba(255,255,255,0.92)",
      borderRadius: 999,
      padding: 8
    },
    stack: { width: "100%", maxWidth: 380, height: "58%", maxHeight: 460 },
    backCard: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 10,
      backgroundColor: colors.surface,
      overflow: "hidden"
    },
    card: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 10,
      backgroundColor: colors.surface,
      padding: 8,
      paddingBottom: 18
    },
    photoWrap: { flex: 1, borderRadius: 6, overflow: "hidden", backgroundColor: colors.surfaceAlt },
    photo: { width: "100%", height: "100%" },
    photoFallback: { backgroundColor: colors.surfaceAlt },
    mustVisitBadge: {
      position: "absolute",
      left: 12,
      top: 12,
      // Fixed brand-red callout, same family as the Hanko seal motif — not chrome.
      backgroundColor: "rgba(163,49,44,0.92)",
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      transform: [{ rotate: "-2deg" }]
    },
    mustVisitText: { color: colors.textInverse, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
    likeBadge: {
      // LIKE swipe-feedback color — data, not chrome. Left literal.
      position: "absolute",
      right: 20,
      top: 28,
      borderWidth: 4,
      borderColor: "#059669",
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 4,
      transform: [{ rotate: "-18deg" }]
    },
    likeBadgeText: { color: "#059669", fontSize: 20, fontWeight: "900", letterSpacing: 2 },
    skipBadge: {
      // SKIP swipe-feedback color — data, not chrome. Left literal.
      position: "absolute",
      left: 20,
      top: 28,
      borderWidth: 4,
      borderColor: "#dc2626",
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 4,
      transform: [{ rotate: "18deg" }]
    },
    skipBadgeText: { color: "#dc2626", fontSize: 20, fontWeight: "900", letterSpacing: 2 },
    cardFooter: { paddingTop: 10, paddingHorizontal: 4 },
    cardTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
    cardDescription: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    emptyCard: {
      flex: 1,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 12
    },
    emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
    continueList: { width: "100%", gap: 8 },
    continueHint: { fontSize: 10, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
    continueButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10
    },
    continueButtonText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
    actionsRow: { flexDirection: "row", gap: 24, marginTop: 16 },
    actionButton: {
      width: 56,
      height: 56,
      borderRadius: 999,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4
    },
    // Text-on-backdrop; no muted-inverse token exists, kept literal like the overlay it sits on.
    progressText: { marginTop: 10, fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.9)" }
  });
}
