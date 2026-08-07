import { useMemo } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { Region } from "@/entities/region/model/types";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type RegionSwitcherModalProps = {
  visible: boolean;
  regions: Region[];
  activeRegionId: string | null;
  onSelect: (regionId: string) => void;
  onClose: () => void;
};

export function RegionSwitcherModal({ visible, regions, activeRegionId, onSelect, onClose }: RegionSwitcherModalProps) {
  const language = useExplorerStore((state) => state.language);
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t.app.chooseCity}</Text>
          <FlatList
            data={regions}
            keyExtractor={(region) => region.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.row, item.id === activeRegionId && styles.rowActive]}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <Text style={[styles.rowLabel, item.id === activeRegionId && styles.rowLabelActive]}>
                  {item.nameByLanguage[language] ?? item.name}
                </Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", padding: 24 },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, maxHeight: "70%" },
    title: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: colors.textPrimary },
    row: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10 },
    rowActive: { backgroundColor: colors.primarySoft },
    rowLabel: { fontSize: 15, color: colors.textPrimary },
    rowLabelActive: { color: colors.primary, fontWeight: "700" }
  });
}
