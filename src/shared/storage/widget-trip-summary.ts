import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wayora:widgetTripSummary";
export const TRIP_COUNTDOWN_WIDGET_NAME = "TripCountdown";

export type WidgetTripSummary = {
  title: string;
  startDate: string | null;
};

export async function saveWidgetTripSummary(summary: WidgetTripSummary): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
}

export async function getWidgetTripSummary(): Promise<WidgetTripSummary | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WidgetTripSummary;
  } catch {
    return null;
  }
}
