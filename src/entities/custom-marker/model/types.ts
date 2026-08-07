export const customMarkerColors = [
  "#e24b4a",
  "#e0a13e",
  "#63a83c",
  "#287f72",
  "#378adb",
  "#7f77dd",
  "#d4537e",
  "#4a4a48"
] as const;

export type CustomMarkerColor = (typeof customMarkerColors)[number];

export type CustomMarker = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  createdAt: string;
};

export type CustomMarkerInput = {
  lat: number;
  lng: number;
  color: string;
  label?: string;
};
