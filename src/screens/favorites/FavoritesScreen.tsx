import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { stopPointId } from "@/entities/itinerary/model/stop-point";
import { addItineraryStop, removeItineraryStop } from "@/shared/api/itineraries";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useEnsureItineraryLoaded } from "@/shared/model/use-ensure-itinerary";
import type { TabParamList } from "@/navigation/TabNavigator";
import { PoiRow } from "@/components/PoiRow";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { FavoritesMapPreview } from "@/components/favorites/FavoritesMapPreview";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type SubTab = "saved" | "history";
const HOURS_PER_DAY = 6;

export function FavoritesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const authStatus = useExplorerStore((state) => state.authStatus);
  const openAuthModal = useExplorerStore((state) => state.openAuthModal);
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const language = useExplorerStore((state) => state.language);
  const categories = useExplorerStore((state) => state.categories);
  const siteSettings = useExplorerStore((state) => state.siteSettings);
  const favorites = useExplorerStore((state) => state.favorites);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const clearFavoritePois = useExplorerStore((state) => state.clearFavoritePois);
  const clearVisitedPois = useExplorerStore((state) => state.clearVisitedPois);
  const clearViewedPois = useExplorerStore((state) => state.clearViewedPois);
  const setSelectedPoiId = useExplorerStore((state) => state.setSelectedPoiId);
  const setActiveRegion = useExplorerStore((state) => state.setActiveRegion);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItinerary = useExplorerStore((state) => state.setItinerary);

  const { isLoading } = useEnsureItineraryLoaded();
  const [subTab, setSubTab] = useState<SubTab>("saved");
  const [collapsedRegionIds, setCollapsedRegionIds] = useState<Set<string>>(new Set());

  const regionNameById = useMemo(
    () => new Map(regions.map((r) => [r.id, r.nameByLanguage[language] ?? r.name])),
    [regions, language]
  );
  const favoritePois = useMemo(() => pois.filter((p) => favorites.includes(p.id)), [pois, favorites]);
  const viewedPois = useMemo(() => pois.filter((p) => viewedPoiIds.includes(p.id)), [pois, viewedPoiIds]);
  const visitedPois = useMemo(() => pois.filter((p) => visitedPoiIds.includes(p.id)), [pois, visitedPoiIds]);

  const itineraryPoiIds = useMemo(
    () => new Set((itinerary?.stops ?? []).map((s) => stopPointId(s.point))),
    [itinerary]
  );

  const favoritesByRegion = useMemo(
    () =>
      regions
        .map((region) => ({ region, pois: favoritePois.filter((p) => p.regionId === region.id) }))
        .filter((group) => group.pois.length > 0),
    [regions, favoritePois]
  );

  const favoritesRegionProgress = useMemo(
    () =>
      favoritesByRegion.map(({ region, pois: regionPois }) => {
        const totalInRegion = pois.filter((p) => p.regionId === region.id).length;
        const percent = totalInRegion > 0 ? Math.round((regionPois.length / totalInRegion) * 100) : 0;
        return { region, count: regionPois.length, percent };
      }),
    [favoritesByRegion, pois]
  );

  const tripDays = useMemo(() => {
    if (favoritePois.length === 0) return 0;
    const totalMinutes = favoritePois.reduce((sum, p) => sum + p.durationMinutes, 0);
    return Math.max(1, Math.ceil(totalMinutes / (HOURS_PER_DAY * 60)));
  }, [favoritePois]);

  function goToPoi(poiId: string) {
    const poi = pois.find((p) => p.id === poiId);
    if (poi) setActiveRegion(poi.regionId);
    setSelectedPoiId(poiId);
    navigation.navigate("Map");
  }

  function toggleRegionCollapsed(regionId: string) {
    setCollapsedRegionIds((prev) => {
      const next = new Set(prev);
      if (next.has(regionId)) next.delete(regionId);
      else next.add(regionId);
      return next;
    });
  }

  async function handleAddToItinerary(poiId: string) {
    if (authStatus === "guest") {
      openAuthModal();
      return;
    }
    if (!itinerary) return;
    setItinerary(await addItineraryStop(itinerary.id, { poiId }));
  }

  async function handleRemoveFromItinerary(poiId: string) {
    if (!itinerary) return;
    const stop = itinerary.stops.find((s) => stopPointId(s.point) === poiId);
    if (!stop) return;
    setItinerary(await removeItineraryStop(itinerary.id, stop.id));
  }

  async function handleAddAllToItinerary() {
    if (authStatus === "guest") {
      openAuthModal();
      return;
    }
    if (!itinerary) return;
    const poiIds = favoritePois.filter((p) => !itineraryPoiIds.has(p.id)).map((p) => p.id);
    if (poiIds.length === 0) return;
    setItinerary(await addItineraryStop(itinerary.id, { poiIds }));
  }

  async function handleAddRegionToItinerary(regionId: string) {
    if (authStatus === "guest") {
      openAuthModal();
      return;
    }
    if (!itinerary) return;
    const poiIds = favoritePois.filter((p) => p.regionId === regionId && !itineraryPoiIds.has(p.id)).map((p) => p.id);
    if (poiIds.length === 0) return;
    setItinerary(await addItineraryStop(itinerary.id, { poiIds }));
  }

  function confirmClear(kind: "saved" | "visited" | "viewed") {
    const config = {
      saved: { label: t.auth.clearSaved, message: t.auth.clearSavedConfirm, action: clearFavoritePois },
      visited: { label: t.auth.clearVisited, message: t.auth.clearVisitedConfirm, action: clearVisitedPois },
      viewed: { label: t.auth.clearViewed, message: t.auth.clearViewedConfirm, action: clearViewedPois }
    }[kind];
    Alert.alert(config.label, config.message, [
      { text: t.auth.cancel, style: "cancel" },
      { text: config.label, style: "destructive", onPress: config.action }
    ]);
  }

  const hasFavoritesNotInItinerary = favoritePois.some((p) => !itineraryPoiIds.has(p.id));

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.subTabRow}>
          <TouchableOpacity
            style={[styles.subTabButton, subTab === "saved" && styles.subTabButtonActive]}
            onPress={() => setSubTab("saved")}
          >
            <Text style={[styles.subTabLabel, subTab === "saved" && styles.subTabLabelActive]}>{t.auth.saved}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTabButton, subTab === "history" && styles.subTabButtonActive]}
            onPress={() => setSubTab("history")}
          >
            <Text style={[styles.subTabLabel, subTab === "history" && styles.subTabLabelActive]}>{t.auth.history}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {subTab === "saved" ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitle}>
                <Ionicons name="bookmark" size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>{t.auth.savedPlaces}</Text>
              </View>
              {favoritePois.length > 0 ? (
                <View style={styles.headerLinks}>
                  {hasFavoritesNotInItinerary ? (
                    <TouchableOpacity onPress={handleAddAllToItinerary}>
                      <Text style={styles.linkText}>{t.auth.addAllToItinerary}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => confirmClear("saved")}>
                    <Text style={styles.linkTextDestructive}>{t.auth.clearSaved}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {favoritePois.length === 0 ? (
              <Text style={styles.emptyText}>{t.auth.noSavedPlaces}</Text>
            ) : (
              <>
                <View style={styles.statsCard}>
                  <View style={styles.statsRow}>
                    <View style={styles.statTile}>
                      <View style={[styles.statIconCircle, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name="bookmark" size={16} color={colors.primary} />
                      </View>
                      <Text style={styles.statValue}>{favoritePois.length}</Text>
                      <Text style={styles.statLabel}>{t.auth.favoritesStatsSaved}</Text>
                    </View>
                    <View style={styles.statTile}>
                      <View style={[styles.statIconCircle, { backgroundColor: "#e6f2fb" }]}>
                        <Ionicons name="map" size={16} color="#378adb" />
                      </View>
                      <Text style={styles.statValue}>{favoritesByRegion.length}</Text>
                      <Text style={styles.statLabel}>{t.auth.favoritesStatsRegions}</Text>
                    </View>
                    <View style={styles.statTile}>
                      <View style={[styles.statIconCircle, { backgroundColor: "#f0eefc" }]}>
                        <Ionicons name="navigate" size={16} color="#7f77dd" />
                      </View>
                      <Text style={styles.statValue}>
                        {tripDays} {t.auth.favoritesStatsDaysUnit}
                      </Text>
                      <Text style={styles.statLabel}>{t.auth.favoritesStatsDays}</Text>
                    </View>
                  </View>

                  <View style={styles.ctaBox}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                    <View style={styles.ctaTextBox}>
                      <Text style={styles.ctaTitle}>{t.auth.favoritesCtaTitle}</Text>
                      <Text style={styles.ctaBody}>{t.auth.favoritesCtaBody.replace("{days}", String(tripDays))}</Text>
                    </View>
                    <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate("Route")}>
                      <Text style={styles.ctaButtonLabel}>{t.auth.favoritesCtaButton}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {favoritesRegionProgress.length > 0 ? (
                  <View style={styles.progressCard}>
                    <View style={styles.sectionHeaderTitle}>
                      <Ionicons name="location" size={15} color={colors.icon} />
                      <Text style={styles.progressTitle}>{t.auth.favoritesProgressTitle}</Text>
                    </View>
                    {favoritesRegionProgress.map(({ region, count, percent }) => (
                      <View key={region.id} style={styles.progressRow}>
                        <Text style={styles.progressRegionName} numberOfLines={1}>
                          {regionNameById.get(region.id) ?? region.name}
                        </Text>
                        <Text style={styles.progressCount}>
                          {count} {t.auth.favoritesProgressPlacesUnit}
                        </Text>
                        <View style={styles.progressBarTrack}>
                          <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                        </View>
                        <Text style={styles.progressPercent}>{percent}%</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <FavoritesMapPreview
                  pois={favoritePois}
                  categories={categories}
                  mapStyleId={siteSettings?.mapStyleId}
                  onSelectPoi={goToPoi}
                  onOpenFullMap={() => navigation.navigate("Map")}
                />

                <View style={styles.regionList}>
                  {favoritesByRegion.map(({ region, pois: regionPois }) => {
                    const isCollapsed = collapsedRegionIds.has(region.id);
                    const hasMissing = regionPois.some((p) => !itineraryPoiIds.has(p.id));
                    return (
                      <View key={region.id} style={styles.regionCard}>
                        <TouchableOpacity style={styles.regionHeader} onPress={() => toggleRegionCollapsed(region.id)}>
                          <Ionicons name="location-outline" size={15} color={colors.icon} />
                          <Text style={styles.regionHeaderTitle}>
                            {regionNameById.get(region.id) ?? region.name} ({regionPois.length})
                          </Text>
                          {hasMissing ? (
                            <TouchableOpacity onPress={() => handleAddRegionToItinerary(region.id)} style={styles.regionAddButton}>
                              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                            </TouchableOpacity>
                          ) : null}
                          <Ionicons name={isCollapsed ? "chevron-forward" : "chevron-down"} size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                        {!isCollapsed
                          ? regionPois.map((poi, index) => {
                              const isInItinerary = itineraryPoiIds.has(poi.id);
                              return (
                                <AnimatedListItem key={poi.id} index={index}>
                                  <PoiRow
                                    poi={poi}
                                    regionName={regionNameById.get(poi.regionId) ?? ""}
                                    onSelect={() => goToPoi(poi.id)}
                                    action={
                                      <View style={styles.rowActions}>
                                        <TouchableOpacity
                                          style={[styles.itineraryPill, isInItinerary && styles.itineraryPillActive]}
                                          onPress={() =>
                                            isInItinerary ? handleRemoveFromItinerary(poi.id) : handleAddToItinerary(poi.id)
                                          }
                                        >
                                          <Text style={[styles.itineraryPillLabel, isInItinerary && styles.itineraryPillLabelActive]}>
                                            {isInItinerary ? t.auth.inItinerary : t.auth.addToItinerary}
                                          </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => toggleFavorite(poi.id)} style={styles.trashButton}>
                                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                                        </TouchableOpacity>
                                      </View>
                                    }
                                  />
                                </AnimatedListItem>
                              );
                            })
                          : null}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitle}>
                <Ionicons name="location" size={16} color={colors.icon} />
                <Text style={styles.sectionTitle}>{t.auth.visited}</Text>
              </View>
              {visitedPois.length > 0 ? (
                <TouchableOpacity onPress={() => confirmClear("visited")}>
                  <Text style={styles.linkTextDestructive}>{t.auth.clearVisited}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {visitedPois.length === 0 ? (
              <Text style={styles.emptyText}>{t.auth.noVisitedPlaces}</Text>
            ) : (
              visitedPois.map((poi, index) => (
                <AnimatedListItem key={poi.id} index={index}>
                  <PoiRow poi={poi} regionName={regionNameById.get(poi.regionId) ?? ""} onSelect={() => goToPoi(poi.id)} />
                </AnimatedListItem>
              ))
            )}

            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <View style={styles.sectionHeaderTitle}>
                <Ionicons name="eye" size={16} color={colors.icon} />
                <Text style={styles.sectionTitle}>{t.auth.viewed}</Text>
              </View>
              {viewedPois.length > 0 ? (
                <TouchableOpacity onPress={() => confirmClear("viewed")}>
                  <Text style={styles.linkTextDestructive}>{t.auth.clearViewed}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {viewedPois.length === 0 ? (
              <Text style={styles.emptyText}>{t.auth.noViewedPlaces}</Text>
            ) : (
              viewedPois.map((poi, index) => (
                <AnimatedListItem key={poi.id} index={index}>
                  <PoiRow poi={poi} regionName={regionNameById.get(poi.regionId) ?? ""} onSelect={() => goToPoi(poi.id)} />
                </AnimatedListItem>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { paddingTop: 50, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
    subTabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14 },
    subTabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
    subTabButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    subTabLabel: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
    subTabLabelActive: { color: colors.textInverse },
    scrollContent: { padding: 14, paddingBottom: 40 },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    sectionHeaderTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
    headerLinks: { flexDirection: "row", gap: 14 },
    linkText: { fontSize: 12, fontWeight: "700", color: colors.primary },
    linkTextDestructive: { fontSize: 12, fontWeight: "700", color: colors.danger },
    emptyText: { fontSize: 13, color: colors.textTertiary, paddingVertical: 20, textAlign: "center" },
    statsCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12 },
    statsRow: { flexDirection: "row", gap: 10 },
    statTile: { flex: 1, alignItems: "center", gap: 4 },
    statIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    statValue: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
    statLabel: { fontSize: 10, color: colors.textTertiary, textAlign: "center" },
    ctaBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.primarySoft, borderRadius: 12, padding: 12, marginTop: 12 },
    ctaTextBox: { flex: 1 },
    ctaTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
    ctaBody: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    ctaButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
    ctaButtonLabel: { color: colors.textInverse, fontSize: 11, fontWeight: "700" },
    progressCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, gap: 8 },
    progressTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
    progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    progressRegionName: { fontSize: 12, color: colors.textSecondary, width: 70 },
    progressCount: { fontSize: 11, color: colors.textTertiary, width: 52 },
    progressBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.divider, overflow: "hidden" },
    progressBarFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
    progressPercent: { fontSize: 11, color: colors.textSecondary, width: 34, textAlign: "right" },
    regionList: { gap: 12 },
    regionCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 12 },
    regionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    regionHeaderTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.textPrimary },
    regionAddButton: { padding: 2 },
    rowActions: { flexDirection: "row", alignItems: "center", gap: 6 },
    itineraryPill: { borderWidth: 1, borderColor: colors.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    itineraryPillActive: { backgroundColor: colors.primary },
    itineraryPillLabel: { fontSize: 11, fontWeight: "700", color: colors.primary },
    itineraryPillLabelActive: { color: colors.textInverse },
    trashButton: { padding: 4 }
  });
}
