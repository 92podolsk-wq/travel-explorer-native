// Mirrors the web app's avatar IDs (src/entities/user/model/avatars.ts) —
// the backend validates avatarId against that same list, so native must use
// identical IDs or every avatar-change request gets rejected as invalid.
export const avatarIds = [
  "compass",
  "globe",
  "mountain",
  "sun",
  "camera",
  "plane",
  "backpack",
  "map-pin",
  "suitcase",
  "tent",
  "binoculars",
  "balloon"
] as const;

export type AvatarId = (typeof avatarIds)[number];

export function isAvatarId(value: string): value is AvatarId {
  return (avatarIds as readonly string[]).includes(value);
}

// The web app renders these as hand-drawn inline SVGs (see
// src/shared/ui/profile-avatar.tsx in the web repo). Porting that pixel-for-
// pixel would mean pulling in react-native-svg — a new native module, another
// prebuild + ~7min rebuild cycle — just for 12 static icons. An emoji on the
// same background color (taken from web's SVG circle fill) reads close
// enough and needs zero native code.
export const avatarPresentation: Record<AvatarId, { emoji: string; color: string }> = {
  compass: { emoji: "🧭", color: "#dbe7f3" },
  globe: { emoji: "🌍", color: "#cdeee6" },
  mountain: { emoji: "⛰️", color: "#cfe9f7" },
  sun: { emoji: "☀️", color: "#fdf1d6" },
  camera: { emoji: "📷", color: "#e8e2f5" },
  plane: { emoji: "✈️", color: "#d7ecfa" },
  backpack: { emoji: "🎒", color: "#f3e0c8" },
  "map-pin": { emoji: "📍", color: "#f6d9d9" },
  suitcase: { emoji: "🧳", color: "#d9e8d5" },
  tent: { emoji: "⛺", color: "#e6ddf0" },
  binoculars: { emoji: "🔭", color: "#dbe3ea" },
  balloon: { emoji: "🎈", color: "#fbe3ea" }
};
