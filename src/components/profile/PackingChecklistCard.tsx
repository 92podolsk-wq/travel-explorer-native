import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Text } from "@/shared/ui/AppText";
import { TextInput } from "@/shared/ui/AppTextInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { getFriends } from "@/shared/api/friends";
import {
  getChecklistShareTargets,
  getServerChecklist,
  shareChecklistWithFriend,
  unshareChecklistWithFriend,
  updateServerChecklist
} from "@/shared/api/checklist";
import type { FriendUser } from "@/entities/user/model/types";
import {
  getChecklistState,
  syncServerChecklistReminder,
  updateChecklistState,
  type ChecklistCategory,
  type ChecklistItem,
  type PackingChecklistState
} from "@/shared/storage/packing-checklist";

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type ChecklistFilter = "all" | "incomplete" | "complete";

function filterItems(items: ChecklistItem[], filter: ChecklistFilter): ChecklistItem[] {
  if (filter === "incomplete") return items.filter((item) => !item.checked);
  if (filter === "complete") return items.filter((item) => item.checked);
  return items;
}

type Styles = ReturnType<typeof createStyles>;

function ChecklistSection({
  emoji,
  title,
  items,
  filter,
  isOpen,
  onToggleOpen,
  colors,
  styles,
  addPlaceholder,
  deleteLabel,
  editLabel,
  moveUpLabel,
  moveDownLabel,
  cancelLabel,
  onToggle,
  onRemove,
  onAdd,
  onEdit,
  onMoveUp,
  onMoveDown,
  onDeleteCategory
}: {
  emoji: string;
  title: string;
  items: ChecklistItem[];
  filter: ChecklistFilter;
  isOpen: boolean;
  onToggleOpen: () => void;
  colors: ThemeColors;
  styles: Styles;
  addPlaceholder: string;
  deleteLabel: string;
  editLabel: string;
  moveUpLabel: string;
  moveDownLabel: string;
  cancelLabel: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (label: string) => void;
  onEdit: (id: string, label: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDeleteCategory: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const visibleItems = filterItems(items, filter);
  const doneCount = items.filter((item) => item.checked).length;

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setIsAdding(false);
      return;
    }
    onAdd(trimmed);
    setDraft("");
    setIsAdding(false);
  }

  function startEditing(item: ChecklistItem) {
    setEditingItemId(item.id);
    setEditDraft(item.label);
  }

  function commitEdit() {
    if (!editingItemId) return;
    const trimmed = editDraft.trim();
    if (trimmed) onEdit(editingItemId, trimmed);
    setEditingItemId(null);
  }

  function openItemMenu(item: ChecklistItem) {
    const trueIndex = items.findIndex((current) => current.id === item.id);
    const options: { text: string; style?: "default" | "cancel" | "destructive"; onPress?: () => void }[] = [
      { text: editLabel, onPress: () => startEditing(item) }
    ];
    if (trueIndex > 0) options.push({ text: moveUpLabel, onPress: () => onMoveUp(item.id) });
    if (trueIndex < items.length - 1) options.push({ text: moveDownLabel, onPress: () => onMoveDown(item.id) });
    options.push({ text: deleteLabel, style: "destructive", onPress: () => onRemove(item.id) });
    options.push({ text: cancelLabel, style: "cancel" });
    Alert.alert(item.label, undefined, options);
  }

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggleOpen} activeOpacity={0.7}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionEmoji}>{emoji}</Text>
          <Text style={styles.subTitle}>{title}</Text>
        </View>
        <View style={styles.sectionHeaderRight}>
          <Text style={styles.sectionCount}>
            {doneCount}/{items.length}
          </Text>
          <TouchableOpacity onPress={onDeleteCategory} hitSlop={8}>
            <Ionicons name="trash-outline" size={15} color={colors.textTertiary} />
          </TouchableOpacity>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>

      {isOpen ? (
        <>
          {visibleItems.map((item) => (
            <Swipeable
              key={item.id}
              renderRightActions={() => (
                <TouchableOpacity style={styles.deleteAction} onPress={() => onRemove(item.id)}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.deleteActionLabel}>{deleteLabel}</Text>
                </TouchableOpacity>
              )}
              overshootRight={false}
            >
              <View style={styles.itemRow}>
                {editingItemId === item.id ? (
                  <TextInput
                    autoFocus
                    style={styles.itemEditInput}
                    value={editDraft}
                    onChangeText={setEditDraft}
                    onSubmitEditing={commitEdit}
                    onBlur={commitEdit}
                    returnKeyType="done"
                  />
                ) : (
                  <>
                    <TouchableOpacity style={styles.itemCheckRow} onPress={() => onToggle(item.id)}>
                      <Ionicons
                        name={item.checked ? "checkbox" : "square-outline"}
                        size={20}
                        color={item.checked ? colors.primary : colors.textTertiary}
                      />
                      <Text style={[styles.itemLabel, item.checked && styles.itemLabelChecked]} numberOfLines={1}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemMenuButton} onPress={() => openItemMenu(item)} hitSlop={8}>
                      <Ionicons name="ellipsis-vertical" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Swipeable>
          ))}

          {isAdding ? (
            <View style={styles.addRow}>
              <TextInput
                autoFocus
                style={styles.addInput}
                placeholder={addPlaceholder}
                placeholderTextColor={colors.placeholder}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={submit}
                onBlur={submit}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addButton} onPress={submit}>
                <Ionicons name="add" size={18} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addLink} onPress={() => setIsAdding(true)}>
              <Ionicons name="add" size={14} color={colors.primary} />
              <Text style={styles.addLinkLabel}>{addPlaceholder}</Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}
    </View>
  );
}

export function PackingChecklistCard() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const [state, setState] = useState<PackingChecklistState | null>(null);
  const [openDatePicker, setOpenDatePicker] = useState<"start" | "end" | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [shareTargetIds, setShareTargetIds] = useState<Set<string>>(new Set());
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ChecklistFilter>("all");
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(new Set());
  const [tripNameDraft, setTripNameDraft] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState("");

  useEffect(() => {
    if (currentUser) {
      getServerChecklist().then(({ checklist }) => {
        setState({ ...checklist, reminderNotificationId: null });
        void syncServerChecklistReminder(checklist);
      });
    } else {
      getChecklistState().then(setState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    setTripNameDraft(state?.tripName ?? "");
  }, [state?.tripName]);

  useEffect(() => {
    if (state && state.categories.length > 0) {
      setOpenCategoryIds((prev) => (prev.size === 0 ? new Set([state.categories[0].id]) : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state === null]);

  async function applyPatch(patch: Partial<Pick<PackingChecklistState, "tripName" | "tripStartDate" | "tripEndDate" | "categories">>) {
    if (!state) return;
    if (currentUser) {
      const merged = { ...state, ...patch };
      setState(merged);
      const { checklist } = await updateServerChecklist(patch);
      void syncServerChecklistReminder(checklist);
    } else {
      const updated = await updateChecklistState(state, patch);
      setState(updated);
    }
  }

  function updateCategoryItems(categoryId: string, updater: (items: ChecklistItem[]) => ChecklistItem[]) {
    applyPatch({
      categories: state!.categories.map((category) =>
        category.id === categoryId ? { ...category, items: updater(category.items) } : category
      )
    });
  }

  function moveItem(categoryId: string, itemId: string, direction: "up" | "down") {
    updateCategoryItems(categoryId, (items) => {
      const index = items.findIndex((item) => item.id === itemId);
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || swapWith < 0 || swapWith >= items.length) return items;
      const next = [...items];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  }

  function toggleCategoryOpen(categoryId: string) {
    setOpenCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function submitCategory() {
    const trimmed = categoryDraft.trim();
    if (!trimmed) {
      setIsAddingCategory(false);
      return;
    }
    const category: ChecklistCategory = { id: makeId(), title: trimmed, emoji: "🗂", items: [] };
    applyPatch({ categories: [...state!.categories, category] });
    setOpenCategoryIds((prev) => new Set(prev).add(category.id));
    setCategoryDraft("");
    setIsAddingCategory(false);
  }

  function confirmDeleteCategory(category: ChecklistCategory) {
    Alert.alert(t.app.checklistDeleteCategoryConfirm.replace("{name}", category.title), undefined, [
      { text: t.auth.cancel, style: "cancel" },
      {
        text: t.auth.delete,
        style: "destructive",
        onPress: () => applyPatch({ categories: state!.categories.filter((c) => c.id !== category.id) })
      }
    ]);
  }

  function openShare() {
    setIsShareOpen((value) => !value);
    if (friends.length === 0) {
      getFriends().then((body) => setFriends(body.friends.map((entry) => entry.user)));
    }
    getChecklistShareTargets().then((body) => setShareTargetIds(new Set(body.users.map((user) => user.id))));
  }

  async function toggleShare(friendId: string, isShared: boolean) {
    setPendingShareId(friendId);
    try {
      if (isShared) {
        await unshareChecklistWithFriend(friendId);
        setShareTargetIds((prev) => {
          const next = new Set(prev);
          next.delete(friendId);
          return next;
        });
      } else {
        await shareChecklistWithFriend(friendId);
        setShareTargetIds((prev) => new Set(prev).add(friendId));
      }
    } finally {
      setPendingShareId(null);
    }
  }

  if (!state) return null;

  function handleStartDateChange(event: { type: string }, selectedDate?: Date) {
    setOpenDatePicker(null);
    if (event.type !== "set" || !selectedDate) return;
    applyPatch({ tripStartDate: selectedDate.toISOString() });
  }

  function handleEndDateChange(event: { type: string }, selectedDate?: Date) {
    setOpenDatePicker(null);
    if (event.type !== "set" || !selectedDate) return;
    applyPatch({ tripEndDate: selectedDate.toISOString() });
  }

  function commitTripName() {
    const trimmed = tripNameDraft.trim();
    if (trimmed !== (state!.tripName ?? "")) {
      applyPatch({ tripName: trimmed || null });
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long" });
  }

  const startLabel = state.tripStartDate ? formatDate(state.tripStartDate) : t.app.checklistSetDate;
  const endLabel = state.tripEndDate ? formatDate(state.tripEndDate) : t.app.checklistSetDate;

  const daysUntilTrip = (() => {
    if (!state.tripStartDate) return null;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfTrip = new Date(state.tripStartDate).setHours(0, 0, 0, 0);
    const days = Math.round((startOfTrip - startOfToday) / 86_400_000);
    return days >= 0 ? days : null;
  })();

  const totalCount = state.categories.reduce((sum, category) => sum + category.items.length, 0);
  const doneCount = state.categories.reduce(
    (sum, category) => sum + category.items.filter((item) => item.checked).length,
    0
  );
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && doneCount === totalCount;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>{t.app.checklistCardTitle}</Text>
        {currentUser ? (
          <TouchableOpacity style={styles.shareButton} onPress={openShare}>
            <Ionicons name="share-social-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.shareButtonLabel}>{t.auth.shareChecklist}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isShareOpen && currentUser ? (
        <View style={styles.shareCard}>
          {friends.length === 0 ? (
            <Text style={styles.mutedText}>{t.auth.friendsEmpty}</Text>
          ) : (
            friends.map((friend) => {
              const isShared = shareTargetIds.has(friend.id);
              return (
                <View key={friend.id} style={styles.shareRow}>
                  <View style={styles.shareRowUser}>
                    <ProfileAvatar avatarId={friend.avatarId} size={24} />
                    <Text style={styles.shareRowName} numberOfLines={1}>
                      {friend.name || `@${friend.username}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={isShared ? styles.secondaryButton : styles.primaryButton}
                    onPress={() => void toggleShare(friend.id, isShared)}
                    disabled={pendingShareId === friend.id}
                  >
                    <Text style={isShared ? styles.secondaryButtonLabel : styles.primaryButtonLabel}>
                      {isShared ? t.auth.friendsRemove : t.auth.friendsAdd}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      ) : null}

      <View style={styles.tripCard}>
        <TextInput
          style={styles.tripNameInput}
          placeholder={t.app.checklistTripNamePlaceholder}
          placeholderTextColor={colors.placeholder}
          value={tripNameDraft}
          onChangeText={setTripNameDraft}
          onBlur={commitTripName}
          onSubmitEditing={commitTripName}
          returnKeyType="done"
        />

        <View style={styles.dateRowGroup}>
          <TouchableOpacity style={styles.dateRow} onPress={() => setOpenDatePicker("start")}>
            <Ionicons name="calendar-outline" size={13} color={colors.primary} />
            <Text style={styles.dateLabel} numberOfLines={1}>
              {startLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateRow} onPress={() => setOpenDatePicker("end")}>
            <Ionicons name="calendar-outline" size={13} color={colors.primary} />
            <Text style={styles.dateLabel} numberOfLines={1}>
              {endLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {daysUntilTrip != null ? (
          <Text style={styles.daysUntilLabel}>{t.app.checklistDaysUntilTrip.replace("{n}", String(daysUntilTrip))}</Text>
        ) : null}

        {totalCount > 0 ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>
                {doneCount} / {totalCount}
              </Text>
              <Text style={styles.progressLabel}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        ) : null}
      </View>

      {openDatePicker === "start" ? (
        <DateTimePicker
          value={state.tripStartDate ? new Date(state.tripStartDate) : new Date()}
          mode="date"
          onChange={handleStartDateChange}
        />
      ) : null}
      {openDatePicker === "end" ? (
        <DateTimePicker
          value={state.tripEndDate ? new Date(state.tripEndDate) : new Date()}
          mode="date"
          onChange={handleEndDateChange}
        />
      ) : null}

      {isAllDone ? (
        <View style={styles.allDoneBanner}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.allDoneText}>
            <Text style={styles.allDoneTitle}>{t.app.checklistAllDoneTitle} </Text>
            {t.app.checklistAllDoneBody}
          </Text>
        </View>
      ) : null}

      <View style={styles.filterRow}>
        {(
          [
            { id: "all" as const, label: t.app.checklistFilterAll, count: totalCount },
            { id: "incomplete" as const, label: t.app.checklistFilterIncomplete, count: totalCount - doneCount },
            { id: "complete" as const, label: t.app.checklistFilterComplete, count: doneCount }
          ] as const
        ).map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.filterChip, filter === option.id && styles.filterChipActive]}
            onPress={() => setFilter(option.id)}
          >
            <Text style={[styles.filterChipLabel, filter === option.id && styles.filterChipLabelActive]} numberOfLines={1}>
              {option.label} {option.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {state.categories.map((category) => (
        <ChecklistSection
          key={category.id}
          emoji={category.emoji}
          title={category.title}
          items={category.items}
          filter={filter}
          isOpen={openCategoryIds.has(category.id)}
          onToggleOpen={() => toggleCategoryOpen(category.id)}
          colors={colors}
          styles={styles}
          addPlaceholder={t.app.checklistAddPlaceholder}
          deleteLabel={t.app.checklistDeleteItem}
          editLabel={t.app.checklistEditItem}
          moveUpLabel={t.app.checklistMoveUp}
          moveDownLabel={t.app.checklistMoveDown}
          cancelLabel={t.auth.cancel}
          onToggle={(id) =>
            updateCategoryItems(category.id, (items) =>
              items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
            )
          }
          onRemove={(id) => updateCategoryItems(category.id, (items) => items.filter((item) => item.id !== id))}
          onAdd={(label) => updateCategoryItems(category.id, (items) => [...items, { id: makeId(), label, checked: false }])}
          onEdit={(id, label) =>
            updateCategoryItems(category.id, (items) => items.map((item) => (item.id === id ? { ...item, label } : item)))
          }
          onMoveUp={(id) => moveItem(category.id, id, "up")}
          onMoveDown={(id) => moveItem(category.id, id, "down")}
          onDeleteCategory={() => confirmDeleteCategory(category)}
        />
      ))}

      {isAddingCategory ? (
        <View style={styles.addRow}>
          <TextInput
            autoFocus
            style={styles.addInput}
            placeholder={t.app.checklistCategoryNamePlaceholder}
            placeholderTextColor={colors.placeholder}
            value={categoryDraft}
            onChangeText={setCategoryDraft}
            onSubmitEditing={submitCategory}
            onBlur={submitCategory}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={submitCategory}>
            <Ionicons name="add" size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addLink} onPress={() => setIsAddingCategory(true)}>
          <Ionicons name="add" size={14} color={colors.primary} />
          <Text style={styles.addLinkLabel}>{t.app.checklistAddCategory}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16
    },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    cardTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5
    },
    shareButton: { flexDirection: "row", alignItems: "center", gap: 4 },
    shareButtonLabel: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },
    shareCard: { backgroundColor: colors.background, borderRadius: 10, padding: 10, marginBottom: 12, gap: 8 },
    mutedText: { fontSize: 12, color: colors.textTertiary },
    shareRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    shareRowUser: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 },
    shareRowName: { fontSize: 12, fontWeight: "600", color: colors.textPrimary, flexShrink: 1 },
    primaryButton: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.primarySoft },
    primaryButtonLabel: { fontSize: 11, fontWeight: "700", color: colors.primary },
    secondaryButton: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
    secondaryButtonLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
    tripCard: { backgroundColor: colors.background, borderRadius: 10, padding: 10, marginBottom: 10, gap: 8 },
    tripNameInput: { fontSize: 14, fontWeight: "800", color: colors.textPrimary, padding: 0 },
    dateRowGroup: { flexDirection: "row", gap: 8 },
    dateRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6
    },
    dateLabel: { fontSize: 12, fontWeight: "700", color: colors.primary, flexShrink: 1 },
    daysUntilLabel: { fontSize: 11, color: colors.textTertiary },
    progressBlock: { gap: 4 },
    progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    progressLabel: { fontSize: 11, fontWeight: "600", color: colors.textTertiary },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.divider, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.primary },
    allDoneBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 10
    },
    allDoneTitle: { fontWeight: "800", color: colors.primary },
    allDoneText: { fontSize: 12, color: colors.primary, flexShrink: 1 },
    filterRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
    filterChip: {
      flex: 1,
      borderRadius: 8,
      paddingVertical: 6,
      alignItems: "center",
      backgroundColor: colors.background
    },
    filterChipActive: { backgroundColor: colors.primary },
    filterChipLabel: { fontSize: 10, fontWeight: "700", color: colors.textTertiary },
    filterChipLabelActive: { color: colors.textInverse },
    section: { marginBottom: 6 },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
    sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
    sectionEmoji: { fontSize: 14 },
    sectionHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
    sectionCount: { fontSize: 11, fontWeight: "600", color: colors.textTertiary },
    subTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.surface
    },
    itemCheckRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    itemLabel: { fontSize: 14, color: colors.textPrimary, flexShrink: 1 },
    itemLabelChecked: { color: colors.textTertiary, textDecorationLine: "line-through" },
    itemMenuButton: { paddingHorizontal: 6, paddingVertical: 4 },
    itemEditInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      padding: 0,
      backgroundColor: colors.background,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4
    },
    deleteAction: {
      width: 64,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      backgroundColor: colors.danger,
      marginBottom: 1
    },
    deleteActionLabel: { fontSize: 9, fontWeight: "700", color: "#fff" },
    addRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
    addInput: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.background,
      paddingHorizontal: 10,
      fontSize: 13,
      color: colors.textPrimary
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary
    },
    addLink: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
    addLinkLabel: { fontSize: 12, fontWeight: "600", color: colors.primary }
  });
}
