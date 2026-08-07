import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "wayora:nearbyPoiRegistry";

export type NearbyPoiEntry = {
  id: string;
  name: string;
  regionId: string;
  lat: number;
  lng: number;
};

export async function saveNearbyPoiRegistry(entries: NearbyPoiEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}

export async function getNearbyPoiRegistry(): Promise<NearbyPoiEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function findNearbyPoiEntry(id: string): Promise<NearbyPoiEntry | undefined> {
  const list = await getNearbyPoiRegistry();
  return list.find((entry) => entry.id === id);
}
