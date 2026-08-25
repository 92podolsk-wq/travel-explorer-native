import { Linking } from "react-native";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useNearbyAlertsToggle } from "./useNearbyAlertsToggle";
import { useExplorerStore } from "@/shared/model/explorer-store";

jest.mock("@/shared/geofencing/manage-geofences", () => ({
  refreshNearbyGeofences: jest.fn(),
  requestNearbyAlertsPermissions: jest.fn(),
  stopNearbyGeofencing: jest.fn()
}));

import {
  refreshNearbyGeofences,
  requestNearbyAlertsPermissions,
  stopNearbyGeofencing
} from "@/shared/geofencing/manage-geofences";

const initialState = useExplorerStore.getState();

describe("useNearbyAlertsToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExplorerStore.setState(initialState, true);
  });

  it("enables alerts and refreshes geofences for the user's favorite pois when granted", async () => {
    (requestNearbyAlertsPermissions as jest.Mock).mockResolvedValue(true);
    (refreshNearbyGeofences as jest.Mock).mockResolvedValue(undefined);
    useExplorerStore.setState({
      pois: [{ id: "p1" }, { id: "p2" }] as never,
      favorites: ["p2"],
      language: "ru"
    });

    const { result } = await renderHook(() => useNearbyAlertsToggle());
    await result.current.handleToggleNearbyAlerts(true);

    expect(useExplorerStore.getState().isNearbyAlertsEnabled).toBe(true);
    expect(refreshNearbyGeofences).toHaveBeenCalledWith([{ id: "p2" }], "ru");
  });

  it("prompts to open settings instead of enabling when permission is denied", async () => {
    (requestNearbyAlertsPermissions as jest.Mock).mockResolvedValue(false);
    const openSettingsSpy = jest.spyOn(Linking, "openSettings").mockResolvedValue();

    const { result } = await renderHook(() => useNearbyAlertsToggle());
    await result.current.handleToggleNearbyAlerts(true);

    expect(refreshNearbyGeofences).not.toHaveBeenCalled();
    expect(useExplorerStore.getState().isNearbyAlertsEnabled).toBe(false);

    openSettingsSpy.mockRestore();
  });

  it("disables alerts and stops geofencing", async () => {
    useExplorerStore.setState({ isNearbyAlertsEnabled: true });
    (stopNearbyGeofencing as jest.Mock).mockResolvedValue(undefined);

    const { result } = await renderHook(() => useNearbyAlertsToggle());
    await result.current.handleToggleNearbyAlerts(false);

    expect(stopNearbyGeofencing).toHaveBeenCalled();
    await waitFor(() => expect(useExplorerStore.getState().isNearbyAlertsEnabled).toBe(false));
  });
});
