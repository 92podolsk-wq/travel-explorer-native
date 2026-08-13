import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { getItinerariesSharedWithMe } from "@/shared/api/itinerary-shares";
import type { SharedItinerarySummary } from "@/entities/sharing/model/types";

type SharedItinerariesCardProps = {
  onOpen: (itineraryId: string) => void;
};

export function SharedItinerariesCard({ onOpen }: SharedItinerariesCardProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const [shared, setShared] = useState<SharedItinerarySummary[] | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    getItinerariesSharedWithMe().then((body) => setShared(body.itineraries));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (!currentUser || !shared || shared.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t.auth.sharedItinerariesTitle}</Text>
      {shared.map(({ owner, itinerary }) => (
        <TouchableOpacity key={itinerary.id} style={styles.row} onPress={() => onOpen(itinerary.id)}>
          <ProfileAvatar avatarId={owner.avatarId} size={26} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title} numberOfLines={1}>
              {itinerary.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {owner.name || `@${owner.username}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 },
    cardTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10
    },
    row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
    title: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
    subtitle: { fontSize: 11, color: colors.textTertiary }
  });
}
