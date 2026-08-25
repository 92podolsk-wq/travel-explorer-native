import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import {
  deleteRegionOffline,
  deleteRegionPhotos,
  getOfflineStorageBytesByRegion,
  resolveOfflinePhotoUri
} from "@/shared/map/offline-maps";

export function useOfflineMapsManager() {
  const t = useTranslations();
  const regions = useExplorerStore((state) => state.regions);
  const pois = useExplorerStore((state) => state.pois);
  const downloadedRegionIds = useExplorerStore((state) => state.downloadedRegionIds);
  const setDownloadedRegionIds = useExplorerStore((state) => state.setDownloadedRegionIds);

  const [regionBytes, setRegionBytes] = useState<Record<string, number>>({});

  useEffect(() => {
    getOfflineStorageBytesByRegion(downloadedRegionIds, pois).then(setRegionBytes);
  }, [downloadedRegionIds, pois]);

  function regionThumbnail(regionId: string): string | null {
    const regionPois = pois.filter((p) => p.regionId === regionId && p.photos.length > 0);
    const photo = [...regionPois].sort((a, b) => b.importance - a.importance)[0]?.photos[0];
    return photo ? resolveOfflinePhotoUri(photo.id, photo.url) : null;
  }

  function handleDeleteRegion(regionId: string, regionName: string) {
    Alert.alert(t.auth.offlineMapDeleteConfirm.replace("{name}", regionName), t.auth.offlineMapDeleteConfirmBody, [
      { text: t.auth.cancel, style: "cancel" },
      {
        text: t.auth.delete,
        style: "destructive",
        onPress: async () => {
          await deleteRegionOffline(regionId);
          deleteRegionPhotos(pois.filter((p) => p.regionId === regionId));
          setDownloadedRegionIds(downloadedRegionIds.filter((id) => id !== regionId));
        }
      }
    ]);
  }

  function handleRegionMenu(regionId: string, regionName: string) {
    Alert.alert(regionName, undefined, [
      { text: t.auth.cancel, style: "cancel" },
      { text: t.auth.offlineMapDelete, style: "destructive", onPress: () => handleDeleteRegion(regionId, regionName) }
    ]);
  }

  function handleOfflineInfo() {
    Alert.alert(t.auth.offlineMapsTitle, t.auth.offlineMapsInfoHint);
  }

  const downloadedRegions = regions.filter((region) => downloadedRegionIds.includes(region.id));
  const totalOfflineBytes = Object.values(regionBytes).reduce((sum, bytes) => sum + bytes, 0);

  return {
    regionBytes,
    downloadedRegions,
    totalOfflineBytes,
    regionThumbnail,
    handleRegionMenu,
    handleOfflineInfo
  };
}
