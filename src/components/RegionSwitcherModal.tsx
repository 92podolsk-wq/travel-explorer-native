import { useMemo } from "react";
import { Pressable, SectionList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/shared/ui/AppText";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import type { Region } from "@/entities/region/model/types";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { AnimatedCenterModal } from "@/components/AnimatedModal";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type CountryGroup = { country: Country; regions: Region[] };

type RegionSwitcherModalProps = {
  visible: boolean;
  regions: Region[];
  countries: Country[];
  areas: Area[];
  activeRegionIds: string[];
  onSelectRegion: (regionId: string) => void;
  onSelectCountry: (countryId: string) => void;
  onClose: () => void;
};

export function RegionSwitcherModal({
  visible,
  regions,
  countries,
  areas,
  activeRegionIds,
  onSelectRegion,
  onSelectCountry,
  onClose
}: RegionSwitcherModalProps) {
  const language = useExplorerStore((state) => state.language);
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const countryGroups = useMemo(() => {
    const groups: CountryGroup[] = [];
    for (const region of regions) {
      const area = areas.find((a) => a.id === region.areaId);
      const country = area ? countries.find((c) => c.id === area.countryId) : undefined;
      if (!country) continue;
      let group = groups.find((g) => g.country.id === country.id);
      if (!group) {
        group = { country, regions: [] };
        groups.push(group);
      }
      group.regions.push(region);
    }
    return groups;
  }, [regions, areas, countries]);

  const sections = countryGroups.map((group) => ({ title: group.country, data: group.regions }));

  return (
    <AnimatedCenterModal visible={visible} onClose={onClose} backdropColor={colors.overlay} contentStyle={styles.card}>
      <Text style={styles.title}>{t.app.chooseCity}</Text>
      <SectionList
        sections={sections}
        keyExtractor={(region) => region.id}
        renderSectionHeader={({ section }) => {
          const country = section.title;
          const countryRegionIds = section.data.map((region) => region.id);
          const isCountryActive =
            countryRegionIds.length > 0 &&
            activeRegionIds.length === countryRegionIds.length &&
            countryRegionIds.every((id) => activeRegionIds.includes(id));

          return (
            <Pressable
              style={[styles.countryRow, isCountryActive && styles.rowActive]}
              onPress={() => {
                onSelectCountry(country.id);
                onClose();
              }}
            >
              <Text style={[styles.countryLabel, isCountryActive && styles.rowLabelActive]}>
                {country.nameByLanguage[language] ?? country.name}
              </Text>
              <Text style={[styles.countryHint, isCountryActive && styles.rowLabelActive]}>{t.app.selectWholeCountry}</Text>
              {isCountryActive ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
            </Pressable>
          );
        }}
        renderItem={({ item }) => {
          const isActive = activeRegionIds.length === 1 && activeRegionIds[0] === item.id;
          return (
            <Pressable
              style={[styles.row, isActive && styles.rowActive]}
              onPress={() => {
                onSelectRegion(item.id);
                onClose();
              }}
            >
              <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]}>
                {item.nameByLanguage[language] ?? item.name}
              </Text>
            </Pressable>
          );
        }}
      />
    </AnimatedCenterModal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, maxHeight: "70%" },
    title: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: colors.textPrimary },
    countryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      marginTop: 6
    },
    countryLabel: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, color: colors.textSecondary },
    countryHint: { flex: 1, fontSize: 11, color: colors.textTertiary },
    row: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, marginLeft: 8 },
    rowActive: { backgroundColor: colors.primarySoft },
    rowLabel: { fontSize: 15, color: colors.textPrimary },
    rowLabelActive: { color: colors.primary, fontWeight: "700" }
  });
}
