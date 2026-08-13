import { StyleSheet } from "react-native";
import type { StyleProp, TextStyle } from "react-native";

export const MANROPE_WEIGHT_MAP: Record<string, string> = {
  "200": "Manrope_200ExtraLight",
  "300": "Manrope_300Light",
  "400": "Manrope_400Regular",
  normal: "Manrope_400Regular",
  "500": "Manrope_500Medium",
  "600": "Manrope_600SemiBold",
  "700": "Manrope_700Bold",
  bold: "Manrope_700Bold",
  "800": "Manrope_800ExtraBold",
  "900": "Manrope_800ExtraBold"
};

export function resolveManropeFamily(style: StyleProp<TextStyle>): string {
  const flat = StyleSheet.flatten(style) ?? {};
  const weight = flat.fontWeight != null ? String(flat.fontWeight) : "400";
  return MANROPE_WEIGHT_MAP[weight] ?? "Manrope_400Regular";
}
