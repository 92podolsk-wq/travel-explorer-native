import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Keyboard, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { TextInput } from "@/shared/ui/AppTextInput";
import type { ItineraryStopWithPoi } from "@/entities/itinerary/model/types";
import {
  stopPointColor,
  stopPointDescription,
  stopPointName,
  stopPointPhotoUrl
} from "@/entities/itinerary/model/stop-point";
import { formatDistance, formatSteps } from "@/shared/lib/geo";
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
  onSetNotes: (notes: string | null) => void;
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
  onSetNotes,
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
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const toggleVisited = useExplorerStore((state) => state.toggleVisited);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [durationDraft, setDurationDraft] = useState(String(departureMinutes - arrivalMinutes));
  const [isNotesOpen, setIsNotesOpen] = useState(Boolean(stop.notes));
  const [notesDraft, setNotesDraft] = useState(stop.notes ?? "");

  const name = stopPointName(stop.point, language, t.auth.mapPointFallbackName);
  const description = stopPointDescription(stop.point);
  const photoUrl = stopPointPhotoUrl(stop.point);
  const markerColor = stopPointColor(stop.point);
  const poiId = stop.point.kind === "poi" ? stop.point.poi.id : null;
  const isVisited = poiId != null && visitedPoiIds.includes(poiId);

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

        {poiId ? (
          <TouchableOpacity
            onPress={() => toggleVisited(poiId)}
            style={styles.visitedToggle}
            accessibilityLabel={t.auth.markVisited}
          >
            <Ionicons
              name={isVisited ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={isVisited ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        ) : null}

        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={[styles.photo, isVisited && styles.photoVisited]} />
        ) : (
          <View
            style={[
              styles.photo,
              styles.photoFallback,
              markerColor ? { backgroundColor: markerColor } : null,
              isVisited && styles.photoVisited
            ]}
          >
            <Ionicons name={stop.point.kind === "marker" ? "location" : "image-outline"} size={16} color={colors.textInverse} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.name, isVisited && styles.nameVisited]} numberOfLines={1}>
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
          <TouchableOpacity onPress={() => setIsNotesOpen((v) => !v)} style={styles.actionButton}>
            <Ionicons
              name={stop.notes ? "document-text" : "document-text-outline"}
              size={16}
              color={stop.notes ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onMoveToDay} style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {isNotesOpen ? (
        <View style={styles.notesWrap}>
          <TextInput
            style={styles.notesInput}
            value={notesDraft}
            onChangeText={setNotesDraft}
            onBlur={() => onSetNotes(notesDraft.trim() ? notesDraft.trim() : null)}
            placeholder={t.auth.notesPlaceholder}
            placeholderTextColor={colors.placeholder}
            multiline
          />
          <TouchableOpacity
            style={styles.notesDoneButton}
            onPress={() => {
              onSetNotes(notesDraft.trim() ? notesDraft.trim() : null);
              Keyboard.dismiss();
              setIsNotesOpen(false);
            }}
          >
            <Ionicons name="checkmark" size={14} color={colors.textInverse} />
            <Text style={styles.notesDoneLabel}>{t.auth.notesDone}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {travelToNext ? (
        <View style={styles.travelRow}>
          <Ionicons name="walk-outline" size={13} color={colors.textTertiary} />
          <Text style={styles.travelText}>
            {travelToNext.minutes} {t.app.minutesShort} ({formatDistance(travelToNext.meters, distanceUnit)},{" "}
            {t.auth.stepsApprox.replace("{count}", formatSteps(travelToNext.meters))})
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
    visitedToggle: { padding: 2 },
    photo: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.divider },
    photoFallback: { backgroundColor: colors.textTertiary, alignItems: "center", justifyContent: "center" },
    photoVisited: { opacity: 0.45 },
    info: { flex: 1, gap: 2 },
    name: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
    nameVisited: { color: colors.textTertiary, textDecorationLine: "line-through" },
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
    lunchText: { fontSize: 11, color: "#a87a2e", fontWeight: "600" },
    notesWrap: {},
    notesInput: {
      marginLeft: 56,
      marginTop: 6,
      marginRight: 4,
      fontSize: 12,
      color: colors.textPrimary,
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      minHeight: 36,
      textAlignVertical: "top"
    },
    notesDoneButton: {
      alignSelf: "flex-end",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
      marginRight: 4,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: colors.primary
    },
    notesDoneLabel: { fontSize: 11, fontWeight: "700", color: colors.textInverse }
  });
}
