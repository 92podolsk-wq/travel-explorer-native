import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, PixelRatio, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { TextInput } from "@/shared/ui/AppTextInput";
import { LinearGradient } from "expo-linear-gradient";
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Images,
  Layer,
  Map as MapLibreMap,
  type MapRef,
  UserLocation,
  useCurrentPosition
} from "@maplibre/maplibre-react-native";
import type { PressEventWithFeatures } from "@maplibre/maplibre-react-native";
import type { NativeSyntheticEvent } from "react-native";
import type { Region } from "@/entities/region/model/types";
import { fuzzyMatch } from "@/shared/lib/fuzzy-match";
import { shuffle } from "@/shared/lib/shuffle";
import { haversineDistanceMeters } from "@/shared/lib/geo";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { resolveMapStyleUrl } from "@/shared/map/map-styles";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useOfflineRegionActions } from "./hooks/useOfflineRegionActions";
import { useMapClustering } from "./hooks/useMapClustering";
import { createCustomMarker, deleteCustomMarker, listCustomMarkers } from "@/shared/api/custom-markers";
import { addItineraryStop, removeItineraryStop } from "@/shared/api/itineraries";
import { CategoryFilterSheet } from "@/components/CategoryFilterSheet";
import { RegionSwitcherModal } from "@/components/RegionSwitcherModal";
import { PoiDetailSheet } from "@/components/PoiDetailSheet";
import { PoiPreviewCard } from "@/components/map/PoiPreviewCard";
import { MapMarkerSprites } from "@/components/map/MapMarkerSprites";
import { PulseMarker } from "@/components/map/PulseMarker";
import { AddMarkerModal } from "@/components/map/AddMarkerModal";
import { WeatherChips } from "@/components/map/WeatherChips";
import { SeasonReminderBanner } from "@/components/map/SeasonReminderBanner";
import { SwipeDiscoveryModal } from "@/widgets/swipe-discovery/SwipeDiscoveryModal";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

// Marker sprites are rasterized via react-native-view-shot at the device's
// native pixel density, but the map treats registered images as 1x — without
// this correction icons render one full pixelRatio too large.
const MARKER_ICON_SIZE = 1 / PixelRatio.get();

function mergeRegionBounds(regionsToMerge: Region[]): [number, number, number, number] {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const region of regionsToMerge) {
    const [[lng1, lat1], [lng2, lat2]] = region.bounds;
    west = Math.min(west, lng1, lng2);
    east = Math.max(east, lng1, lng2);
    south = Math.min(south, lat1, lat2);
    north = Math.max(north, lat1, lat2);
  }
  return [west, south, east, north];
}

export function MapScreen() {
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const categories = useExplorerStore((state) => state.categories);
  const siteSettings = useExplorerStore((state) => state.siteSettings);
  const hasPreciseLocation = useExplorerStore((state) => state.hasPreciseLocation);
  const activeRegionIds = useExplorerStore((state) => state.activeRegionIds);
  const setActiveRegion = useExplorerStore((state) => state.setActiveRegion);
  const setActiveCountry = useExplorerStore((state) => state.setActiveCountry);
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
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const markPoiViewed = useExplorerStore((state) => state.markPoiViewed);
  const isSwipeOpen = useExplorerStore((state) => state.isSwipeOpen);
  const setIsSwipeOpen = useExplorerStore((state) => state.setIsSwipeOpen);
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isRegionPickerOpen, setIsRegionPickerOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [pendingMarkerCoords, setPendingMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [previewPoiId, setPreviewPoiId] = useState<string | null>(null);
  const [markerSpriteUris, setMarkerSpriteUris] = useState<Record<string, string>>({});

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

  const activeRegions = useMemo(() => regions.filter((r) => activeRegionIds.includes(r.id)), [regions, activeRegionIds]);
  const primaryRegion = activeRegions[0] ?? null;
  const isCountryMode = activeRegions.length > 1;
  const activeCountry = useMemo(() => {
    if (!primaryRegion) return null;
    const area = areas.find((a) => a.id === primaryRegion.areaId);
    return area ? countries.find((c) => c.id === area.countryId) ?? null : null;
  }, [primaryRegion, areas, countries]);
  const { isRegionDownloaded, activeRegionDownloadProgress, handleDownloadActiveRegion, handleDeleteActiveRegion } =
    useOfflineRegionActions(primaryRegion);

  // If the app boots with a persisted country-wide selection (multiple
  // regions), the initial camera state only frames the first region — fit
  // the whole set once on mount instead of leaving the rest off-screen.
  useEffect(() => {
    if (activeRegions.length > 1) {
      cameraRef.current?.fitBounds(mergeRegionBounds(activeRegions), {
        padding: { top: 80, right: 40, bottom: 80, left: 40 },
        duration: 0
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visiblePois = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pois.filter((poi) => {
      if (!activeRegionIds.includes(poi.regionId)) return false;
      if (!selectedCategories.includes(poi.category)) return false;
      if (query.length > 0 && !fuzzyMatch(poi.name, query)) return false;
      return true;
    });
  }, [pois, activeRegionIds, selectedCategories, searchQuery]);

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const poisById = useMemo(() => new Map(visiblePois.map((poi) => [poi.id, poi])), [visiblePois]);
  const previewPoi = previewPoiId ? poisById.get(previewPoiId) : undefined;
  // Whichever POI is currently "focused" on the map — either the lightweight
  // tap-preview or a fully opened detail sheet — gets the pulsing ring.
  const highlightedPoi = previewPoi ?? selectedPoi;

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

  const {
    regionViewKey,
    poiFeatureCollection,
    clusterFeatureCollection,
    customMarkerFeatureCollection,
    handleRegionDidChange,
    handleClusterSourcePress
  } = useMapClustering({
    visiblePois,
    poisById,
    customMarkers,
    markerSpriteUris,
    visitedPoiIds,
    defaultZoom: primaryRegion?.defaultZoom ?? 12,
    cameraRef
  });

  function handlePoiSourcePress(event: NativeSyntheticEvent<PressEventWithFeatures>) {
    const poiId = event.nativeEvent.features[0]?.properties?.poiId as string | undefined;
    if (!poiId) return;
    markerPressedAtRef.current = Date.now();
    setPreviewPoiId(poiId);
  }

  function handleCustomMarkerSourcePress(event: NativeSyntheticEvent<PressEventWithFeatures>) {
    const markerId = event.nativeEvent.features[0]?.properties?.markerId as string | undefined;
    if (!markerId) return;
    handleMarkerPress(markerId);
  }

  const swipeCandidates = useMemo(() => {
    const regionPois = pois.filter((poi) => activeRegionIds.includes(poi.regionId));
    const unswiped = regionPois.filter(
      (poi) => !favorites.includes(poi.id) && !viewedPoiIds.includes(poi.id) && selectedCategories.includes(poi.category)
    );
    return shuffle(unswiped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois, activeRegionIds, selectedCategories, isSwipeOpen]);

  const neighboringSwipeRegions = useMemo(() => {
    if (!primaryRegion) return [];
    const activeCountryId = areas.find((area) => area.id === primaryRegion.areaId)?.countryId;
    if (!activeCountryId) return [];
    return regions
      .filter((region) => region.status === "published" && !activeRegionIds.includes(region.id))
      .filter((region) => areas.find((area) => area.id === region.areaId)?.countryId === activeCountryId)
      .map((region) => ({
        id: region.id,
        name: region.nameByLanguage[language] ?? region.name,
        distance: haversineDistanceMeters(primaryRegion.center, region.center),
        count: pois.filter((poi) => poi.regionId === region.id && !favorites.includes(poi.id) && !viewedPoiIds.includes(poi.id))
          .length
      }))
      .filter((region) => region.count > 0)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [primaryRegion, activeRegionIds, areas, regions, pois, favorites, viewedPoiIds, language]);

  const mapStyle = resolveMapStyleUrl(siteSettings?.mapStyleId ?? "openfreemap-bright");
  const position = useCurrentPosition();

  function handleLocateMe() {
    if (hasPreciseLocation === false) {
      Alert.alert(t.app.impreciseLocationTitle, t.app.impreciseLocationBody, [
        { text: t.app.impreciseLocationCancel, style: "cancel" },
        { text: t.app.impreciseLocationOpenSettings, onPress: () => Linking.openSettings() }
      ]);
    }
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

  if (!primaryRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const activeRegionName = primaryRegion.nameByLanguage[language] ?? primaryRegion.name;
  const heroTitleText = isCountryMode ? activeCountry?.nameByLanguage[language] ?? activeCountry?.name ?? activeRegionName : activeRegionName;

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
          handleRegionDidChange(zoom, bounds);
        }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: [primaryRegion.center.lng, primaryRegion.center.lat], zoom: primaryRegion.defaultZoom }}
        />
        <UserLocation animated accuracy heading />
        {position ? <PulseMarker lngLat={[position.coords.longitude, position.coords.latitude]} color="#3b82f6" /> : null}
        {highlightedPoi ? (
          <PulseMarker lngLat={[highlightedPoi.coordinates.lng, highlightedPoi.coordinates.lat]} color={colors.primary} />
        ) : null}

        {Object.keys(markerSpriteUris).length > 0 ? <Images images={markerSpriteUris} /> : null}

        <GeoJSONSource
          key={`cluster-circle-${regionViewKey}`}
          id="cluster-circle-source"
          data={clusterFeatureCollection}
          onPress={handleClusterSourcePress}
        >
          <Layer
            type="circle"
            id="cluster-circle-layer"
            source="cluster-circle-source"
            paint={{
              "circle-color": colors.primary,
              "circle-radius": 19,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff"
            }}
          />
        </GeoJSONSource>

        <GeoJSONSource
          key={`cluster-text-${regionViewKey}`}
          id="cluster-text-source"
          data={clusterFeatureCollection}
          onPress={handleClusterSourcePress}
        >
          <Layer
            type="symbol"
            id="cluster-text-layer"
            source="cluster-text-source"
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["Noto Sans Bold"],
              "text-size": 13,
              "text-allow-overlap": true,
              "text-ignore-placement": true
            }}
            paint={{ "text-color": colors.textInverse }}
          />
        </GeoJSONSource>

        <GeoJSONSource id="poi-source" data={poiFeatureCollection} onPress={handlePoiSourcePress}>
          <Layer
            type="symbol"
            id="poi-icon-layer"
            source="poi-source"
            layout={{
              "icon-image": ["get", "iconKey"],
              "icon-size": MARKER_ICON_SIZE,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-anchor": "center"
            }}
          />
        </GeoJSONSource>

        <GeoJSONSource id="custom-marker-source" data={customMarkerFeatureCollection} onPress={handleCustomMarkerSourcePress}>
          <Layer
            type="symbol"
            id="custom-marker-icon-layer"
            source="custom-marker-source"
            layout={{
              "icon-image": ["get", "iconKey"],
              "icon-size": MARKER_ICON_SIZE,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-anchor": "center"
            }}
          />
        </GeoJSONSource>
      </MapLibreMap>

      <MapMarkerSprites categories={categories} onReady={setMarkerSpriteUris} />

      {previewPoi ? (
        <View style={styles.previewOverlay} pointerEvents="box-none">
          <PoiPreviewCard
            key={previewPoi.id}
            poi={previewPoi}
            category={categoriesById.get(previewPoi.category)}
            regionName={regions.find((r) => r.id === previewPoi.regionId)?.nameByLanguage[language] ?? activeRegionName}
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
                {heroTitleText}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.heroTextMuted} style={{ marginLeft: 2 }} />
            </TouchableOpacity>

            {!isCountryMode ? (
              <WeatherChips
                regionId={primaryRegion.id}
                latitude={primaryRegion.center.lat}
                longitude={primaryRegion.center.lng}
                timeZoneOffsetHours={primaryRegion.timezoneOffsetHours}
              />
            ) : null}
          </LinearGradient>

          <View style={styles.heroBody}>
            {!isCountryMode ? (
              <SeasonReminderBanner
                regionId={primaryRegion.id}
                regionName={activeRegionName}
                seasonWindows={primaryRegion.seasonWindows}
              />
            ) : null}

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
                  {selectedCategories.length}/{categories.length}
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
        {hasPreciseLocation === false ? <View style={styles.locateButtonBadge} /> : null}
      </TouchableOpacity>

      {!isCountryMode ? (
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
        <Ionicons name="sparkles" size={22} color="#ffffff" />
      </AnimatedPressable>

      <RegionSwitcherModal
        visible={isRegionPickerOpen}
        regions={regions}
        countries={countries}
        areas={areas}
        activeRegionIds={activeRegionIds}
        onSelectRegion={(regionId) => {
          setActiveRegion(regionId);
          const region = regions.find((r) => r.id === regionId);
          if (region) {
            cameraRef.current?.flyTo({ center: [region.center.lng, region.center.lat], zoom: region.defaultZoom, duration: 800 });
          }
        }}
        onSelectCountry={(countryId) => {
          setActiveCountry(countryId);
          const countryRegions = regions.filter((region) => {
            const area = areas.find((a) => a.id === region.areaId);
            return area?.countryId === countryId;
          });
          if (countryRegions.length > 0) {
            cameraRef.current?.fitBounds(mergeRegionBounds(countryRegions), {
              padding: { top: 80, right: 40, bottom: 80, left: 40 },
              duration: 800
            });
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
          key={activeRegionIds.join(",")}
          pois={swipeCandidates}
          language={language}
          onLike={toggleFavorite}
          onSkip={markPoiViewed}
          onClose={() => setIsSwipeOpen(false)}
          neighboringRegions={neighboringSwipeRegions}
          onSwitchRegion={(regionId) => {
            setActiveRegion(regionId);
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
    locateButtonBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: "#e8672e",
      borderWidth: 1.5,
      borderColor: colors.surface
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
