import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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
  type ChecklistItem,
  type PackingChecklistState
} from "@/shared/storage/packing-checklist";

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type Styles = ReturnType<typeof createStyles>;

function ChecklistSection({
  title,
  items,
  colors,
  styles,
  addPlaceholder,
  onToggle,
  onRemove,
  onAdd
}: {
  title: string;
  items: ChecklistItem[];
  colors: ThemeColors;
  styles: Styles;
  addPlaceholder: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (label: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  }

  return (
    <View>
      <Text style={styles.subTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
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
          <TouchableOpacity onPress={() => onRemove(item.id)} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder={addPlaceholder}
          placeholderTextColor={colors.placeholder}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={submit}>
          <Ionicons name="add" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function PackingChecklistCard() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const [state, setState] = useState<PackingChecklistState | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [shareTargetIds, setShareTargetIds] = useState<Set<string>>(new Set());
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);

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

  async function applyPatch(patch: Partial<Pick<PackingChecklistState, "tripDate" | "packingItems" | "shoppingItems">>) {
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

  function handleDateChange(event: { type: string }, selectedDate?: Date) {
    setIsDatePickerOpen(false);
    if (event.type !== "set" || !selectedDate) return;
    applyPatch({ tripDate: selectedDate.toISOString() });
  }

  const dateLabel = state.tripDate
    ? t.app.checklistDateSet.replace(
        "{date}",
        new Date(state.tripDate).toLocaleDateString(undefined, { day: "numeric", month: "long" })
      )
    : t.app.checklistSetDate;

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

      <TouchableOpacity style={styles.dateRow} onPress={() => setIsDatePickerOpen(true)}>
        <Ionicons name="calendar-outline" size={14} color={colors.primary} />
        <Text style={styles.dateLabel}>{dateLabel}</Text>
      </TouchableOpacity>
      {isDatePickerOpen ? (
        <DateTimePicker
          value={state.tripDate ? new Date(state.tripDate) : new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      ) : null}

      <ChecklistSection
        title={t.app.checklistPackingTitle}
        items={state.packingItems}
        colors={colors}
        styles={styles}
        addPlaceholder={t.app.checklistAddPlaceholder}
        onToggle={(id) =>
          applyPatch({
            packingItems: state.packingItems.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
          })
        }
        onRemove={(id) => applyPatch({ packingItems: state.packingItems.filter((item) => item.id !== id) })}
        onAdd={(label) => applyPatch({ packingItems: [...state.packingItems, { id: makeId(), label, checked: false }] })}
      />

      <View style={styles.sectionDivider} />

      <ChecklistSection
        title={t.app.checklistShoppingTitle}
        items={state.shoppingItems}
        colors={colors}
        styles={styles}
        addPlaceholder={t.app.checklistAddPlaceholder}
        onToggle={(id) =>
          applyPatch({
            shoppingItems: state.shoppingItems.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
          })
        }
        onRemove={(id) => applyPatch({ shoppingItems: state.shoppingItems.filter((item) => item.id !== id) })}
        onAdd={(label) => applyPatch({ shoppingItems: [...state.shoppingItems, { id: makeId(), label, checked: false }] })}
      />
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
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 14
    },
    dateLabel: { fontSize: 12, fontWeight: "700", color: colors.primary },
    subTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider
    },
    itemCheckRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    itemLabel: { fontSize: 14, color: colors.textPrimary, flexShrink: 1 },
    itemLabelChecked: { color: colors.textTertiary, textDecorationLine: "line-through" },
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
    sectionDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 16 }
  });
}
