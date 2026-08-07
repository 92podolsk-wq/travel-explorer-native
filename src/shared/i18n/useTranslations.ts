import { useExplorerStore } from "@/shared/model/explorer-store";
import { getTranslations } from "./translations";

export function useTranslations() {
  const language = useExplorerStore((state) => state.language);
  return getTranslations(language);
}
