import { renderHook } from "@testing-library/react-native";
import { useSwipeDiscoveryCandidates } from "./useSwipeDiscoveryCandidates";
import { useExplorerStore } from "@/shared/model/explorer-store";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";

const initialState = useExplorerStore.getState();

function makePoi(id: string, regionId: string, category = "nature"): Poi {
  return { id, regionId, category } as unknown as Poi;
}

function makeRegion(id: string, areaId: string, status: "published" | "draft" = "published"): Region {
  return {
    id,
    areaId,
    status,
    name: id,
    nameByLanguage: { ru: id, en: id, ja: id },
    center: { lat: 0, lng: 0 }
  } as unknown as Region;
}

describe("useSwipeDiscoveryCandidates", () => {
  beforeEach(() => {
    useExplorerStore.setState(initialState, true);
  });

  it("only includes unfavorited, unviewed pois from active regions matching the selected categories", async () => {
    useExplorerStore.setState({
      pois: [
        makePoi("p1", "region-1", "nature"),
        makePoi("p2", "region-1", "nature"),
        makePoi("p3", "region-2", "nature"),
        makePoi("p4", "region-1", "urban")
      ],
      activeRegionIds: ["region-1"],
      selectedCategories: ["nature"],
      favorites: ["p2"],
      viewedPoiIds: []
    });

    const { result } = await renderHook(() => useSwipeDiscoveryCandidates(null));

    expect(result.current.swipeCandidates.map((p) => p.id)).toEqual(["p1"]);
  });

  it("excludes already-viewed pois too", async () => {
    useExplorerStore.setState({
      pois: [makePoi("p1", "region-1"), makePoi("p2", "region-1")],
      activeRegionIds: ["region-1"],
      selectedCategories: ["nature"],
      favorites: [],
      viewedPoiIds: ["p1"]
    });

    const { result } = await renderHook(() => useSwipeDiscoveryCandidates(null));

    expect(result.current.swipeCandidates.map((p) => p.id)).toEqual(["p2"]);
  });

  it("returns no neighboring regions without a primary region", async () => {
    const { result } = await renderHook(() => useSwipeDiscoveryCandidates(null));
    expect(result.current.neighboringSwipeRegions).toEqual([]);
  });

  it("suggests nearby published regions in the same country that still have unswiped pois", async () => {
    const primaryRegion = makeRegion("region-1", "area-1");
    useExplorerStore.setState({
      areas: [
        { id: "area-1", countryId: "country-1" },
        { id: "area-2", countryId: "country-1" },
        { id: "area-3", countryId: "country-2" }
      ] as never,
      regions: [
        primaryRegion,
        makeRegion("region-2", "area-2"),
        makeRegion("region-3", "area-3"),
        makeRegion("region-4", "area-2", "draft")
      ],
      pois: [makePoi("p1", "region-2"), makePoi("p2", "region-3")],
      activeRegionIds: ["region-1"],
      favorites: [],
      viewedPoiIds: []
    });

    const { result } = await renderHook(() => useSwipeDiscoveryCandidates(primaryRegion));

    const ids = result.current.neighboringSwipeRegions.map((r) => r.id);
    expect(ids).toContain("region-2");
    expect(ids).not.toContain("region-3");
    expect(ids).not.toContain("region-4");
  });
});
