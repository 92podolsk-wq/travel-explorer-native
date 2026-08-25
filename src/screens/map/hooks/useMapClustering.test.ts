import { renderHook, waitFor } from "@testing-library/react-native";
import { useMapClustering } from "./useMapClustering";
import type { Poi } from "@/entities/poi/model/types";
import type { CustomMarker } from "@/entities/custom-marker/model/types";

function makePoi(id: string, lat: number, lng: number, category = "nature"): Poi {
  return { id, coordinates: { lat, lng }, category } as unknown as Poi;
}

function makeCameraRef() {
  return { current: { flyTo: jest.fn() } } as unknown as Parameters<typeof useMapClustering>[0]["cameraRef"];
}

describe("useMapClustering", () => {
  const pois = [makePoi("poi-1", 35.01, 135.76), makePoi("poi-2", 35.02, 135.77)];
  const markerSpriteUris = { "poi-nature": "uri-1", "poi-nature-visited": "uri-2" };

  it("includes visible POIs whose sprite is ready and drops ones without a loaded sprite", async () => {
    const cameraRef = makeCameraRef();
    const { result } = await renderHook(() =>
      useMapClustering({
        visiblePois: pois,
        poisById: new Map(pois.map((p) => [p.id, p])),
        customMarkers: [],
        markerSpriteUris,
        visitedPoiIds: [],
        defaultZoom: 12,
        cameraRef
      })
    );

    const poiIds = result.current.poiFeatureCollection.features.map((f) => (f.properties as { poiId: string }).poiId);
    expect(poiIds.sort()).toEqual(["poi-1", "poi-2"]);
  });

  it("excludes POIs whose sprite hasn't loaded yet", async () => {
    const cameraRef = makeCameraRef();
    const { result } = await renderHook(() =>
      useMapClustering({
        visiblePois: pois,
        poisById: new Map(pois.map((p) => [p.id, p])),
        customMarkers: [],
        markerSpriteUris: {},
        visitedPoiIds: [],
        defaultZoom: 12,
        cameraRef
      })
    );

    expect(result.current.poiFeatureCollection.features).toHaveLength(0);
  });

  it("uses the visited sprite key for visited pois", async () => {
    const cameraRef = makeCameraRef();
    const { result } = await renderHook(() =>
      useMapClustering({
        visiblePois: [pois[0]],
        poisById: new Map([[pois[0].id, pois[0]]]),
        customMarkers: [],
        markerSpriteUris,
        visitedPoiIds: [pois[0].id],
        defaultZoom: 12,
        cameraRef
      })
    );

    expect(result.current.poiFeatureCollection.features[0]?.properties?.iconKey).toBe("poi-nature-visited");
  });

  it("builds a custom-marker feature collection keyed by color", async () => {
    const marker = { id: "marker-1", lat: 35.0, lng: 135.7, color: "#e24b4a", label: "Spot" } as unknown as CustomMarker;
    const cameraRef = makeCameraRef();
    const { result } = await renderHook(() =>
      useMapClustering({
        visiblePois: [],
        poisById: new Map(),
        customMarkers: [marker],
        markerSpriteUris: { "custom-#e24b4a": "uri" },
        visitedPoiIds: [],
        defaultZoom: 12,
        cameraRef
      })
    );

    expect(result.current.customMarkerFeatureCollection.features).toHaveLength(1);
    expect(result.current.customMarkerFeatureCollection.features[0]?.properties).toEqual({
      markerId: "marker-1",
      iconKey: "custom-#e24b4a"
    });
  });

  it("debounces handleRegionDidChange before it changes the region view key", async () => {
    jest.useFakeTimers();
    const cameraRef = makeCameraRef();
    const { result } = await renderHook(() =>
      useMapClustering({
        visiblePois: pois,
        poisById: new Map(pois.map((p) => [p.id, p])),
        customMarkers: [],
        markerSpriteUris,
        visitedPoiIds: [],
        defaultZoom: 12,
        cameraRef
      })
    );

    const initialKey = result.current.regionViewKey;
    result.current.handleRegionDidChange(15, [130, 30, 140, 40]);
    expect(result.current.regionViewKey).toBe(initialKey);

    jest.advanceTimersByTime(200);
    await waitFor(() => {
      expect(result.current.regionViewKey).not.toBe(initialKey);
    });

    jest.useRealTimers();
  });

  it("flies the camera to a cluster's expansion zoom on cluster press", async () => {
    // A few meters apart (not identical coordinates) so they're two distinct
    // GeoJSON points that Supercluster is virtually guaranteed to merge into
    // one bubble at any zoom, regardless of the exact radius math.
    const clusteredPois = [makePoi("poi-1", 35.01, 135.76), makePoi("poi-2", 35.0100001, 135.7600001)];
    const cameraRef = makeCameraRef();
    const { result } = await renderHook(() =>
      useMapClustering({
        visiblePois: clusteredPois,
        poisById: new Map(clusteredPois.map((p) => [p.id, p])),
        customMarkers: [],
        markerSpriteUris,
        visitedPoiIds: [],
        defaultZoom: 12,
        cameraRef
      })
    );

    const clusterFeature = result.current.clusterFeatureCollection.features[0] as unknown as
      | { properties: { cluster_id: number }; geometry: { type: "Point"; coordinates: [number, number] } }
      | undefined;
    expect(clusterFeature).toBeDefined();

    result.current.handleClusterSourcePress({
      nativeEvent: { features: [clusterFeature] }
    } as never);

    expect(cameraRef.current!.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: clusterFeature!.geometry.coordinates, duration: 400 })
    );
  });
});
