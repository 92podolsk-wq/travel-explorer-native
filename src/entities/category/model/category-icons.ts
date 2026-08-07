// Maps the web app's lucide-react icon keys (src/entities/category/ui/category-icon-options.ts)
// to @expo/vector-icons equivalents. Both Ionicons and MaterialCommunityIcons ship as fonts
// already bundled with Expo, so no new native dependency was needed for this.
export type IconFamily = "Ionicons" | "MaterialCommunityIcons";
export type CategoryIconSpec = { family: IconFamily; name: string };

const categoryIconMap: Record<string, CategoryIconSpec> = {
  trees: { family: "MaterialCommunityIcons", name: "pine-tree" },
  church: { family: "MaterialCommunityIcons", name: "church" },
  castle: { family: "MaterialCommunityIcons", name: "castle" },
  university: { family: "MaterialCommunityIcons", name: "bank" },
  building: { family: "Ionicons", name: "business" },
  eye: { family: "Ionicons", name: "eye" },
  "ferris-wheel": { family: "MaterialCommunityIcons", name: "ferris-wheel" },
  flower: { family: "MaterialCommunityIcons", name: "flower" },
  landmark: { family: "Ionicons", name: "flag" },
  gem: { family: "Ionicons", name: "diamond" },
  camera: { family: "Ionicons", name: "camera" },
  compass: { family: "Ionicons", name: "compass" },
  mountain: { family: "MaterialCommunityIcons", name: "image-filter-hdr" },
  sun: { family: "Ionicons", name: "sunny" },
  umbrella: { family: "MaterialCommunityIcons", name: "umbrella-outline" },
  "map-pin": { family: "Ionicons", name: "location" },
  star: { family: "Ionicons", name: "star" },
  sparkles: { family: "Ionicons", name: "sparkles" },
  heart: { family: "Ionicons", name: "heart" },
  food: { family: "Ionicons", name: "restaurant" },
  footprints: { family: "MaterialCommunityIcons", name: "walk" },
  waves: { family: "Ionicons", name: "water" },
  anchor: { family: "MaterialCommunityIcons", name: "anchor" },
  ship: { family: "Ionicons", name: "boat" },
  palette: { family: "Ionicons", name: "color-palette" },
  trophy: { family: "Ionicons", name: "trophy" },
  flame: { family: "Ionicons", name: "flame" },
  bird: { family: "MaterialCommunityIcons", name: "bird" },
  fish: { family: "MaterialCommunityIcons", name: "fish" }
};

export const defaultCategoryIcon: CategoryIconSpec = { family: "Ionicons", name: "diamond" };

export function getCategoryIconSpec(iconKey: string): CategoryIconSpec {
  return categoryIconMap[iconKey] ?? defaultCategoryIcon;
}
