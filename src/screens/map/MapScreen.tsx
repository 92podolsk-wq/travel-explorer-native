import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Supercluster from "supercluster";
import {
  Camera,
  type CameraRef,
  Map as MapLibreMap,
  type MapRef,
  Marker,
  UserLocation,
  useCurrentPosition
} from "@maplibre/maplibre-react-native";
import { fuzzyMatch } from "@/shared/lib/fuzzy-match";
import { shuffle } from "@/shared/lib/shuffle";
import { haversineDistanceMeters } from "@/shared/lib/geo";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { resolveMapStyleUrl } from "@/shared/map/map-styles";
import {
  deleteRegionOffline,
  deleteRegionPhotos,
  downloadRegionOffline,
  downloadRegionPhotos,
  getDownloadedRegionIds,
  type OfflineProgress
} from "@/shared/map/offline-maps";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { createCustomMarker, deleteCustomMarker, listCustomMarkers } from "@/shared/api/custom-markers";
import { addItineraryStop, removeItineraryStop } from "@/shared/api/itineraries";
import { CategoryFilterSheet } from "@/components/CategoryFilterSheet";
import { RegionSwitcherModal } from "@/components/RegionSwitcherModal";
import { PoiDetailSheet } from "@/components/PoiDetailSheet";
import { PoiPreviewCard } from "@/components/map/PoiPreviewCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { AddMarkerModal } from "@/components/map/AddMarkerModal";
import { WeatherChips } from "@/components/map/WeatherChips";
import { SeasonReminderBanner } from "@/components/map/SeasonReminderBanner";
import { SwipeDiscoveryModal } from "@/widgets/swipe-discovery/SwipeDiscoveryModal";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { HankoSeal } from "@/shared/ui/HankoSeal";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

export function MapScreen() {
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const categories = useExplorerStore((state) => state.categories);
  const siteSettings = useExplorerStore((state) => state.siteSettings);
  const activeRegionId = useExplorerStore((state) => state.activeRegionId);
  const setActiveRegionId = useExplorerStore((state) => state.setActiveRegionId);
  const selectedCategories = useExplorerStore((state) => state.selectedCategories);
  const toggleCategory = useExplorerStore((state) => state.toggleCategory);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const setSearchQuery = useExplorerStore((state) => state.setSearchQuery);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const setSelectedPoiId = useExplorerStore((state) => state.setSelectedPoiId);
  const language = useExplorerStore((state) => state.language);
  const authStatus = useExplorerStore((state) => state.authStatus);
  const openAuthModal = useExplorerStore((state) => state.openAuthModal);
  const customMarkers = useExplorerStore((state) => state.customMarkers);
  const customMarkerLimit = useExplorerStore((state) => state.customMarkerLimit);
  const setCustomMarkers = useExplorerStore((state) => state.setCustomMarkers);
  const addCustomMarkerToState = useExplorerStore((state) => state.addCustomMarkerToState);
  const removeCustomMarkerFromState = useExplorerStore((state) => state.removeCustomMarkerFromState);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const countries = useExplorerStore((state) => state.countries);
  const areas = useExplorerStore((state) => state.areas);
  const favorites = useExplorerStore((state) => state.favorites);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const markPoiViewed = useExplorerStore((state) => state.markPoiViewed);
  const isSwipeOpen = useExplorerStore((state) => state.isSwipeOpen);
  const setIsSwipeOpen = useExplorerStore((state) => state.setIsSwipeOpen);
  const downloadedRegionIds = useExplorerStore((state) => state.downloadedRegionIds);
  const downloadingProgress = useExplorerStore((state) => state.downloadingProgress);
  const setDownloadedRegionIds = useExplorerStore((state) => state.setDownloadedRegionIds);
  const setRegionDownloadProgress = useExplorerStore((state) => state.setRegionDownloadProgress);
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isRegionPickerOpen, setIsRegionPickerOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [pendingMarkerCoords, setPendingMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [previewPoiId, setPreviewPoiId] = useState<string | null>(null);

  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);
  const markerPressedAtRef = useRef(0);
  const previewCenterRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    listCustomMarkers()
      .then(({ markers, limit }) => setCustomMarkers(markers, limit))
      .catch(() => {});
  }, [authStatus, setCustomMarkers]);

  useEffect(() => {
    getDownloadedRegionIds().then(setDownloadedRegionIds).catch(() => {});
  }, [setDownloadedRegionIds]);

  async function handleDownloadActiveRegion() {
    if (!activeRegion) return;
    const mapStyleUrl = resolveMapStyleUrl(siteSettings?.mapStyleId ?? "openfreemap-bright");
    const regionPois = pois.filter((p) => p.regionId === activeRegion.id);
    setRegionDownloadProgress(activeRegion.id, 0);
    try {
      await downloadRegionOffline(activeRegion, mapStyleUrl, (progress: OfflineProgress) => {
        if (progress.state !== "complete") {
          setRegionDownloadProgress(activeRegion.id, progress.percentage * 0.7);
        }
      });
      await downloadRegionPhotos(regionPois, (done, total) => {
        const photoPercent = total > 0 ? (done / total) * 30 : 30;
        setRegionDownloadProgress(activeRegion.id, 70 + photoPercent);
      });
      setRegionDownloadProgress(activeRegion.id, null);
      setDownloadedRegionIds([...downloadedRegionIds, activeRegion.id]);
    } catch {
      setRegionDownloadProgress(activeRegion.id, null);
      Alert.alert(t.auth.offlineMapDownloadError);
    }
  }

  function handleDeleteActiveRegion() {
    if (!activeRegion) return;
    const regionName = activeRegion.nameByLanguage[language] ?? activeRegion.name;
    Alert.alert(t.auth.offlineMapDeleteConfirm.replace("{name}", regionName), t.auth.offlineMapDeleteConfirmBody, [
      { text: t.auth.cancel, style: "cancel" },
      {
        text: t.auth.delete,
        style: "destructive",
        onPress: async () => {
          await deleteRegionOffline(activeRegion.id);
          deleteRegionPhotos(pois.filter((p) => p.regionId === activeRegion.id));
          setDownloadedRegionIds(downloadedRegionIds.filter((id) => id !== activeRegion.id));
        }
      }
    ]);
  }

  function handleMapLongPress(lat: number, lng: number) {
    if (authStatus !== "authenticated") {
      openAuthModal();
      return;
    }
    setPendingMarkerCoords({ lat, lng });
  }

  async function handleSaveMarker(color: string, label: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!pendingMarkerCoords) return { ok: false, error: t.app.markerSaveError };
    try {
      const marker = await createCustomMarker({ lat: pendingMarkerCoords.lat, lng: pendingMarkerCoords.lng, color, label });
      addCustomMarkerToState(marker);
      setPendingMarkerCoords(null);
      return { ok: true };
    } catch {
      return { ok: false, error: t.app.markerSaveError };
    }
  }

  async function handleMarkerPress(markerId: string) {
    const marker = customMarkers.find((m) => m.id === markerId);
    if (!marker) return;
    const stop = itinerary?.stops.find((s) => s.point.kind === "marker" && s.point.marker.id === markerId);
    const options: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [];

    if (itinerary) {
      if (stop) {
        options.push({
          text: t.app.removeMarkerFromItinerary,
          onPress: async () => {
            const updated = await removeItineraryStop(itinerary.id, stop.id);
            setItinerary(updated);
          }
        });
      } else {
        options.push({
          text: t.app.addMarkerToItinerary,
          onPress: async () => {
            const updated = await addItineraryStop(itinerary.id, { customMarkerId: markerId });
            setItinerary(updated);
          }
        });
      }
    }

    options.push({
      text: t.app.deleteMarker,
      style: "destructive",
      onPress: () => {
        Alert.alert(t.app.deleteMarker, t.app.deleteMarkerConfirm, [
          { text: t.auth.cancel, style: "cancel" },
          {
            text: t.auth.delete,
            style: "destructive",
            onPress: async () => {
              removeCustomMarkerFromState(markerId);
              await deleteCustomMarker(markerId).catch(() => {});
            }
          }
        ]);
      }
    });
    options.push({ text: t.auth.cancel, style: "cancel" });

    Alert.alert(marker.label || t.app.newMarkerTitle, undefined, options);
  }

  const selectedPoi = useMemo(() => pois.find((p) => p.id === selectedPoiId) ?? null, [pois, selectedPoiId]);

  useEffect(() => {
    if (!selectedPoi) return;
    cameraRef.current?.flyTo({
      center: [selectedPoi.coordinates.lng, selectedPoi.coordinates.lat],
      zoom: 15,
      duration: 600
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoiId]);

  const activeRegion = useMemo(() => regions.find((r) => r.id === activeRegionId) ?? null, [regions, activeRegionId]);
  const isRegionDownloaded = activeRegion ? downloadedRegionIds.includes(activeRegion.id) : false;
  const activeRegionDownloadProgress = activeRegion ? downloadingProgress[activeRegion.id] : undefined;

  const visiblePois = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pois.filter((poi) => {
      if (poi.regionId !== activeRegionId) return false;
      if (!selectedCategories.includes(poi.category)) return false;
      if (query.length > 0 && !fuzzyMatch(poi.name, query)) return false;
      return true;
    });
  }, [pois, activeRegionId, selectedCategories, searchQuery]);

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const visibleCategoryCount = useMemo(() => categories.filter((c) => !c.isHidden).length, [categories]);
  const poisById = useMemo(() => new Map(visiblePois.map((poi) => [poi.id, poi])), [visiblePois]);
  const previewPoi = previewPoiId ? poisById.get(previewPoiId) : undefined;

  useEffect(() => {
    if (previewPoi) {
      const center: [number, number] = [previewPoi.coordinates.lng, previewPoi.coordinates.lat];
      previewCenterRef.current = center;
      cameraRef.current?.flyTo({ center, padding: { bottom: 320 }, duration: 450 });
    } else if (previewCenterRef.current) {
      cameraRef.current?.flyTo({ center: previewCenterRef.current, padding: { bottom: 0 }, duration: 300 });
      previewCenterRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPoiId]);

  const [regionView, setRegionView] = useState<{ zoom: number; bounds: [number, number, number, number] }>(() => ({
    zoom: activeRegion?.defaultZoom ?? 12,
    bounds: [-180, -85, 180, 85]
  }));

  const clusterIndex = useMemo(() => {
    const index = new Supercluster<{ poiId: string }>({ radius: 50, maxZoom: 17 });
    index.load(
      visiblePois.map((poi) => ({
        type: "Feature",
        properties: { poiId: poi.id },
        geometry: { type: "Point", coordinates: [poi.coordinates.lng, poi.coordinates.lat] }
      }))
    );
    return index;
  }, [visiblePois]);

  const mapClusters = useMemo(
    () => clusterIndex.getClusters(regionView.bounds, Math.round(regionView.zoom)),
    [clusterIndex, regionView]
  );

  function handleClusterPress(clusterId: number, center: [number, number]) {
    const expansionZoom = Math.min(clusterIndex.getClusterExpansionZoom(clusterId), 20);
    cameraRef.current?.flyTo({ center, zoom: expansionZoom, duration: 400 });
  }

  const swipeCandidates = useMemo(() => {
    const regionPois = pois.filter((poi) => poi.regionId === activeRegionId);
    const unswiped = regionPois.filter((poi) => !favorites.includes(poi.id) && !viewedPoiIds.includes(poi.id));
    return shuffle(unswiped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois, activeRegionId, isSwipeOpen]);

  const neighboringSwipeRegions = useMemo(() => {
    if (!activeRegion) return [];
    const activeCountryId = areas.find((area) => area.id === activeRegion.areaId)?.countryId;
    if (!activeCountryId) return [];
    return regions
      .filter((region) => region.status === "published" && region.id !== activeRegionId)
      .filter((region) => areas.find((area) => area.id === region.areaId)?.countryId === activeCountryId)
      .map((region) => ({
        id: region.id,
        name: region.nameByLanguage[language] ?? region.name,
        distance: haversineDistanceMeters(activeRegion.center, region.center),
        count: pois.filter((poi) => poi.regionId === region.id && !favorites.includes(poi.id) && !viewedPoiIds.includes(poi.id))
          .length
      }))
      .filter((region) => region.count > 0)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [activeRegion, activeRegionId, areas, regions, pois, favorites, viewedPoiIds, language]);

  const mapStyle = resolveMapStyleUrl(siteSettings?.mapStyleId ?? "openfreemap-bright");
  const position = useCurrentPosition();

  function handleLocateMe() {
    if (!position) return;
    cameraRef.current?.flyTo({
      center: [position.coords.longitude, position.coords.latitude],
      zoom: 14,
      duration: 600
    });
  }

  async function handleZoom(delta: number) {
    const [center, zoom] = await Promise.all([mapRef.current?.getCenter(), mapRef.current?.getZoom()]);
    if (!center || zoom == null) return;
    cameraRef.current?.flyTo({ center, zoom: zoom + delta, duration: 300 });
  }

  if (!activeRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const activeRegionName = activeRegion.nameByLanguage[language] ?? activeRegion.name;

  return (
    <View style={styles.container}>
      <MapLibreMap
        ref={mapRef}
        style={styles.map}
        mapStyle={mapStyle}
        logo={false}
        onPress={() => {
          if (Date.now() - markerPressedAtRef.current < 300) return;
          setPreviewPoiId(null);
        }}
        onLongPress={(event) => {
          const [lng, lat] = event.nativeEvent.lngLat;
          handleMapLongPress(lat, lng);
        }}
        onRegionDidChange={(event) => {
          const { zoom, bounds } = event.nativeEvent;
          setRegionView({ zoom, bounds });
        }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: [activeRegion.center.lng, activeRegion.center.lat], zoom: activeRegion.defaultZoom }}
        />
        <UserLocation animated accuracy heading />
        {customMarkers.map((marker) => (
          <Marker key={marker.id} id={marker.id} lngLat={[marker.lng, marker.lat]} onPress={() => handleMarkerPress(marker.id)}>
            <View style={[styles.customPin, { backgroundColor: marker.color }]}>
              <Ionicons name="location" size={14} color={colors.textInverse} />
            </View>
          </Marker>
        ))}
        {mapClusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;

          if ("cluster" in feature.properties) {
            const clusterId = feature.properties.cluster_id;
            return (
              <Marker
                key={`cluster-${clusterId}`}
                id={`cluster-${clusterId}`}
                lngLat={[lng, lat]}
                onPress={() => handleClusterPress(clusterId, [lng, lat])}
              >
                <View style={styles.clusterPin}>
                  <Text style={styles.clusterPinLabel}>{feature.properties.point_count_abbreviated}</Text>
                </View>
              </Marker>
            );
          }

          const poi = poisById.get(feature.properties.poiId);
          if (!poi) return null;
          const category = categoriesById.get(poi.category);
          return (
            <Marker
              key={poi.id}
              id={poi.id}
              lngLat={[lng, lat]}
              onPress={() => {
                markerPressedAtRef.current = Date.now();
                setPreviewPoiId(poi.id);
              }}
            >
              <View style={[styles.pin, { backgroundColor: category?.color ?? "#7a7a7a" }]}>
                <CategoryIcon icon={category?.icon ?? ""} size={13} />
              </View>
            </Marker>
          );
        })}
      </MapLibreMap>

      {previewPoi ? (
        <View style={styles.previewOverlay} pointerEvents="box-none">
          <PoiPreviewCard
            key={previewPoi.id}
            poi={previewPoi}
            category={categoriesById.get(previewPoi.category)}
            regionName={activeRegionName}
            language={language}
            isFavorite={favorites.includes(previewPoi.id)}
            onView={() => {
              setSelectedPoiId(previewPoi.id);
              setPreviewPoiId(null);
            }}
            onClose={() => setPreviewPoiId(null)}
            onToggleFavorite={() => toggleFavorite(previewPoi.id)}
          />
        </View>
      ) : null}

      <View style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[colors.heroGradientStart, colors.heroGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroDecorCircleLarge} pointerEvents="none" />
            <View style={styles.heroDecorCircleSmall} pointerEvents="none" />

            <TouchableOpacity style={styles.heroTitleRow} onPress={() => setIsRegionPickerOpen(true)} activeOpacity={0.7}>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {activeRegionName}
              </Text>
              <HankoSeal character={activeRegion.sealCharacter} size={22} />
              <Ionicons name="chevron-down" size={16} color={colors.heroTextMuted} style={{ marginLeft: 2 }} />
            </TouchableOpacity>

            <WeatherChips
              regionId={activeRegion.id}
              latitude={activeRegion.center.lat}
              longitude={activeRegion.center.lng}
              timeZoneOffsetHours={activeRegion.timezoneOffsetHours}
            />
          </LinearGradient>

          <View style={styles.heroBody}>
            <SeasonReminderBanner
              regionId={activeRegion.id}
              regionName={activeRegionName}
              seasonWindows={activeRegion.seasonWindows}
            />

            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder={t.app.searchPlaceholder}
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.categoryFilterButton} onPress={() => setIsCategorySheetOpen(true)}>
                <Ionicons name="options-outline" size={15} color={colors.primary} />
                <Text style={styles.categoryFilterButtonLabel}>
                  {selectedCategories.length}/{visibleCategoryCount}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.zoomControl}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom(1)}>
          <Ionicons name="add" size={20} color={colors.icon} />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom(-1)}>
          <Ionicons name="remove" size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.locateButton} onPress={handleLocateMe}>
        <Ionicons name="locate" size={22} color={colors.primary} />
      </TouchableOpacity>

      {activeRegion ? (
        <TouchableOpacity
          style={styles.offlineButton}
          onPress={isRegionDownloaded ? handleDeleteActiveRegion : handleDownloadActiveRegion}
          disabled={activeRegionDownloadProgress != null}
        >
          {activeRegionDownloadProgress != null ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name={isRegionDownloaded ? "checkmark-circle" : "cloud-download-outline"} size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      ) : null}

      <AnimatedPressable
        style={styles.discoverButton}
        onPress={() => setIsSwipeOpen(true)}
        hitSlop={4}
        accessibilityLabel={t.app.swipeDiscovery}
      >
        <Text style={styles.discoverButtonEmoji}>🎲</Text>
      </AnimatedPressable>

      <RegionSwitcherModal
        visible={isRegionPickerOpen}
        regions={regions}
        activeRegionId={activeRegionId}
        onSelect={(regionId) => {
          setActiveRegionId(regionId);
          const region = regions.find((r) => r.id === regionId);
          if (region) {
            cameraRef.current?.flyTo({ center: [region.center.lng, region.center.lat], zoom: region.defaultZoom, duration: 800 });
          }
        }}
        onClose={() => setIsRegionPickerOpen(false)}
      />

      <PoiDetailSheet poi={selectedPoi} onClose={() => setSelectedPoiId(null)} />

      <AddMarkerModal
        visible={pendingMarkerCoords != null}
        markerCount={customMarkers.length}
        markerLimit={customMarkerLimit}
        onSave={handleSaveMarker}
        onCancel={() => setPendingMarkerCoords(null)}
      />

      <CategoryFilterSheet
        visible={isCategorySheetOpen}
        categories={categories}
        selectedCategories={selectedCategories}
        onToggle={toggleCategory}
        onClose={() => setIsCategorySheetOpen(false)}
      />

      {isSwipeOpen && (
        <SwipeDiscoveryModal
          key={activeRegionId}
          pois={swipeCandidates}
          language={language}
          onLike={toggleFavorite}
          onSkip={markPoiViewed}
          onClose={() => setIsSwipeOpen(false)}
          neighboringRegions={neighboringSwipeRegions}
          onSwitchRegion={(regionId) => {
            setActiveRegionId(regionId);
          }}
        />
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    map: { flex: 1 },
    previewOverlay: {
      position: "absolute",
      left: 16,
      right: 76,
      bottom: 88,
      alignItems: "center"
    },
    pin: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 2,
      elevation: 3
    },
    customPin: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3
    },
    clusterPin: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 2,
      borderColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4
    },
    clusterPinLabel: { color: colors.textInverse, fontSize: 13, fontWeight: "800" },
    topOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
    heroCard: {
      overflow: "hidden",
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 22,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 5
    },
    heroGradient: { paddingTop: 44, paddingBottom: 10, paddingHorizontal: 14, position: "relative", overflow: "hidden" },
    heroDecorCircleLarge: {
      position: "absolute",
      top: -30,
      right: -30,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: "rgba(255,255,255,0.07)"
    },
    heroDecorCircleSmall: {
      position: "absolute",
      bottom: -20,
      left: 40,
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "rgba(255,255,255,0.06)"
    },
    heroTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
    heroTitle: { fontSize: 20, fontWeight: "800", color: colors.heroText, maxWidth: 200 },
    heroBody: { backgroundColor: colors.background, paddingTop: 8, paddingBottom: 8, paddingHorizontal: 14 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 4,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2
    },
    searchInput: { flex: 1, height: 36, fontSize: 14, color: colors.textPrimary },
    categoryFilterButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 6
    },
    categoryFilterButtonLabel: { fontSize: 12, fontWeight: "700", color: colors.primary },
    locateButton: {
      position: "absolute",
      right: 16,
      bottom: 24,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4
    },
    offlineButton: {
      position: "absolute",
      right: 16,
      bottom: 178,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4
    },
    zoomControl: {
      position: "absolute",
      right: 16,
      bottom: 80,
      width: 44,
      borderRadius: 12,
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      overflow: "hidden"
    },
    zoomButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    zoomDivider: { height: 1, backgroundColor: colors.divider },
    discoverButton: {
      position: "absolute",
      left: 16,
      bottom: 24,
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4
    },
    discoverButtonEmoji: { fontSize: 24 }
  });
}
