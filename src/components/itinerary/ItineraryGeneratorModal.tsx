import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Region } from "@/entities/region/model/types";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type GeneratorSource = "favorites" | "recommended";

type ItineraryGeneratorModalProps = {
  visible: boolean;
  regions: Region[];
  onClose: () => void;
  onSubmit: (input: { regionId: string; days: number; hoursPerDay: number; source: GeneratorSource }) => Promise<void>;
};

export function ItineraryGeneratorModal({ visible, regions, onClose, onSubmit }: ItineraryGeneratorModalProps) {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const language = useExplorerStore((state) => state.language);
  const [regionId, setRegionId] = useState<string | null>(regions[0]?.id ?? null);
  const [days, setDays] = useState("3");
  const [hoursPerDay, setHoursPerDay] = useState("8");
  const [source, setSource] = useState<GeneratorSource>("favorites");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!regionId) return;
    const clampedDays = Math.min(14, Math.max(1, Number(days) || 1));
    const clampedHours = Math.min(14, Math.max(1, Number(hoursPerDay) || 1));
    setIsGenerating(true);
    setError(null);
    try {
      await onSubmit({ regionId, days: clampedDays, hoursPerDay: clampedHours, source });
    } catch {
      setError(t.auth.generateItineraryEmpty);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t.auth.buildRoute}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t.auth.city}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionRow}>
            {regions.map((region) => (
              <TouchableOpacity
                key={region.id}
                style={[styles.regionChip, region.id === regionId && styles.regionChipActive]}
                onPress={() => setRegionId(region.id)}
              >
                <Text style={[styles.regionChipLabel, region.id === regionId && styles.regionChipLabelActive]}>
                  {region.nameByLanguage[language] ?? region.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>{t.auth.source}</Text>
          <View style={styles.sourceRow}>
            <TouchableOpacity
              style={[styles.sourceButton, source === "favorites" && styles.sourceButtonActive]}
              onPress={() => setSource("favorites")}
            >
              <Text style={[styles.sourceLabel, source === "favorites" && styles.sourceLabelActive]}>
                {t.auth.generateItinerarySourceFavorites}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sourceButton, source === "recommended" && styles.sourceButtonActive]}
              onPress={() => setSource("recommended")}
            >
              <Text style={[styles.sourceLabel, source === "recommended" && styles.sourceLabelActive]}>
                {t.auth.generateItinerarySourceRecommended}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldsRow}>
            <View style={styles.field}>
              <Text style={styles.label}>{t.auth.days}</Text>
              <TextInput style={styles.input} value={days} onChangeText={setDays} keyboardType="number-pad" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t.auth.hoursPerDay}</Text>
              <TextInput style={styles.input} value={hoursPerDay} onChangeText={setHoursPerDay} keyboardType="number-pad" />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isGenerating || !regionId}>
            {isGenerating ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.submitLabel}>{t.auth.generateItinerarySubmit}</Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    title: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
    label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6, marginTop: 10 },
    regionRow: { gap: 8, paddingVertical: 2 },
    regionChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    regionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    regionChipLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
    regionChipLabelActive: { color: colors.textInverse },
    sourceRow: { flexDirection: "row", gap: 8 },
    sourceButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
    sourceButtonActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    sourceLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
    sourceLabelActive: { color: colors.primary },
    fieldsRow: { flexDirection: "row", gap: 12 },
    field: { flex: 1 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
    error: { color: colors.danger, fontSize: 13, marginTop: 10 },
    submitButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 20 },
    submitLabel: { color: colors.textInverse, fontSize: 15, fontWeight: "700" }
  });
}
