import type { PublishStatus } from "@/entities/region/model/types";
import type { Language } from "@/shared/i18n/types";

export type PoiMainCategory = string;

export type PoiTag =
  | "must-visit"
  | "photographer"
  | "first-visit"
  | "nature"
  | "autumn"
  | "sakura"
  | "hidden-gem"
  | "sunrise"
  | "night"
  | "rain"
  | "public-transport"
  | "light-trekking";

export type Difficulty = "easy" | "moderate" | "active";

export type Season = "spring" | "summer" | "autumn" | "winter";

export type Photo = {
  id: string;
  url: string;
  alt: string;
  author?: string;
  season?: Season;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Poi = {
  id: string;
  regionId: string;
  name: string;
  nameByLanguage?: Record<Language, string>;
  coordinates: Coordinates;
  description: string;
  descriptionByLanguage?: Record<Language, string>;
  rating: number;
  favoritesCount: number;
  photos: Photo[];
  category: PoiMainCategory;
  tags: PoiTag[];
  seasons: string[];
  photoScore: number;
  mustVisit: boolean;
  bestTime?: string[];
  bestTimeByLanguage?: Record<Language, string[]>;
  difficulty: Difficulty;
  durationMinutes: number;
  importance: number;
  status: PublishStatus;
};

export type PoiInput = Omit<Poi, "id" | "favoritesCount"> & { id?: string };
