import type { Coordinates, Season } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";

export type PublishStatus = "draft" | "published";

export type SeasonWindow = { start: string; end: string };
export type SeasonWindows = Partial<Record<Season, SeasonWindow>>;

export type Region = {
  id: string;
  name: string;
  areaId: string;
  center: Coordinates;
  defaultZoom: number;
  bounds: [[number, number], [number, number]];
  timezoneOffsetHours: number;
  nameByLanguage: Record<Language, string>;
  sealCharacter: string;
  status: PublishStatus;
  seasonWindows?: SeasonWindows;
};

export type RegionInput = Omit<Region, "id"> & { id?: string };
