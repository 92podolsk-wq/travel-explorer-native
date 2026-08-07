import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getCategoryIconSpec } from "@/entities/category/model/category-icons";

type CategoryIconProps = {
  icon: string;
  size?: number;
  color?: string;
};

export function CategoryIcon({ icon, size = 14, color = "#ffffff" }: CategoryIconProps) {
  const spec = getCategoryIconSpec(icon);
  if (spec.family === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={spec.name as never} size={size} color={color} />;
  }
  return <Ionicons name={spec.name as never} size={size} color={color} />;
}
