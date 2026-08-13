import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { TextInput } from "@/shared/ui/AppTextInput";
import { customMarkerColors } from "@/entities/custom-marker/model/types";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { AnimatedCenterModal } from "@/components/AnimatedModal";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type AddMarkerModalProps = {
  visible: boolean;
  markerCount: number;
  markerLimit: number;
  onSave: (color: string, label: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
};

export function AddMarkerModal({ visible, markerCount, markerLimit, onSave, onCancel }: AddMarkerModalProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [color, setColor] = useState<string>(customMarkerColors[0]);
  const [label, setLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLimitReached = markerCount >= markerLimit;

  function handleCancel() {
    setLabel("");
    setColor(customMarkerColors[0]);
    setError(null);
    onCancel();
  }

  async function handleSave() {
    if (isLimitReached) {
      setError(t.app.markerLimitReached.replace("{limit}", String(markerLimit)));
      return;
    }
    setError(null);
    setIsSaving(true);
    const result = await onSave(color, label.trim());
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLabel("");
    setColor(customMarkerColors[0]);
  }

  return (
    <AnimatedCenterModal visible={visible} onClose={handleCancel} backdropColor={colors.overlay} contentStyle={styles.card}>
          <Text style={styles.title}>{t.app.newMarkerTitle}</Text>

          <View style={styles.colorRow}>
            {customMarkerColors.map((swatch) => (
              <TouchableOpacity
                key={swatch}
                onPress={() => setColor(swatch)}
                style={[styles.swatch, { backgroundColor: swatch }, color === swatch && styles.swatchActive]}
              />
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder={t.app.markerLabelPlaceholder}
            maxLength={60}
          />

          <Text style={styles.countLabel}>
            {t.app.markerCountLabel.replace("{count}", String(markerCount)).replace("{limit}", String(markerLimit))}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelLabel}>{t.app.markerCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving || isLimitReached}>
              {isSaving ? <ActivityIndicator color={colors.textInverse} size="small" /> : <Text style={styles.saveLabel}>{t.app.markerSave}</Text>}
            </TouchableOpacity>
          </View>
    </AnimatedCenterModal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 18 },
    title: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 },
    colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
    swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "transparent" },
    swatchActive: { borderColor: colors.textPrimary, transform: [{ scale: 1.1 }] },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      marginBottom: 10,
      color: colors.textPrimary
    },
    countLabel: { fontSize: 11, color: colors.textTertiary, marginBottom: 8 },
    error: { fontSize: 12, color: colors.danger, marginBottom: 8 },
    actionsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
    cancelButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 11 },
    cancelLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
    saveButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 11
    },
    saveLabel: { fontSize: 13, fontWeight: "700", color: colors.textInverse }
  });
}
