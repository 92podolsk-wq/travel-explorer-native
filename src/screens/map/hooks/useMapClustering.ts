import { useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { PressEventWithFeatures, CameraRef } from "@maplibre/maplibre-react-native";
import type { NativeSyntheticEvent } from "react-native";
import Supercluster from "supercluster";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { Poi } from "@/entities/poi/model/types";
import { customMarkerSpriteKey, poiSpriteKey, poiVisitedSpriteKey } from "@/components/map/MapMarkerSprites";

export function useMapClustering({
  visiblePois,
  poisById,
  customMarkers,
  markerSpriteUris,
  visitedPoiIds,
  defaultZoom,
  cameraRef
}: {
  visiblePois: Poi[];
  poisById: Map<string, Poi>;
  customMarkers: CustomMarker[];
  markerSpriteUris: Record<string, string>;
  visitedPoiIds: string[];
  defaultZoom: number;
  cameraRef: RefObject<CameraRef | null>;
}) {
  const [regionView, setRegionView] = useState<{ zoom: number; bounds: [number, number, number, number] }>(() => ({
    zoom: defaultZoom,
    bounds: [-180, -85, 180, 85]
  }));
  const regionViewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleRegionDidChange(zoom: number, bounds: [number, number, number, number]) {
    // onRegionDidChange fires on every frame of an animated flyTo (cluster
    // tap, "locate me", etc). regionViewKey below forces the icon-symbol
    // GeoJSONSource to fully remount on each change — doing that on every
    // intermediate animation frame raced the native sprite/icon resolution
    // and left POI pins invisible after the camera settled. Debouncing to
    // the last event after the camera stops means it remounts once, after
    // the map is idle.
    if (regionViewDebounceRef.current) clearTimeout(regionViewDebounceRef.current);
    regionViewDebounceRef.current = setTimeout(() => {
      setRegionView({ zoom, bounds });
    }, 200);
  }

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

  function handleClusterSourcePress(event: NativeSyntheticEvent<PressEventWithFeatures>) {
    const feature = event.nativeEvent.features[0];
    const clusterId = feature?.properties?.cluster_id as number | undefined;
    if (clusterId == null || feature.geometry.type !== "Point") return;
    const [lng, lat] = feature.geometry.coordinates;
    handleClusterPress(clusterId, [lng, lat]);
  }

  // Forces the cluster GL sources to fully remount on every region change
  // rather than trust the `data` prop to update in place, since supercluster's
  // recomputed cluster geometry didn't reliably reach the native circle/text
  // layers otherwise. NOT used for poi-source: unmounting/remounting a symbol
  // layer whose icon-image comes from runtime-registered <Images> sprites
  // intermittently dropped icons specifically during zoom-in transitions —
  // poi-source is left to update its `data` prop in place instead (confirmed
  // stable across repeated zoom-in/zoom-out and cluster-tap cycles on-device).
  const regionViewKey = `${Math.round(regionView.zoom * 10)}-${regionView.bounds.map((n) => n.toFixed(2)).join(",")}`;

  // POI pins, cluster bubbles, and custom markers are drawn as native GL
  // layers (not React-Native View overlays) so they stay perfectly locked to
  // the map surface during pan/zoom instead of visibly lagging behind it.
  const poiFeatureCollection = useMemo((): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: mapClusters
      .filter((feature) => !("cluster" in feature.properties))
      .map((feature) => {
        const poiId = (feature.properties as { poiId: string }).poiId;
        const poi = poisById.get(poiId);
        const isVisited = visitedPoiIds.includes(poiId);
        const iconKey = poi ? (isVisited ? poiVisitedSpriteKey(poi.category) : poiSpriteKey(poi.category)) : "";
        return {
          type: "Feature" as const,
          geometry: feature.geometry,
          properties: { poiId, iconKey }
        };
      })
      .filter((feature) => markerSpriteUris[feature.properties.iconKey] != null)
  }), [mapClusters, poisById, markerSpriteUris, visitedPoiIds]);

  const clusterFeatureCollection = useMemo((): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: mapClusters.filter((feature) => "cluster" in feature.properties) as GeoJSON.Feature[]
  }), [mapClusters]);

  const customMarkerFeatureCollection = useMemo((): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: customMarkers
      .map((marker) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [marker.lng, marker.lat] },
        properties: { markerId: marker.id, iconKey: customMarkerSpriteKey(marker.color) }
      }))
      .filter((feature) => markerSpriteUris[feature.properties.iconKey] != null)
  }), [customMarkers, markerSpriteUris]);

  return {
    regionViewKey,
    poiFeatureCollection,
    clusterFeatureCollection,
    customMarkerFeatureCollection,
    handleRegionDidChange,
    handleClusterSourcePress
  };
}
