import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import { getWeather, type WeatherResponse } from "@/shared/api/weather";
import { mapSevenTimerCode, weatherConditionIcons } from "@/shared/lib/weather-condition";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type WeatherChipsProps = {
  regionId: string;
  latitude: number;
  longitude: number;
  timeZoneOffsetHours: number;
};

export function WeatherChips({ regionId, latitude, longitude, timeZoneOffsetHours }: WeatherChipsProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setWeather(null);
    getWeather(latitude, longitude, timeZoneOffsetHours)
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      });
    return () => {
      cancelled = true;
    };
  }, [regionId, latitude, longitude, timeZoneOffsetHours]);

  if (!weather) return null;

  const nowIcon = weatherConditionIcons[mapSevenTimerCode(weather.now.code)];
  const tomorrowIcon = weatherConditionIcons[mapSevenTimerCode(weather.tomorrow.code)];

  return (
    <View style={styles.row}>
      <View style={styles.chip}>
        <Text style={styles.chipLabel}>{t.app.now}</Text>
        <Ionicons name={nowIcon} size={12} color={colors.heroText} />
        <Text style={styles.chipValue}>{Math.round(weather.now.tempC)}°</Text>
      </View>
      <View style={styles.chip}>
        <Text style={styles.chipLabel}>{t.app.tomorrow}</Text>
        <Ionicons name={tomorrowIcon} size={12} color={colors.heroText} />
        <Text style={styles.chipValue}>{Math.round(weather.tomorrow.tempC)}°</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: "row", gap: 8, marginTop: 8 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(255,255,255,0.14)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4
    },
    chipLabel: { fontSize: 11, fontWeight: "600", color: colors.heroTextMuted },
    chipValue: { fontSize: 12, fontWeight: "700", color: colors.heroText }
  });
}
