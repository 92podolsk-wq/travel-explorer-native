import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { ItineraryStopWithPoi } from "@/entities/itinerary/model/types";
import {
  stopPointColor,
  stopPointDescription,
  stopPointName,
  stopPointPhotoUrl
} from "@/entities/itinerary/model/stop-point";
import { formatDistance } from "@/shared/lib/geo";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type TravelInfo = { minutes: number; meters: number };
type LunchInfo = { startMinutes: number; minutes: number };

type ItineraryStopRowProps = {
  stop: ItineraryStopWithPoi;
  arrivalMinutes: number;
  departureMinutes: number;
  isDurationOverridden: boolean;
  travelToNext: TravelInfo | null;
  lunchAfter: LunchInfo | null;
  onEditDuration: (minutes: number | null) => void;
  onRemove: () => void;
  onMoveToDay: () => void;
  onDrag: () => void;
  isActive: boolean;
};

function formatTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function ItineraryStopRow({
  stop,
  arrivalMinutes,
  departureMinutes,
  isDurationOverridden,
  travelToNext,
  lunchAfter,
  onEditDuration,
  onRemove,
  onMoveToDay,
  onDrag,
  isActive
}: ItineraryStopRowProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const language = useExplorerStore((state) => state.language);
  const distanceUnit = useExplorerStore((state) => state.distanceUnit);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [durationDraft, setDurationDraft] = useState(String(departureMinutes - arrivalMinutes));

  const name = stopPointName(stop.point, language, t.auth.mapPointFallbackName);
  const description = stopPointDescription(stop.point);
  const photoUrl = stopPointPhotoUrl(stop.point);
  const markerColor = stopPointColor(stop.point);

  function commitDuration() {
    const parsed = Number(durationDraft);
    setIsEditingDuration(false);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(600, Math.max(5, Math.round(parsed)));
    onEditDuration(clamped);
  }

  return (
    <View style={[styles.container, isActive && styles.containerActive]}>
      <View style={styles.row}>
        <TouchableOpacity onLongPress={onDrag} delayLongPress={150} style={styles.dragHandle}>
          <Ionicons name="reorder-three" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback, markerColor ? { backgroundColor: markerColor } : null]}>
            <Ionicons name={stop.point.kind === "marker" ? "location" : "image-outline"} size={16} color={colors.textInverse} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {description ? (
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          ) : null}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(arrivalMinutes)}</Text>
            <Ionicons name="arrow-forward" size={11} color={colors.textTertiary} />
            {isEditingDuration ? (
              <TextInput
                style={styles.durationInput}
                value={durationDraft}
                onChangeText={setDurationDraft}
                onBlur={commitDuration}
                onSubmitEditing={commitDuration}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setDurationDraft(String(departureMinutes - arrivalMinutes));
                  setIsEditingDuration(true);
                }}
              >
                <Text style={styles.timeText}>{formatTime(departureMinutes)}</Text>
              </TouchableOpacity>
            )}
            {isDurationOverridden && !isEditingDuration ? (
              <TouchableOpacity onPress={() => onEditDuration(null)}>
                <Text style={styles.resetLabel}>{t.auth.resetLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onMoveToDay} style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {travelToNext ? (
        <View style={styles.travelRow}>
          <Ionicons name="walk-outline" size={13} color={colors.textTertiary} />
          <Text style={styles.travelText}>
            {travelToNext.minutes} {t.app.minutesShort} ({formatDistance(travelToNext.meters, distanceUnit)})
          </Text>
        </View>
      ) : null}

      {lunchAfter ? (
        <View style={styles.lunchRow}>
          <Ionicons name="restaurant-outline" size={13} color="#a87a2e" />
          <Text style={styles.lunchText}>
            {t.auth.lunchAtLabel} {formatTime(lunchAfter.startMinutes)} · {lunchAfter.minutes} {t.app.minutesShort}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { paddingVertical: 8, paddingHorizontal: 4 },
    containerActive: { backgroundColor: "#eef6f4", borderRadius: 10 },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    dragHandle: { padding: 4 },
    photo: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.divider },
    photoFallback: { backgroundColor: colors.textTertiary, alignItems: "center", justifyContent: "center" },
    info: { flex: 1, gap: 2 },
    name: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
    description: { fontSize: 12, color: colors.textTertiary },
    timeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    timeText: { fontSize: 12, color: "#3a3a3a", fontWeight: "600" },
    durationInput: {
      fontSize: 12,
      color: "#3a3a3a",
      fontWeight: "600",
      borderBottomWidth: 1,
      borderBottomColor: colors.primary,
      minWidth: 36,
      paddingVertical: 0
    },
    resetLabel: { fontSize: 11, color: colors.primary, textDecorationLine: "underline" },
    actions: { flexDirection: "row", gap: 2 },
    actionButton: { padding: 6 },
    travelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginLeft: 56, marginTop: 2 },
    travelText: { fontSize: 11, color: colors.textTertiary },
    lunchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginLeft: 56,
      marginTop: 4,
      backgroundColor: "#fdf1de",
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8
    },
    lunchText: { fontSize: 11, color: "#a87a2e", fontWeight: "600" }
  });
}
