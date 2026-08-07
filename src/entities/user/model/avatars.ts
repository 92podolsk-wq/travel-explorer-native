export const avatarIds = [
  "torii",
  "sakura",
  "fuji",
  "koi",
  "lantern",
  "maple",
  "bamboo",
  "tea",
  "fan",
  "pagoda",
  "maneki-neko",
  "dango"
] as const;

export type AvatarId = (typeof avatarIds)[number];

export function isAvatarId(value: string): value is AvatarId {
  return (avatarIds as readonly string[]).includes(value);
}

// The web app renders these as hand-drawn inline SVGs (see
// src/shared/ui/profile-avatar.tsx in the web repo). Porting that pixel-for-
// pixel would mean pulling in react-native-svg — a new native module, another
// prebuild + ~7min rebuild cycle — just for 12 static icons. An emoji + the
// same background color reads close enough and needs zero native code.
export const avatarPresentation: Record<AvatarId, { emoji: string; color: string }> = {
  torii: { emoji: "⛩️", color: "#a3312c" },
  sakura: { emoji: "🌸", color: "#dd8fa4" },
  fuji: { emoji: "🗻", color: "#cfe9f7" },
  koi: { emoji: "🎏", color: "#cdeee6" },
  lantern: { emoji: "🏮", color: "#f3e4c8" },
  maple: { emoji: "🍁", color: "#f4dba0" },
  bamboo: { emoji: "🎋", color: "#cbe6c9" },
  tea: { emoji: "🍵", color: "#efe6d3" },
  fan: { emoji: "🪭", color: "#c8402f" },
  pagoda: { emoji: "🏯", color: "#9db4c9" },
  "maneki-neko": { emoji: "🐱", color: "#eab659" },
  dango: { emoji: "🍡", color: "#f0e6d8" }
};
