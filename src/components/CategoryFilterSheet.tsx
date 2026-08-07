import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Category } from "@/entities/category/model/types";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type CategoryFilterSheetProps = {
  visible: boolean;
  categories: Category[];
  selectedCategories: string[];
  onToggle: (categoryId: string) => void;
  onClose: () => void;
};

export function CategoryFilterSheet({ visible, categories, selectedCategories, onToggle, onClose }: CategoryFilterSheetProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const language = useExplorerStore((state) => state.language);
  const selectAllCategories = useExplorerStore((state) => state.selectAllCategories);
  const clearAllCategories = useExplorerStore((state) => state.clearAllCategories);

  const visibleCategories = categories.filter((category) => !category.isHidden);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t.app.categoryFiltersTitle}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={selectAllCategories}>
            <Text style={styles.actionLabel}>{t.app.categoryFiltersSelectAll}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={clearAllCategories}>
            <Text style={styles.actionLabel}>{t.app.categoryFiltersClearAll}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {visibleCategories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <TouchableOpacity key={category.id} style={styles.row} onPress={() => onToggle(category.id)}>
                <View style={[styles.rowIcon, { backgroundColor: category.color }]}>
                  <CategoryIcon icon={category.icon} size={15} />
                </View>
                <Text style={styles.rowLabel}>{category.nameByLanguage[language] ?? category.name}</Text>
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={22}
                  color={isSelected ? colors.primary : colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
          <Text style={styles.doneButtonLabel}>{t.app.categoryFiltersDone}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.overlay },
    sheet: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: "75%",
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 10,
      paddingBottom: 24
    },
    handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#ddd", marginBottom: 12 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18
    },
    title: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
    actionsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 18, marginTop: 14 },
    actionButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 9,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border
    },
    actionLabel: { fontSize: 12, fontWeight: "700", color: colors.primary },
    list: { marginTop: 8 },
    listContent: { paddingHorizontal: 18, paddingBottom: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: colors.background
    },
    rowIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    rowLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.textPrimary },
    doneButton: {
      marginTop: 14,
      marginHorizontal: 18,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: "center"
    },
    doneButtonLabel: { color: colors.textInverse, fontSize: 14, fontWeight: "700" }
  });
}
