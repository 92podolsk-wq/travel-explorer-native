import type { Ionicons } from "@expo/vector-icons";

export type WeatherCondition = "clear" | "cloudy" | "rain" | "snow" | "storm";

const cloudyCodes = new Set(["pcloudyday", "pcloudynight", "mcloudyday", "mcloudynight", "cloudyday", "cloudynight", "humidday", "humidnight"]);
const rainCodes = new Set([
  "lightrainday",
  "lightrainnight",
  "oshowerday",
  "oshowernight",
  "ishowerday",
  "ishowernight",
  "rainday",
  "rainnight",
  "rainsnowday",
  "rainsnownight"
]);
const snowCodes = new Set(["lightsnowday", "lightsnownight", "snowday", "snownight"]);
const stormCodes = new Set(["tsday", "tsnight", "tsrainday", "tsrainnight"]);

export function mapSevenTimerCode(code: string): WeatherCondition {
  if (stormCodes.has(code)) return "storm";
  if (snowCodes.has(code)) return "snow";
  if (rainCodes.has(code)) return "rain";
  if (cloudyCodes.has(code)) return "cloudy";
  return "clear";
}

export const weatherConditionIcons: Record<WeatherCondition, keyof typeof Ionicons.glyphMap> = {
  clear: "sunny",
  cloudy: "cloud",
  rain: "rainy",
  snow: "snow",
  storm: "thunderstorm"
};
