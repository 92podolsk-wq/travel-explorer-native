import { renderHook, waitFor } from "@testing-library/react-native";
import { useProfileEditor } from "./useProfileEditor";
import { useExplorerStore } from "@/shared/model/explorer-store";

jest.mock("@/shared/api/auth", () => ({
  updateAvatar: jest.fn(),
  updateProfile: jest.fn()
}));

import { updateAvatar, updateProfile } from "@/shared/api/auth";

const initialState = useExplorerStore.getState();

describe("useProfileEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExplorerStore.setState(initialState, true);
  });

  it("handleStartEditProfile seeds the drafts from currentUser and opens the modal", async () => {
    useExplorerStore.setState({
      currentUser: { name: "Denis", username: "denis", hideFromSearch: true } as never
    });

    const { result } = await renderHook(() => useProfileEditor());
    result.current.handleStartEditProfile();

    await waitFor(() => expect(result.current.isEditProfileOpen).toBe(true));
    expect(result.current.nameDraft).toBe("Denis");
    expect(result.current.usernameDraft).toBe("denis");
    expect(result.current.hideFromSearchDraft).toBe(true);
    expect(result.current.profileError).toBeNull();
  });

  it("handleSaveProfile hydrates the user and closes the modal on success", async () => {
    const hydrateAuth = jest.fn();
    useExplorerStore.setState({ hydrateAuth, currentUser: { name: "", username: "" } as never });
    (updateProfile as jest.Mock).mockResolvedValue({ user: { name: "Denis" } });

    const { result } = await renderHook(() => useProfileEditor());
    result.current.handleStartEditProfile();
    await waitFor(() => expect(result.current.isEditProfileOpen).toBe(true));

    await result.current.handleSaveProfile();

    expect(hydrateAuth).toHaveBeenCalledWith({ name: "Denis" });
    await waitFor(() => expect(result.current.isEditProfileOpen).toBe(false));
  });

  it("handleSaveProfile surfaces the server error message and keeps the modal open", async () => {
    useExplorerStore.setState({ currentUser: { name: "", username: "" } as never });
    (updateProfile as jest.Mock).mockRejectedValue(new Error("boom"));

    const { result } = await renderHook(() => useProfileEditor());
    result.current.handleStartEditProfile();
    await waitFor(() => expect(result.current.isEditProfileOpen).toBe(true));

    await result.current.handleSaveProfile();

    await waitFor(() => expect(result.current.profileError).not.toBeNull());
    expect(result.current.isEditProfileOpen).toBe(true);
  });

  it("handleSelectAvatar hydrates the user and closes the avatar picker", async () => {
    const hydrateAuth = jest.fn();
    useExplorerStore.setState({ hydrateAuth });
    (updateAvatar as jest.Mock).mockResolvedValue({ user: { avatarId: "compass" } });

    const { result } = await renderHook(() => useProfileEditor());
    result.current.setIsAvatarPickerOpen(true);
    await waitFor(() => expect(result.current.isAvatarPickerOpen).toBe(true));

    await result.current.handleSelectAvatar("compass");

    expect(hydrateAuth).toHaveBeenCalledWith({ avatarId: "compass" });
    await waitFor(() => expect(result.current.isAvatarPickerOpen).toBe(false));
  });
});
