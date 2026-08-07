import type { Area } from "@/entities/area/model/types";
import type { Category } from "@/entities/category/model/types";
import type { Country } from "@/entities/country/model/types";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import { apiJson } from "./client";

export type BootstrapResponse = {
  pois: Poi[];
  regions: Region[];
  countries: Country[];
  areas: Area[];
  explorationModes: ExplorationMode[];
  categories: Category[];
  siteSettings: SiteSettings;
};

export function getBootstrap(): Promise<BootstrapResponse> {
  return apiJson<BootstrapResponse>("/api/bootstrap");
}
