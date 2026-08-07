import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera, type CameraRef, Map as MapLibreMap, Marker } from "@maplibre/maplibre-react-native";
import type { Category } from "@/entities/category/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { MapStyleId } from "@/entities/site-setting/model/types";
import { resolveMapStyleUrl } from "@/shared/map/map-styles";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type FavoritesMapPreviewProps = {
  pois: Poi[];
  categories: Category[];
  mapStyleId?: MapStyleId;
  onSelectPoi: (poiId: string) => void;
  onOpenFullMap: () => void;
};

export function FavoritesMapPreview({ pois, categories, mapStyleId, onSelectPoi, onOpenFullMap }: FavoritesMapPreviewProps) {
  const cameraRef = useRef<CameraRef>(null);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const mapStyle = resolveMapStyleUrl(mapStyleId ?? "openfreemap-bright");
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const coordSignature = useMemo(() => pois.map((p) => `${p.id}:${p.coordinates.lat},${p.coordinates.lng}`).join("|"), [pois]);

  useEffect(() => {
    if (pois.length === 0) return;
    if (pois.length === 1) {
      cameraRef.current?.flyTo({ center: [pois[0].coordinates.lng, pois[0].coordinates.lat], zoom: 13, duration: 400 });
      return;
    }
    const lats = pois.map((p) => p.coordinates.lat);
    const lngs = pois.map((p) => p.coordinates.lng);
    cameraRef.current?.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
      padding: { top: 36, right: 36, bottom: 36, left: 36 },
      duration: 400
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordSignature]);

  return (
    <View style={styles.container}>
      <MapLibreMap style={styles.map} mapStyle={mapStyle} logo={false}>
        <Camera ref={cameraRef} initialViewState={{ center: [135.7681, 35.0116], zoom: 9 }} />
        {pois.map((poi) => {
          const category = categoriesById.get(poi.category);
          return (
            <Marker key={poi.id} id={poi.id} lngLat={[poi.coordinates.lng, poi.coordinates.lat]} onPress={() => onSelectPoi(poi.id)}>
              <View style={[styles.pin, { backgroundColor: category?.color ?? "#7a7a7a" }]}>
                <CategoryIcon icon={category?.icon ?? ""} size={9} />
              </View>
            </Marker>
          );
        })}
      </MapLibreMap>
      <TouchableOpacity style={styles.openButton} onPress={onOpenFullMap}>
        <Ionicons name="expand-outline" size={14} color={colors.primary} />
        <Text style={styles.openButtonLabel}>{t.auth.favoritesMapOpen}</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { height: 220, borderRadius: 14, overflow: "hidden", marginTop: 12 },
    map: { flex: 1 },
    pin: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#ffffff", alignItems: "center", justifyContent: "center" },
    openButton: {
      position: "absolute",
      right: 10,
      bottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3
    },
    openButtonLabel: { fontSize: 12, fontWeight: "700", color: colors.primary }
  });
}
