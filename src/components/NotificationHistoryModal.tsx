import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import {
  getNotificationHistory,
  markAllNotificationsRead,
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t.auth.notificationHistoryTitle}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.icon} />
          </TouchableOpacity>
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
            )}
          />
        )}
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
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
    title: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
    empty: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 10 },
    emptyLabel: { fontSize: 13, color: colors.textTertiary },
    listContent: { paddingHorizontal: 18, paddingTop: 10, gap: 4 },
    row: {
      flexDirection: "row",
      gap: 10,
      paddingVertical: 10,
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
    rowTime: { fontSize: 10, color: colors.textTertiary, marginTop: 4 }
  });
}
