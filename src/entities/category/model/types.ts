import type { Language } from "@/shared/i18n/types";

export type Category = {
  id: string;
  position: number;
  name: string;
  nameByLanguage: Record<Language, string>;
  icon: string;
  color: string;
  isHidden: boolean;
};

export type CategoryInput = Omit<Category, "id" | "position"> & { id?: string };
