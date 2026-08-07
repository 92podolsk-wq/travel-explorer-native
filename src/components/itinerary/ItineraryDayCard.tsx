import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NestableDraggableFlatList } from "react-native-draggable-flatlist";
import type { ItineraryDayInfo, ItineraryStopWithPoi } from "@/entities/itinerary/model/types";
import { stopPointCoordinates } from "@/entities/itinerary/model/stop-point";
import { buildDayTimeline, formatDurationLabel, formatMinutesAsTime, type DayTimelineEntry } from "@/entities/itinerary/model/timeline";
import { computeItinerarySummary } from "@/entities/itinerary/model/summary";
import { estimateTransitionMinutes, formatDistance, haversineDistanceMeters } from "@/shared/lib/geo";
import { fetchWalkingRoute, type WalkingRoute } from "@/shared/lib/osrm-route";
import type { DayConfigPatch } from "@/shared/api/itineraries";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { ItineraryStopRow } from "./ItineraryStopRow";

type StopExtra = {
  arrivalMinutes: number;
  departureMinutes: number;
  isDurationOverridden: boolean;
  travelToNext: { minutes: number; meters: number } | null;
  lunchAfter: { startMinutes: number; minutes: number } | null;
};

function computeStopExtras(entries: DayTimelineEntry[], stopIds: string[]): Map<string, StopExtra> {
  const map = new Map<string, StopExtra>();
  let stopCursor = 0;
  let currentId: string | null = null;
  for (const entry of entries) {
    if (entry.type === "stop") {
      currentId = stopIds[stopCursor] ?? null;
      stopCursor += 1;
      if (currentId) {
        map.set(currentId, {
          arrivalMinutes: entry.arrivalMinutes,
          departureMinutes: entry.departureMinutes,
          isDurationOverridden: entry.isDurationOverridden,
          travelToNext: null,
          lunchAfter: null
        });
      }
    } else if (entry.type === "travel" && currentId) {
      const extra = map.get(currentId);
      if (extra) extra.travelToNext = { minutes: entry.minutes, meters: entry.meters };
    } else if (entry.type === "lunch" && currentId) {
      const extra = map.get(currentId);
      if (extra) extra.lunchAfter = { startMinutes: entry.startMinutes, minutes: entry.minutes };
    }
  }
  return map;
}

type ItineraryDayCardProps = {
  day: ItineraryDayInfo;
  stops: ItineraryStopWithPoi[];
  allDayNumbers: number[];
  defaultExpanded: boolean;
  onReorder: (day: number, orderedStopIds: string[]) => void;
  onMoveStop: (stopId: string, targetDay: number) => void;
  onEditDuration: (stopId: string, minutes: number | null) => void;
  onRemoveStop: (stopId: string) => void;
  onDeleteDay: (day: number) => void;
  onUpdateDayConfig: (day: number, patch: DayConfigPatch) => void;
};

export function ItineraryDayCard({
  day,
  stops,
  allDayNumbers,
  defaultExpanded,
  onReorder,
  onMoveStop,
  onEditDuration,
  onRemoveStop,
  onDeleteDay,
  onUpdateDayConfig
}: ItineraryDayCardProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const distanceUnit = useExplorerStore((state) => state.distanceUnit);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(day.title ?? "");
  const [route, setRoute] = useState<WalkingRoute | null>(null);
  const [movingStopId, setMovingStopId] = useState<string | null>(null);

  const startMinutes = day.startMinutes ?? 540;
  const points = useMemo(() => stops.map((s) => s.point), [stops]);
  const coordSignature = useMemo(
    () => points.map((p) => `${stopPointCoordinates(p).lat},${stopPointCoordinates(p).lng}`).join("|"),
    [points]
  );

  useEffect(() => {
    if (!isExpanded || points.length < 2) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    fetchWalkingRoute(points.map(stopPointCoordinates)).then((result) => {
      if (!cancelled) setRoute(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, coordSignature]);

  const legs = useMemo(() => {
    if (points.length < 2) return [];
    return points.slice(0, -1).map((point, index) => {
      const meters =
        route?.legDistancesMeters[index] ?? haversineDistanceMeters(stopPointCoordinates(point), stopPointCoordinates(points[index + 1]));
      return { meters, minutes: estimateTransitionMinutes(meters) };
    });
  }, [points, route]);

  const { entries } = useMemo(
    () =>
      buildDayTimeline(points, legs, startMinutes, {
        durationOverridesMinutes: stops.map((s) => s.durationOverrideMinutes),
        lunch: { enabled: day.lunchEnabled, startMinutes: day.lunchStartMinutes ?? undefined, durationMinutes: day.lunchDurationMinutes ?? undefined }
      }),
    [points, legs, startMinutes, stops, day.lunchEnabled, day.lunchStartMinutes, day.lunchDurationMinutes]
  );

  const stopExtras = useMemo(() => computeStopExtras(entries, stops.map((s) => s.id)), [entries, stops]);
  const summary = computeItinerarySummary(stops);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => setIsExpanded((v) => !v)} activeOpacity={0.7}>
        <Ionicons name={isExpanded ? "chevron-down" : "chevron-forward"} size={18} color={colors.textSecondary} />
        <View style={styles.headerInfo}>
          {isEditingTitle ? (
            <TextInput
              style={styles.titleInput}
              value={titleDraft}
              onChangeText={setTitleDraft}
              autoFocus
              onBlur={() => {
                setIsEditingTitle(false);
                const trimmed = titleDraft.trim();
                if (trimmed) onUpdateDayConfig(day.day, { title: trimmed });
              }}
            />
          ) : (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setTitleDraft(day.title ?? t.auth.dayLabel.replace("{n}", String(day.day)));
                setIsEditingTitle(true);
              }}
            >
              <Text style={styles.title}>{day.title ?? t.auth.dayLabel.replace("{n}", String(day.day))}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.stats}>
            {t.auth.dayPlaceCount.replace("{count}", String(stops.length))} · {formatDistance(summary.walkingDistanceMeters, distanceUnit)}{" "}
            ·{" "}
            {formatDurationLabel(summary.totalMinutes, t.auth.hourUnit, t.app.minutesShort)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onDeleteDay(day.day);
          }}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>

      {isExpanded ? (
        <View style={styles.body}>
          <View style={styles.startRow}>
            <Text style={styles.startLabel}>{t.auth.dayStart}</Text>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => onUpdateDayConfig(day.day, { startMinutes: Math.max(0, startMinutes - 30) })}>
                <Ionicons name="remove-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.startValue}>{formatMinutesAsTime(startMinutes)}</Text>
              <TouchableOpacity onPress={() => onUpdateDayConfig(day.day, { startMinutes: Math.min(1410, startMinutes + 30) })}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.lunchRow}>
            <Text style={styles.startLabel}>{t.auth.lunchBreak}</Text>
            <Switch
              value={day.lunchEnabled === true}
              onValueChange={(value) => onUpdateDayConfig(day.day, { lunchEnabled: value })}
            />
            {day.lunchEnabled ? (
              <Text style={styles.lunchDetail}>
                {t.auth.lunchStartTime} {formatMinutesAsTime(day.lunchStartMinutes ?? 720)}, {day.lunchDurationMinutes ?? 60}{" "}
                {t.auth.lunchDuration}
              </Text>
            ) : null}
          </View>

          <NestableDraggableFlatList
            data={stops}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            onDragEnd={({ data }) => onReorder(day.day, data.map((s) => s.id))}
            renderItem={({ item, drag, isActive }) => {
              const extra = stopExtras.get(item.id);
              return (
                <ItineraryStopRow
                  stop={item}
                  arrivalMinutes={extra?.arrivalMinutes ?? startMinutes}
                  departureMinutes={extra?.departureMinutes ?? startMinutes}
                  isDurationOverridden={extra?.isDurationOverridden ?? false}
                  travelToNext={extra?.travelToNext ?? null}
                  lunchAfter={extra?.lunchAfter ?? null}
                  onEditDuration={(minutes) => onEditDuration(item.id, minutes)}
                  onRemove={() => onRemoveStop(item.id)}
                  onMoveToDay={() => setMovingStopId(item.id)}
                  onDrag={drag}
                  isActive={isActive}
                />
              );
            }}
          />
        </View>
      ) : null}

      <Modal visible={movingStopId != null} transparent animationType="fade" onRequestClose={() => setMovingStopId(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMovingStopId(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t.auth.moveToDay}</Text>
            {allDayNumbers.map((dayNumber) => (
              <TouchableOpacity
                key={dayNumber}
                style={styles.modalRow}
                disabled={dayNumber === day.day}
                onPress={() => {
                  if (movingStopId) onMoveStop(movingStopId, dayNumber);
                  setMovingStopId(null);
                }}
              >
                <Text style={[styles.modalRowLabel, dayNumber === day.day && styles.modalRowLabelDisabled]}>
                  {t.auth.dayLabel.replace("{n}", String(dayNumber))}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 14, marginBottom: 12, overflow: "hidden" },
    header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
    headerInfo: { flex: 1 },
    title: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
    titleInput: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textPrimary,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary,
      paddingVertical: 0
    },
    stats: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    deleteButton: { padding: 6 },
    body: { paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.divider },
    startRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
    startLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
    stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
    startValue: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, minWidth: 42, textAlign: "center" },
    lunchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 8 },
    lunchDetail: { fontSize: 11, color: "#a87a2e" },
    modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", padding: 24 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: colors.textPrimary },
    modalRow: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10 },
    modalRowLabel: { fontSize: 15, color: colors.primary, fontWeight: "600" },
    modalRowLabelDisabled: { color: colors.textTertiary }
  });
}
