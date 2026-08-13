import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { Poi } from "@/entities/poi/model/types";
import type { Category } from "@/entities/category/model/types";
import type { Language } from "@/shared/i18n/types";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { resolveOfflinePhotoUri } from "@/shared/map/offline-maps";

type PoiPreviewCardProps = {
  poi: Poi;
  category: Category | undefined;
  regionName: string;
  language: Language;
  isFavorite: boolean;
  onView: () => void;
  onClose: () => void;
  onToggleFavorite: () => void;
};

const DISMISS_DISTANCE = 120;
const DISMISS_THRESHOLD = 50;

export function PoiPreviewCard({
  poi,
  category,
  regionName,
  language,
  isFavorite,
  onView,
  onClose,
  onToggleFavorite
}: PoiPreviewCardProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const name = poi.nameByLanguage?.[language] ?? poi.name;
  const categoryName = category ? (category.nameByLanguage[language] ?? category.name) : null;

  const translateY = useSharedValue(0);

  // Dismisses on a swipe in either direction. Buttons below use RNGH's own
  // Pressable (not React Native's core Touchable/Pressable) — mixing the old
  // responder-based touchables with a sibling GestureDetector on the same
  // surface let this Pan gesture's native recognizer swallow taps before
  // they reached the button, so every tap target here needs to speak RNGH.
  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-12, 12])
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const pastThreshold = Math.abs(translateY.value) > DISMISS_THRESHOLD || Math.abs(event.velocityY) > 800;
      if (pastThreshold) {
        const direction = translateY.value < 0 ? -1 : 1;
        translateY.value = withTiming(direction * DISMISS_DISTANCE, { duration: 180 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 150 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1 - Math.min(1, Math.abs(translateY.value) / DISMISS_DISTANCE) * 0.6
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        <Pressable onPress={onView}>
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
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={16} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.textBody}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {regionName}
              {categoryName ? ` · ${categoryName}` : ""}
            </Text>
          </View>
        </Pressable>

        <View style={styles.actionsRow}>
          <Pressable style={styles.viewButton} onPress={onView}>
            <Text style={styles.viewButtonLabel}>{t.app.poiPreviewView}</Text>
          </Pressable>
          <Pressable
            style={[styles.favoriteButton, isFavorite && { backgroundColor: colors.primary }]}
            onPress={onToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite ? colors.textInverse : colors.primary}
            />
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6
    },
    photoWrap: { height: 110, backgroundColor: colors.surfaceAlt },
    photo: { width: "100%", height: "100%" },
    photoFallback: { backgroundColor: colors.surfaceAlt },
    closeButton: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.4)"
    },
    textBody: { paddingHorizontal: 12, paddingTop: 12 },
    name: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
    subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    actionsRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingBottom: 12, marginTop: 10 },
    viewButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 9,
      alignItems: "center"
    },
    viewButtonLabel: { color: colors.textInverse, fontSize: 13, fontWeight: "700" },
    favoriteButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySoft
    }
  });
}
