import type { PoiTag } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";

export type ExplorationMode = {
  id: string;
  position: number;
  name: string;
  nameByLanguage: Record<Language, string>;
  description: string;
  descriptionByLanguage: Record<Language, string>;
  tags: PoiTag[];
  icon: string;
};

export type ExplorationModeInput = Omit<ExplorationMode, "id" | "position"> & { id?: string };
