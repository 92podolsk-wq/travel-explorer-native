import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NestableScrollContainer } from "react-native-draggable-flatlist";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { API_ORIGIN } from "@/shared/api/client";
import { useEnsureItineraryLoaded } from "@/shared/model/use-ensure-itinerary";
import {
  addItineraryDay,
  clearItineraryStops,
  createItinerary,
  deleteItinerary,
  generateItinerary,
  getItinerary,
  moveItineraryStop,
  removeItineraryDay,
  removeItineraryStop,
  renameItinerary,
  reorderItineraryDay,
  updateItineraryDay,
  updateItineraryStartDate,
  updateItineraryStop,
  type DayConfigPatch
} from "@/shared/api/itineraries";
import { ItineraryDayCard } from "@/components/itinerary/ItineraryDayCard";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { ItineraryGeneratorModal } from "@/components/itinerary/ItineraryGeneratorModal";
import { saveWidgetTripSummary } from "@/shared/storage/widget-trip-summary";
import { refreshTripCountdownWidget } from "@/widgets/trip-countdown/TripCountdownWidget";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

export function RouteScreen() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const language = useExplorerStore((state) => state.language);
  const authStatus = useExplorerStore((state) => state.authStatus);
  const openAuthModal = useExplorerStore((state) => state.openAuthModal);
  const regions = useExplorerStore((state) => state.regions);
  const itineraries = useExplorerStore((state) => state.itineraries);
  const activeItineraryId = useExplorerStore((state) => state.activeItineraryId);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItineraries = useExplorerStore((state) => state.setItineraries);
  const setActiveItineraryId = useExplorerStore((state) => state.setActiveItineraryId);
  const setItinerary = useExplorerStore((state) => state.setItinerary);

  const { isLoading: isLoadingList } = useEnsureItineraryLoaded();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (!itinerary) return;
    saveWidgetTripSummary({ title: itinerary.title, startDate: itinerary.startDate }).then(refreshTripCountdownWidget);
  }, [itinerary]);

  async function handleStartDateChange(event: { type: string }, selectedDate?: Date) {
    setIsDatePickerOpen(false);
    if (event.type !== "set" || !selectedDate || !itinerary) return;
    const updated = await updateItineraryStartDate(itinerary.id, selectedDate.toISOString());
    setItinerary(updated);
  }

  async function handleSwitchItinerary(id: string) {
    setActiveItineraryId(id);
    const full = await getItinerary(id);
    setItinerary(full);
  }

  async function handleCreateItinerary() {
    if (itineraries.length >= 3) {
      Alert.alert(t.auth.maxItinerariesReached);
      return;
    }
    const created = await createItinerary();
    setItineraries([...itineraries, { id: created.id, title: created.title }]);
    setActiveItineraryId(created.id);
    setItinerary(created);
  }

  function handleDeleteItinerary() {
    if (!itinerary) return;
    Alert.alert(t.auth.deleteItinerary, t.auth.deleteItineraryConfirm.replace("{title}", itinerary.title), [
      { text: t.auth.cancel, style: "cancel" },
      {
        text: t.auth.delete,
        style: "destructive",
        onPress: async () => {
          await deleteItinerary(itinerary.id);
          const remaining = itineraries.filter((i) => i.id !== itinerary.id);
          setItineraries(remaining);
          if (remaining.length > 0) {
            setActiveItineraryId(remaining[0].id);
            setItinerary(await getItinerary(remaining[0].id));
          } else {
            setActiveItineraryId(null);
            setItinerary(null);
          }
        }
      }
    ]);
  }

  async function handleRenameSubmit() {
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (!itinerary || !trimmed || trimmed === itinerary.title) return;
    const updated = await renameItinerary(itinerary.id, trimmed);
    setItinerary(updated);
    setItineraries(itineraries.map((i) => (i.id === updated.id ? { id: updated.id, title: updated.title } : i)));
  }

  async function handleShareItinerary() {
    if (!itinerary) return;
    try {
      await Share.share({ message: `${itinerary.title} — ${API_ORIGIN}/trip/${itinerary.shareToken}` });
    } catch {
      // user dismissed the share sheet; nothing to do
    }
  }

  async function handleGenerate(input: { regionId: string; days: number; hoursPerDay: number; source: "favorites" | "recommended" }) {
    if (!itinerary) return;
    const result = await generateItinerary(itinerary.id, { ...input, language });
    if (result.stops.length === 0) {
      throw new Error("empty");
    }
    setItinerary(result);
    setItineraries(itineraries.map((i) => (i.id === result.id ? { id: result.id, title: result.title } : i)));
    setIsGeneratorOpen(false);
  }

  function handleClearStops() {
    if (!itinerary) return;
    Alert.alert(t.auth.clearItinerary, t.auth.clearItineraryConfirm, [
      { text: t.auth.cancel, style: "cancel" },
      {
        text: t.auth.clearRoute,
        style: "destructive",
        onPress: async () => {
          const cleared = await clearItineraryStops(itinerary.id);
          setItinerary(cleared);
        }
      }
    ]);
  }

  async function handleAddDay() {
    if (!itinerary) return;
    setItinerary(await addItineraryDay(itinerary.id));
  }

  async function handleDeleteDay(day: number) {
    if (!itinerary) return;
    setItinerary(await removeItineraryDay(itinerary.id, day));
  }

  async function handleUpdateDayConfig(day: number, patch: DayConfigPatch) {
    if (!itinerary) return;
    setItinerary(await updateItineraryDay(itinerary.id, day, patch));
  }

  async function handleReorder(day: number, orderedStopIds: string[]) {
    if (!itinerary) return;
    setItinerary(await reorderItineraryDay(itinerary.id, day, orderedStopIds));
  }

  async function handleMoveStop(stopId: string, targetDay: number) {
    if (!itinerary) return;
    const targetSiblingIds = itinerary.stops
      .filter((s) => s.day === targetDay && s.id !== stopId)
      .sort((a, b) => a.position - b.position)
      .map((s) => s.id);
    setItinerary(await moveItineraryStop(itinerary.id, stopId, targetDay, [...targetSiblingIds, stopId]));
  }

  async function handleEditDuration(stopId: string, minutes: number | null) {
    if (!itinerary) return;
    setItinerary(await updateItineraryStop(itinerary.id, stopId, { durationOverrideMinutes: minutes }));
  }

  async function handleRemoveStop(stopId: string) {
    if (!itinerary) return;
    setItinerary(await removeItineraryStop(itinerary.id, stopId));
  }

  if (authStatus === "guest") {
    return (
      <View style={styles.centered}>
        <Ionicons name="navigate-outline" size={32} color={colors.textTertiary} style={{ marginBottom: 10 }} />
        <Text style={styles.emptyTitle}>{t.auth.guestPrompt}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={openAuthModal}>
          <Text style={styles.primaryButtonLabel}>{t.auth.login}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoadingList) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherRow}>
          {itineraries.map((summary) => (
            <TouchableOpacity
              key={summary.id}
              style={[styles.switcherChip, summary.id === activeItineraryId && styles.switcherChipActive]}
              onPress={() => handleSwitchItinerary(summary.id)}
            >
              <Text style={[styles.switcherChipLabel, summary.id === activeItineraryId && styles.switcherChipLabelActive]} numberOfLines={1}>
                {summary.title}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addItineraryButton} onPress={handleCreateItinerary}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {!itinerary ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{t.auth.myRouteEmpty}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateItinerary}>
            <Text style={styles.primaryButtonLabel}>{t.auth.createItinerary}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <NestableScrollContainer contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleRow}>
            {isEditingTitle ? (
              <TextInput
                style={styles.titleInput}
                value={titleDraft}
                onChangeText={setTitleDraft}
                autoFocus
                onBlur={handleRenameSubmit}
                onSubmitEditing={handleRenameSubmit}
              />
            ) : (
              <TouchableOpacity
                style={styles.titleTouchable}
                onPress={() => {
                  setTitleDraft(itinerary.title);
                  setIsEditingTitle(true);
                }}
              >
                <Text style={styles.itineraryTitle} numberOfLines={1}>
                  {itinerary.title}
                </Text>
                <Ionicons name="pencil" size={14} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleShareItinerary} style={styles.iconButton}>
              <Ionicons name="share-social-outline" size={18} color={colors.icon} />
            </TouchableOpacity>
            {itineraries.length > 1 ? (
              <TouchableOpacity onPress={handleDeleteItinerary} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.startDateRow} onPress={() => setIsDatePickerOpen(true)}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.startDateLabel}>
              {itinerary.startDate
                ? t.auth.tripStartDateSet.replace(
                    "{date}",
                    new Date(itinerary.startDate).toLocaleDateString(language, { day: "numeric", month: "long" })
                  )
                : t.auth.tripStartDate}
            </Text>
          </TouchableOpacity>
          {isDatePickerOpen ? (
            <DateTimePicker
              value={itinerary.startDate ? new Date(itinerary.startDate) : new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={handleStartDateChange}
            />
          ) : null}

          <View style={styles.toolbarRow}>
            <TouchableOpacity style={styles.toolbarButton} onPress={() => setIsGeneratorOpen(true)}>
              <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
              <Text style={styles.toolbarButtonLabel}>{t.auth.generate}</Text>
            </TouchableOpacity>
            {itinerary.stops.length > 0 ? (
              <TouchableOpacity style={styles.toolbarButton} onPress={handleClearStops}>
                <Ionicons name="close-circle-outline" size={15} color={colors.danger} />
                <Text style={[styles.toolbarButtonLabel, { color: colors.danger }]}>{t.auth.clearRoute}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {itinerary.days.length === 0 ? (
            <View style={styles.centeredInline}>
              <Text style={styles.emptyTitle}>{t.auth.clearRouteConfirm}</Text>
              <Text style={styles.emptySubtitle}>{t.auth.dayEmptyPlaceholder}</Text>
            </View>
          ) : (
            [...itinerary.days]
              .sort((a, b) => a.day - b.day)
              .map((day, index) => (
                <AnimatedListItem key={day.day} index={index}>
                  <ItineraryDayCard
                    day={day}
                    stops={itinerary.stops.filter((s) => s.day === day.day).sort((a, b) => a.position - b.position)}
                    allDayNumbers={itinerary.days.map((d) => d.day).sort((a, b) => a - b)}
                    defaultExpanded={index === 0}
                    onReorder={handleReorder}
                    onMoveStop={handleMoveStop}
                    onEditDuration={handleEditDuration}
                    onRemoveStop={handleRemoveStop}
                    onDeleteDay={handleDeleteDay}
                    onUpdateDayConfig={handleUpdateDayConfig}
                  />
                </AnimatedListItem>
              ))
          )}

          <TouchableOpacity style={styles.addDayButton} onPress={handleAddDay}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addDayLabel}>{t.auth.addDay}</Text>
          </TouchableOpacity>
        </NestableScrollContainer>
      )}

      <ItineraryGeneratorModal
        visible={isGeneratorOpen}
        regions={regions}
        onClose={() => setIsGeneratorOpen(false)}
        onSubmit={handleGenerate}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
    centeredInline: { alignItems: "center", paddingVertical: 32, gap: 6 },
    emptyTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
    emptySubtitle: { fontSize: 13, color: colors.textTertiary, textAlign: "center" },
    primaryButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
    primaryButtonLabel: { color: colors.textInverse, fontWeight: "700", fontSize: 14 },
    header: { paddingTop: 50, paddingBottom: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
    switcherRow: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
    switcherChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, maxWidth: 160 },
    switcherChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    switcherChipLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
    switcherChipLabelActive: { color: colors.textInverse },
    addItineraryButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center"
    },
    scrollContent: { padding: 14, paddingBottom: 40 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    titleTouchable: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
    itineraryTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
    titleInput: { flex: 1, fontSize: 20, fontWeight: "800", color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.primary },
    iconButton: { padding: 6 },
    startDateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 10
    },
    startDateLabel: { fontSize: 12, fontWeight: "700", color: colors.primary },
    toolbarRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    toolbarButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border
    },
    toolbarButtonLabel: { fontSize: 12, fontWeight: "700", color: colors.primary },
    addDayButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: "dashed",
      borderRadius: 12,
      paddingVertical: 12,
      marginTop: 4
    },
    addDayLabel: { fontSize: 13, fontWeight: "700", color: colors.primary }
  });
}
