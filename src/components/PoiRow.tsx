import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Image } from "expo-image";
import type { Poi } from "@/entities/poi/model/types";
import { resolveOfflinePhotoUri } from "@/shared/map/offline-maps";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type PoiRowProps = {
  poi: Poi;
  regionName: string;
  onSelect: () => void;
  action?: ReactNode;
};

export function PoiRow({ poi, regionName, onSelect, action }: PoiRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const firstPhoto = poi.photos[0];
  const photoUrl = firstPhoto ? resolveOfflinePhotoUri(firstPhoto.id, firstPhoto.url) : null;

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.main} onPress={onSelect} activeOpacity={0.7}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailFallback]}>
            <Ionicons name="location-outline" size={18} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {poi.name}
          </Text>
          <Text style={styles.region} numberOfLines={1}>
            {regionName}
          </Text>
        </View>
      </TouchableOpacity>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
    main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
    thumbnail: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.divider },
    thumbnailFallback: { alignItems: "center", justifyContent: "center" },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
    region: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    action: { flexShrink: 0, marginLeft: 8 }
  });
}
