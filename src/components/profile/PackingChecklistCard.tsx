import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import {
  getChecklistState,
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
  const [state, setState] = useState<PackingChecklistState | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    getChecklistState().then(setState);
  }, []);

  async function applyPatch(patch: Partial<Pick<PackingChecklistState, "tripDate" | "packingItems" | "shoppingItems">>) {
    if (!state) return;
    const updated = await updateChecklistState(state, patch);
    setState(updated);
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
      <Text style={styles.cardTitle}>{t.app.checklistCardTitle}</Text>

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
    cardTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10
    },
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
