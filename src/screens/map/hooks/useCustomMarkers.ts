import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { createCustomMarker, deleteCustomMarker, listCustomMarkers } from "@/shared/api/custom-markers";
import { addItineraryStop, removeItineraryStop } from "@/shared/api/itineraries";

export function useCustomMarkers() {
  const authStatus = useExplorerStore((state) => state.authStatus);
  const openAuthModal = useExplorerStore((state) => state.openAuthModal);
  const customMarkers = useExplorerStore((state) => state.customMarkers);
  const setCustomMarkers = useExplorerStore((state) => state.setCustomMarkers);
  const addCustomMarkerToState = useExplorerStore((state) => state.addCustomMarkerToState);
  const removeCustomMarkerFromState = useExplorerStore((state) => state.removeCustomMarkerFromState);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const t = useTranslations();

  const [pendingMarkerCoords, setPendingMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    listCustomMarkers()
      .then(({ markers, limit }) => setCustomMarkers(markers, limit))
      .catch(() => {});
  }, [authStatus, setCustomMarkers]);

  function handleMapLongPress(lat: number, lng: number) {
    if (authStatus !== "authenticated") {
      openAuthModal();
      return;
    }
    setPendingMarkerCoords({ lat, lng });
  }

  async function handleSaveMarker(color: string, label: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!pendingMarkerCoords) return { ok: false, error: t.app.markerSaveError };
    try {
      const marker = await createCustomMarker({ lat: pendingMarkerCoords.lat, lng: pendingMarkerCoords.lng, color, label });
      addCustomMarkerToState(marker);
      setPendingMarkerCoords(null);
      return { ok: true };
    } catch {
      return { ok: false, error: t.app.markerSaveError };
    }
  }

  async function handleMarkerPress(markerId: string) {
    const marker = customMarkers.find((m) => m.id === markerId);
    if (!marker) return;
    const stop = itinerary?.stops.find((s) => s.point.kind === "marker" && s.point.marker.id === markerId);
    const options: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [];

    if (itinerary) {
      if (stop) {
        options.push({
          text: t.app.removeMarkerFromItinerary,
          onPress: async () => {
            const updated = await removeItineraryStop(itinerary.id, stop.id);
            setItinerary(updated);
          }
        });
      } else {
        options.push({
          text: t.app.addMarkerToItinerary,
          onPress: async () => {
            const updated = await addItineraryStop(itinerary.id, { customMarkerId: markerId });
            setItinerary(updated);
          }
        });
      }
    }

    options.push({
      text: t.app.deleteMarker,
      style: "destructive",
      onPress: () => {
        Alert.alert(t.app.deleteMarker, t.app.deleteMarkerConfirm, [
          { text: t.auth.cancel, style: "cancel" },
          {
            text: t.auth.delete,
            style: "destructive",
            onPress: async () => {
              removeCustomMarkerFromState(markerId);
              await deleteCustomMarker(markerId).catch(() => {});
            }
          }
        ]);
      }
    });
    options.push({ text: t.auth.cancel, style: "cancel" });

    Alert.alert(marker.label || t.app.newMarkerTitle, undefined, options);
  }

  return { pendingMarkerCoords, setPendingMarkerCoords, handleMapLongPress, handleSaveMarker, handleMarkerPress };
}
