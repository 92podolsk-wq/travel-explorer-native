import type { MapStyleId } from "@/entities/site-setting/model/types";

// Ported from the web app's src/shared/map/map-styles.ts. Protomaps
// (self-hosted PMTiles) is intentionally not supported yet — it isn't the
// active site configuration (default is openfreemap-bright), and wiring up
// the pmtiles:// protocol in MapLibre Native is its own chunk of work.
const presetStyleUrls: Partial<Record<MapStyleId, string>> = {
  "openfreemap-bright": "https://tiles.openfreemap.org/styles/bright",
  "openfreemap-liberty": "https://tiles.openfreemap.org/styles/liberty",
  "carto-positron": "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  "carto-dark-matter": "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  "carto-voyager": "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
};

export const defaultMapStyleUrl = presetStyleUrls["openfreemap-bright"]!;

export function resolveMapStyleUrl(mapStyleId: MapStyleId): string {
  return presetStyleUrls[mapStyleId] ?? defaultMapStyleUrl;
}
