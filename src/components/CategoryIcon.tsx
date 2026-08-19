import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "react-native";
import { getCategoryIconSpec } from "@/entities/category/model/category-icons";

type CategoryIconProps = {
  icon: string;
  size?: number;
  color?: string;
};

// A few categories (e.g. "BookOff") use a real brand logo instead of a line
// glyph. Every call site already wraps CategoryIcon in a colored circle/badge
// (its category color), so this ships as a transparent-background white
// silhouette — cut from the source logo via scripts/extract-glyph.js in the
// web repo — to composite the same way every icon-font glyph does.
const imageIcons: Record<string, ReturnType<typeof require>> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  bookoff: require("../../assets/category-icons/bookoff-glyph.png")
};

export function CategoryIcon({ icon, size = 14, color = "#ffffff" }: CategoryIconProps) {
  if (imageIcons[icon]) {
    return <Image source={imageIcons[icon]} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  const spec = getCategoryIconSpec(icon);
  if (spec.family === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={spec.name as never} size={size} color={color} />;
  }
  return <Ionicons name={spec.name as never} size={size} color={color} />;
}
