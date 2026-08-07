import type { Language } from "@/shared/i18n/types";

export type Area = {
  id: string;
  countryId: string;
  name: string;
  nameByLanguage: Record<Language, string>;
};

export type AreaInput = Omit<Area, "id"> & { id?: string };
