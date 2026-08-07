import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "wayora:hasSeenIntro";

export async function hasSeenIntro(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "true";
}

export function markIntroSeen(): void {
  AsyncStorage.setItem(KEY, "true").catch(() => {});
}
