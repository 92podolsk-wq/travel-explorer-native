import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import type { Language } from "@/shared/i18n/types";
import { AnimatedCenterModal } from "@/components/AnimatedModal";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" }
];

export const LANGUAGE_LABELS: Record<Language, string> = {
  ru: "Русский",
  en: "English"
};

type LanguagePickerModalProps = {
  visible: boolean;
  language: Language;
  onSelect: (language: Language) => void;
  onClose: () => void;
};

export function LanguagePickerModal({ visible, language, onSelect, onClose }: LanguagePickerModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AnimatedCenterModal visible={visible} onClose={onClose} backdropColor={colors.overlay} contentStyle={styles.card}>
      {LANGUAGE_OPTIONS.map((option) => {
        const isActive = option.value === language;
        return (
          <Pressable
            key={option.value}
            style={[styles.row, isActive && styles.rowActive]}
            onPress={() => {
              onSelect(option.value);
              onClose();
            }}
          >
            <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]}>{option.label}</Text>
            {isActive ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
          </Pressable>
        );
      })}
    </AnimatedCenterModal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 10
    },
    rowActive: { backgroundColor: colors.primarySoft },
    rowLabel: { fontSize: 15, color: colors.textSecondary },
    rowLabelActive: { color: colors.primary, fontWeight: "700" }
  });
}
