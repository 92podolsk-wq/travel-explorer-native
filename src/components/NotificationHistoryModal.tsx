import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import { Text } from "@/shared/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { AnimatedBottomSheet } from "@/components/AnimatedModal";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import {
  clearNotificationHistory,
  getNotificationHistory,
  markAllNotificationsRead,
  removeNotificationHistoryEntry,
  type NotificationHistoryEntry
} from "@/shared/storage/notification-history";

type NotificationHistoryModalProps = {
  visible: boolean;
  onClose: () => void;
};

function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function NotificationHistoryModal({ visible, onClose }: NotificationHistoryModalProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [entries, setEntries] = useState<NotificationHistoryEntry[]>([]);

  useEffect(() => {
    if (!visible) return;
    getNotificationHistory().then(setEntries);
    markAllNotificationsRead().catch(() => {});
  }, [visible]);

  async function handleRemove(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    await removeNotificationHistoryEntry(id).catch(() => {});
  }

  async function handleClearAll() {
    setEntries([]);
    await clearNotificationHistory().catch(() => {});
  }

  return (
    <AnimatedBottomSheet visible={visible} onClose={onClose} backdropColor={colors.overlay} contentStyle={styles.sheet}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t.auth.notificationHistoryTitle}</Text>
          <View style={styles.headerActions}>
            {entries.length > 0 ? (
              <TouchableOpacity onPress={() => void handleClearAll()} hitSlop={10} style={styles.clearAllButton}>
                <Text style={styles.clearAllLabel}>{t.auth.notificationHistoryClearAll}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={30} color={colors.textTertiary} />
            <Text style={styles.emptyLabel}>{t.auth.notificationHistoryEmpty}</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(entry) => entry.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={() => (
                  <TouchableOpacity style={styles.deleteAction} onPress={() => void handleRemove(item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.deleteActionLabel}>{t.auth.notificationHistoryDelete}</Text>
                  </TouchableOpacity>
                )}
                overshootRight={false}
              >
                <View style={styles.row}>
                  <View style={styles.rowIcon}>
                    <Ionicons name="location" size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowBody}>{item.body}</Text>
                    <Text style={styles.rowTime}>{formatTimestamp(item.receivedAt)}</Text>
                  </View>
                </View>
              </Swipeable>
            )}
          />
        )}
      </GestureHandlerRootView>
    </AnimatedBottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    gestureRoot: { flexShrink: 1 },
    handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#ddd", marginBottom: 12 },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
    title: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
    clearAllButton: { paddingVertical: 4 },
    clearAllLabel: { fontSize: 12, fontWeight: "700", color: colors.danger },
    empty: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 10 },
    emptyLabel: { fontSize: 13, color: colors.textTertiary },
    listContent: { paddingHorizontal: 18, paddingTop: 10, gap: 4 },
    row: {
      flexDirection: "row",
      gap: 10,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider
    },
    rowIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center"
    },
    rowTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
    rowBody: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    rowTime: { fontSize: 10, color: colors.textTertiary, marginTop: 4 },
    deleteAction: {
      width: 76,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      backgroundColor: colors.danger,
      marginBottom: 1
    },
    deleteActionLabel: { fontSize: 10, fontWeight: "700", color: "#fff" }
  });
}
