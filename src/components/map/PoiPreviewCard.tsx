import { useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Poi } from "@/entities/poi/model/types";
import type { Category } from "@/entities/category/model/types";
import type { Language } from "@/shared/i18n/types";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { CategoryIcon } from "@/components/CategoryIcon";
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

  return (
    <View style={styles.card}>
      <View style={styles.photoWrap}>
        {poi.photos[0] ? (
          <Image source={{ uri: resolveOfflinePhotoUri(poi.photos[0].id, poi.photos[0].url) }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]} />
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {regionName}
          {categoryName ? ` · ${categoryName}` : ""}
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.viewButton} onPress={onView}>
            <Text style={styles.viewButtonLabel}>{t.app.poiPreviewView}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.favoriteButton, isFavorite && { backgroundColor: colors.primary }]}
            onPress={onToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite ? colors.textInverse : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    photo: { width: "100%", height: "100%", resizeMode: "cover" },
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
    body: { padding: 12 },
    name: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
    subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    actionsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
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
