import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { getChecklistsSharedWithMe } from "@/shared/api/checklist";
import type { SharedChecklist } from "@/entities/sharing/model/types";

export function SharedChecklistsCard() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const [shared, setShared] = useState<SharedChecklist[] | null>(null);
  const [openOwnerId, setOpenOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    getChecklistsSharedWithMe().then((body) => setShared(body.checklists));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (!currentUser || !shared || shared.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t.auth.sharedChecklistsTitle}</Text>
      {shared.map(({ owner, checklist }) => {
        const isOpen = openOwnerId === owner.id;
        const items = [
          ...checklist.packingItems,
          ...checklist.documentItems,
          ...checklist.shoppingItems,
          ...checklist.departureItems
        ];
        const checkedCount = items.filter((item) => item.checked).length;
        return (
          <View key={owner.id} style={styles.ownerBlock}>
            <TouchableOpacity style={styles.ownerRow} onPress={() => setOpenOwnerId(isOpen ? null : owner.id)}>
              <ProfileAvatar avatarId={owner.avatarId} size={26} />
              <Text style={styles.ownerName} numberOfLines={1}>
                {owner.name || `@${owner.username}`}
              </Text>
              <Text style={styles.ownerCount}>
                {checkedCount}/{items.length}
              </Text>
            </TouchableOpacity>
            {isOpen ? (
              <View style={styles.itemsList}>
                {items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Ionicons
                      name={item.checked ? "checkbox" : "square-outline"}
                      size={16}
                      color={item.checked ? colors.primary : colors.textTertiary}
                    />
                    <Text style={[styles.itemLabel, item.checked && styles.itemLabelChecked]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 },
    cardTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10
    },
    ownerBlock: { backgroundColor: colors.background, borderRadius: 10, padding: 10, marginBottom: 8 },
    ownerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    ownerName: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.textPrimary },
    ownerCount: { fontSize: 11, color: colors.textTertiary },
    itemsList: { marginTop: 8, gap: 6 },
    itemRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    itemLabel: { fontSize: 13, color: colors.textPrimary, flexShrink: 1 },
    itemLabelChecked: { color: colors.textTertiary, textDecorationLine: "line-through" }
  });
}
