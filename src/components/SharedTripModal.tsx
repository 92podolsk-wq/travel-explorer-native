import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Itinerary } from "@/entities/itinerary/model/types";
import { stopPointName, stopPointPhotoUrl } from "@/entities/itinerary/model/stop-point";
import { getSharedItinerary } from "@/shared/api/itinerary-shares";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type SharedTripModalProps = {
  itineraryId: string | null;
  onClose: () => void;
};

export function SharedTripModal({ itineraryId, onClose }: SharedTripModalProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const language = useExplorerStore((state) => state.language);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!itineraryId) {
      setItinerary(null);
      return;
    }
    setIsLoading(true);
    getSharedItinerary(itineraryId)
      .then(setItinerary)
      .catch(() => setItinerary(null))
      .finally(() => setIsLoading(false));
  }, [itineraryId]);

  const days = useMemo(() => {
    if (!itinerary) return [];
    return itinerary.days
      .slice()
      .sort((a, b) => a.day - b.day)
      .map((day) => ({
        day: day.day,
        title: day.title,
        stops: itinerary.stops.filter((stop) => stop.day === day.day).sort((a, b) => a.position - b.position)
      }));
  }, [itinerary]);

  return (
    <Modal visible={itineraryId !== null} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {itinerary?.title ?? ""}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !itinerary ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>{t.auth.friendsEmpty}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {days.map((dayInfo) => (
              <View key={dayInfo.day} style={styles.dayCard}>
                <Text style={styles.dayTitle}>{dayInfo.title || `Day ${dayInfo.day}`}</Text>
                {dayInfo.stops.map((stop) => {
                  const photoUrl = stopPointPhotoUrl(stop.point);
                  return (
                    <View key={stop.id} style={styles.stopRow}>
                      {photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={styles.stopImage} contentFit="cover" />
                      ) : (
                        <View style={[styles.stopImage, styles.stopImageFallback]} />
                      )}
                      <Text style={styles.stopName} numberOfLines={2}>
                        {stopPointName(stop.point, language, t.auth.mapPointFallbackName)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 56 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 12
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: colors.textPrimary },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyText: { fontSize: 13, color: colors.textTertiary },
    content: { padding: 20, paddingTop: 0, gap: 14 },
    dayCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, gap: 10 },
    dayTitle: { fontSize: 14, fontWeight: "800", color: colors.textPrimary },
    stopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    stopImage: { width: 44, height: 44, borderRadius: 8 },
    stopImageFallback: { backgroundColor: colors.surfaceAlt },
    stopName: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.textPrimary }
  });
}
