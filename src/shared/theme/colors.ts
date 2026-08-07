export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  primary: string;
  primarySoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  icon: string;
  placeholder: string;
  /** Hero/banner gradient (Profile header, etc.) — bold, not a pale wash. */
  heroGradientStart: string;
  heroGradientEnd: string;
  heroText: string;
  heroTextMuted: string;
};

export const lightColors: ThemeColors = {
  background: "#f4f3ef",
  surface: "#ffffff",
  surfaceAlt: "#f6efe2",
  border: "#e2e0d8",
  divider: "#f0efe9",
  textPrimary: "#1a1a1a",
  textSecondary: "#4a4a48",
  textTertiary: "#8a8a8a",
  textInverse: "#ffffff",
  primary: "#287f72",
  primarySoft: "#eaf3f1",
  danger: "#c14b4b",
  dangerSoft: "rgba(193,75,75,0.1)",
  overlay: "rgba(0,0,0,0.35)",
  icon: "#4a4a48",
  placeholder: "#8a8a8a",
  heroGradientStart: "#2f9184",
  heroGradientEnd: "#1a5049",
  heroText: "#ffffff",
  heroTextMuted: "rgba(255,255,255,0.78)"
};

export const darkColors: ThemeColors = {
  background: "#121416",
  surface: "#1c1f22",
  surfaceAlt: "#242822",
  border: "#33383b",
  divider: "#2a2e31",
  textPrimary: "#f2f0ea",
  textSecondary: "#b8b4a8",
  textTertiary: "#84807a",
  textInverse: "#ffffff",
  primary: "#3fab9c",
  primarySoft: "rgba(63,171,156,0.16)",
  danger: "#e0685f",
  dangerSoft: "rgba(224,104,95,0.16)",
  overlay: "rgba(0,0,0,0.6)",
  icon: "#c8c5ba",
  placeholder: "#6f6c66",
  heroGradientStart: "#1c4842",
  heroGradientEnd: "#0c1e1c",
  heroText: "#ffffff",
  heroTextMuted: "rgba(255,255,255,0.7)"
};
