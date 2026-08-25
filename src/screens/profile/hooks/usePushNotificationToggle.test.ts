import { Linking } from "react-native";
import { renderHook, waitFor } from "@testing-library/react-native";
import { usePushNotificationToggle } from "./usePushNotificationToggle";
import { useExplorerStore } from "@/shared/model/explorer-store";

jest.mock("@/shared/api/push-notifications", () => ({
  registerPushTokenApi: jest.fn(),
  unregisterPushTokenApi: jest.fn()
}));
jest.mock("@/shared/notifications/push", () => ({
  getNotificationPermissionStatus: jest.fn(),
  requestDevicePushToken: jest.fn()
}));

import { registerPushTokenApi, unregisterPushTokenApi } from "@/shared/api/push-notifications";
import { getNotificationPermissionStatus, requestDevicePushToken } from "@/shared/notifications/push";

const initialState = useExplorerStore.getState();

describe("usePushNotificationToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExplorerStore.setState(initialState, true);
  });

  it("registers and stores the device push token when enabling with permission already granted", async () => {
    (getNotificationPermissionStatus as jest.Mock).mockResolvedValue("granted");
    (requestDevicePushToken as jest.Mock).mockResolvedValue("token-123");
    (registerPushTokenApi as jest.Mock).mockResolvedValue(undefined);

    const { result } = await renderHook(() => usePushNotificationToggle());
    await result.current.handleToggleNotifications(true);

    expect(useExplorerStore.getState().pushToken).toBe("token-123");
    expect(registerPushTokenApi).toHaveBeenCalledWith("token-123");
  });

  it("prompts to open settings instead of requesting a token when permission is denied", async () => {
    (getNotificationPermissionStatus as jest.Mock).mockResolvedValue("denied");
    const openSettingsSpy = jest.spyOn(Linking, "openSettings").mockResolvedValue();

    const { result } = await renderHook(() => usePushNotificationToggle());
    await result.current.handleToggleNotifications(true);

    expect(requestDevicePushToken).not.toHaveBeenCalled();
    expect(useExplorerStore.getState().pushToken).toBeNull();

    openSettingsSpy.mockRestore();
  });

  it("unregisters and clears the token when disabling", async () => {
    useExplorerStore.setState({ pushToken: "token-123" });
    (unregisterPushTokenApi as jest.Mock).mockResolvedValue(undefined);

    const { result } = await renderHook(() => usePushNotificationToggle());
    await result.current.handleToggleNotifications(false);

    expect(unregisterPushTokenApi).toHaveBeenCalledWith("token-123");
    await waitFor(() => expect(useExplorerStore.getState().pushToken).toBeNull());
  });
});
