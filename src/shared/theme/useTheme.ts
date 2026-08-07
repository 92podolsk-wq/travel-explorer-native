import { useColorScheme } from "react-native";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { darkColors, lightColors, type ThemeColors } from "./colors";

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const themeMode = useExplorerStore((state) => state.themeMode);
  const systemScheme = useColorScheme();
  const isDark = themeMode === "system" ? systemScheme === "dark" : themeMode === "dark";
  return { colors: isDark ? darkColors : lightColors, isDark };
}
