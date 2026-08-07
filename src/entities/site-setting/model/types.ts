export const mapStyleIds = [
  "openfreemap-bright",
  "openfreemap-liberty",
  "carto-positron",
  "carto-dark-matter",
  "carto-voyager",
  "protomaps"
] as const;

export type MapStyleId = (typeof mapStyleIds)[number];

export type SiteSettings = {
  mapStyleId: MapStyleId;
  protomapsPmtilesUrl: string | null;
  maxCustomMarkersPerUser: number;
  maxPhotoUploadsPerUserPerDay: number;
  maxPhotoUploadsSiteWidePerDay: number;
};

export type SiteSettingsInput = {
  mapStyleId: MapStyleId;
  protomapsPmtilesUrl?: string | null;
  maxCustomMarkersPerUser: number;
  maxPhotoUploadsPerUserPerDay: number;
  maxPhotoUploadsSiteWidePerDay: number;
};
