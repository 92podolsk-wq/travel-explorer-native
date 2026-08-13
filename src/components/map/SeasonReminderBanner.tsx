import { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import type { Season } from "@/entities/poi/model/types";
import type { SeasonWindows } from "@/entities/region/model/types";
import { getUpcomingSeasonReminder } from "@/shared/lib/season-reminder";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

const seasonIcons: Record<Season, keyof typeof Ionicons.glyphMap> = {
  spring: "flower",
  summer: "sunny",
  autumn: "leaf",
  winter: "snow"
};

type SeasonReminderBannerProps = {
  regionId: string;
  regionName: string;
  seasonWindows: SeasonWindows | null | undefined;
};

export function SeasonReminderBanner({ regionId, regionName, seasonWindows }: SeasonReminderBannerProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const reminder = useMemo(() => getUpcomingSeasonReminder(seasonWindows), [seasonWindows]);
  const reminderKey = reminder ? `${regionId}:${reminder.season}` : null;

  if (!reminder || !reminderKey || dismissed.has(reminderKey)) return null;

  const message = (reminder.daysUntil === 0 ? t.app.seasonReminderToday : t.app.seasonReminder)
    .replace("{season}", t.season[reminder.season])
    .replace("{city}", regionName)
    .replace("{days}", String(reminder.daysUntil));

  return (
    <View style={styles.row}>
      <Ionicons name={seasonIcons[reminder.season]} size={14} color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity onPress={() => setDismissed((prev) => new Set(prev).add(reminderKey))} hitSlop={8}>
        <Ionicons name="close" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(40,127,114,0.1)",
      borderWidth: 1,
      borderColor: "rgba(40,127,114,0.3)",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      marginBottom: 8
    },
    text: { flex: 1, fontSize: 11, fontWeight: "600", color: "#1a4a42" }
  });
}
