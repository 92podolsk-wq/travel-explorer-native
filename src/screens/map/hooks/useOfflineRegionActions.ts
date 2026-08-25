import { useEffect } from "react";
import { Alert } from "react-native";
import type { Region } from "@/entities/region/model/types";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { resolveMapStyleUrl } from "@/shared/map/map-styles";
import {
  deleteRegionOffline,
  deleteRegionPhotos,
  downloadRegionOffline,
  downloadRegionPhotos,
  getDownloadedRegionIds,
  type OfflineProgress
} from "@/shared/map/offline-maps";
import { useExplorerStore } from "@/shared/model/explorer-store";

export function useOfflineRegionActions(primaryRegion: Region | null) {
  const pois = useExplorerStore((state) => state.pois);
  const siteSettings = useExplorerStore((state) => state.siteSettings);
  const language = useExplorerStore((state) => state.language);
  const downloadedRegionIds = useExplorerStore((state) => state.downloadedRegionIds);
  const downloadingProgress = useExplorerStore((state) => state.downloadingProgress);
  const setDownloadedRegionIds = useExplorerStore((state) => state.setDownloadedRegionIds);
  const setRegionDownloadProgress = useExplorerStore((state) => state.setRegionDownloadProgress);
  const t = useTranslations();

  useEffect(() => {
    getDownloadedRegionIds().then(setDownloadedRegionIds).catch(() => {});
  }, [setDownloadedRegionIds]);

  async function handleDownloadActiveRegion() {
    if (!primaryRegion) return;
    const mapStyleUrl = resolveMapStyleUrl(siteSettings?.mapStyleId ?? "openfreemap-bright");
    const regionPois = pois.filter((p) => p.regionId === primaryRegion.id);
    setRegionDownloadProgress(primaryRegion.id, 0);
    try {
      await downloadRegionOffline(primaryRegion, mapStyleUrl, (progress: OfflineProgress) => {
        if (progress.state !== "complete") {
          setRegionDownloadProgress(primaryRegion.id, progress.percentage * 0.7);
        }
      });
      await downloadRegionPhotos(regionPois, (done, total) => {
        const photoPercent = total > 0 ? (done / total) * 30 : 30;
        setRegionDownloadProgress(primaryRegion.id, 70 + photoPercent);
      });
      setRegionDownloadProgress(primaryRegion.id, null);
      setDownloadedRegionIds([...downloadedRegionIds, primaryRegion.id]);
    } catch {
      setRegionDownloadProgress(primaryRegion.id, null);
      Alert.alert(t.auth.offlineMapDownloadError);
    }
  }

  function handleDeleteActiveRegion() {
    if (!primaryRegion) return;
    const regionName = primaryRegion.nameByLanguage[language] ?? primaryRegion.name;
    Alert.alert(t.auth.offlineMapDeleteConfirm.replace("{name}", regionName), t.auth.offlineMapDeleteConfirmBody, [
      { text: t.auth.cancel, style: "cancel" },
      {
        text: t.auth.delete,
        style: "destructive",
        onPress: async () => {
          await deleteRegionOffline(primaryRegion.id);
          deleteRegionPhotos(pois.filter((p) => p.regionId === primaryRegion.id));
          setDownloadedRegionIds(downloadedRegionIds.filter((id) => id !== primaryRegion.id));
        }
      }
    ]);
  }

  const isRegionDownloaded = primaryRegion ? downloadedRegionIds.includes(primaryRegion.id) : false;
  const activeRegionDownloadProgress = primaryRegion ? downloadingProgress[primaryRegion.id] : undefined;

  return { isRegionDownloaded, activeRegionDownloadProgress, handleDownloadActiveRegion, handleDeleteActiveRegion };
}
