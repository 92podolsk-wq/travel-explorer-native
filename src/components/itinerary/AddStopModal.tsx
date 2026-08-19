import { useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/shared/ui/AppText";
import { TextInput } from "@/shared/ui/AppTextInput";
import { AnimatedCenterModal } from "@/components/AnimatedModal";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Poi } from "@/entities/poi/model/types";
import { fuzzyMatch } from "@/shared/lib/fuzzy-match";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type AddStopModalProps = {
  visible: boolean;
  existingPoiIds: Set<string>;
  onSelect: (poiId: string) => void;
  onClose: () => void;
};

export function AddStopModal({ visible, existingPoiIds, onSelect, onClose }: AddStopModalProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const categories = useExplorerStore((state) => state.categories);
  const language = useExplorerStore((state) => state.language);
  const [searchQuery, setSearchQuery] = useState("");

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const regionNamesById = useMemo(
    () => new Map(regions.map((r) => [r.id, r.nameByLanguage[language] ?? r.name])),
    [regions, language]
  );

  function poiName(poi: Poi) {
    return poi.nameByLanguage?.[language] ?? poi.name;
  }

  const sections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query.length > 0 ? pois.filter((poi) => fuzzyMatch(poiName(poi), query)) : pois;

    const byRegion = new Map<string, Poi[]>();
    for (const poi of filtered) {
      const list = byRegion.get(poi.regionId);
      if (list) list.push(poi);
      else byRegion.set(poi.regionId, [poi]);
    }

    return Array.from(byRegion.entries())
      .map(([regionId, regionPois]) => ({
        title: regionNamesById.get(regionId) ?? regionId,
        data: [...regionPois].sort((a, b) => poiName(a).localeCompare(poiName(b)))
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois, searchQuery, regionNamesById, language]);

  return (
    <AnimatedCenterModal visible={visible} onClose={onClose} backdropColor={colors.overlay} contentStyle={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.auth.addLocationTitle}</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={15} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.app.searchPlaceholder}
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(poi) => poi.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>{t.auth.addLocationEmpty}</Text>}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => {
          const isAdded = existingPoiIds.has(item.id);
          const category = categoriesById.get(item.category);
          return (
            <Pressable
              style={[styles.row, isAdded && styles.rowAdded]}
              onPress={() => !isAdded && onSelect(item.id)}
              disabled={isAdded}
            >
              <View style={[styles.iconCircle, { backgroundColor: category?.color ?? colors.textTertiary }]}>
                <CategoryIcon icon={item.category} size={13} />
              </View>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {poiName(item)}
              </Text>
              {isAdded ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              ) : (
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              )}
            </Pressable>
          );
        }}
      />
    </AnimatedCenterModal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, maxHeight: "78%" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    title: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 8
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
    list: { flexGrow: 0 },
    empty: { fontSize: 13, color: colors.textTertiary, textAlign: "center", paddingVertical: 24 },
    sectionHeader: {
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      color: colors.textTertiary,
      backgroundColor: colors.surface,
      paddingTop: 10,
      paddingBottom: 4
    },
    row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 },
    rowAdded: { opacity: 0.5 },
    iconCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    rowLabel: { flex: 1, fontSize: 14, color: colors.textPrimary }
  });
}
