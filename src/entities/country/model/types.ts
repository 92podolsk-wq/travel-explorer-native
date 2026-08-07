import type { Language } from "@/shared/i18n/types";

export type Country = {
  id: string;
  name: string;
  nameByLanguage: Record<Language, string>;
};

export type CountryInput = Omit<Country, "id"> & { id?: string };
