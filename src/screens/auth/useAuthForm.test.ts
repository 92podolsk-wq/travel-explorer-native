import { renderHook, waitFor } from "@testing-library/react-native";
import { useAuthForm } from "./useAuthForm";
import { useExplorerStore } from "@/shared/model/explorer-store";

jest.mock("@/shared/api/auth", () => ({
  login: jest.fn(),
  register: jest.fn(),
  loginWithYandex: jest.fn(),
  getMe: jest.fn()
}));
jest.mock("@/shared/storage/token-storage", () => ({ saveToken: jest.fn() }));
jest.mock("react-native-yandex-login", () => ({ yandexLogin: jest.fn() }));

import { login, register, loginWithYandex, getMe } from "@/shared/api/auth";
import { saveToken } from "@/shared/storage/token-storage";
import { yandexLogin } from "react-native-yandex-login";

const initialState = useExplorerStore.getState();

describe("useAuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExplorerStore.setState(initialState, true);
  });

  it("logs in and hydrates the user on success", async () => {
    (login as jest.Mock).mockResolvedValue({ token: "tok-1" });
    (getMe as jest.Mock).mockResolvedValue({
      user: { id: "u1", name: "Denis" },
      favoritePoiIds: ["p1"],
      viewedPoiIds: [],
      visitedPoiIds: []
    });
    const hydrateAuth = jest.fn();
    useExplorerStore.setState({ hydrateAuth });

    const { result } = await renderHook(() => useAuthForm());
    result.current.setEmail("denis@example.com");
    result.current.setPassword("hunter2");
    await waitFor(() => expect(result.current.password).toBe("hunter2"));

    await result.current.handleSubmit();

    expect(login).toHaveBeenCalledWith("denis@example.com", "hunter2");
    expect(saveToken).toHaveBeenCalledWith("tok-1");
    expect(hydrateAuth).toHaveBeenCalledWith(
      { id: "u1", name: "Denis" },
      { favoritePoiIds: ["p1"], viewedPoiIds: [], visitedPoiIds: [] }
    );
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it("blocks registration submission when the passwords don't match, without calling the API", async () => {
    const { result } = await renderHook(() => useAuthForm());
    result.current.setMode("register");
    result.current.setPassword("aaaaaa");
    result.current.setConfirmPassword("bbbbbb");
    await waitFor(() => expect(result.current.confirmPassword).toBe("bbbbbb"));

    await result.current.handleSubmit();

    expect(register).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("registers with the confirmed password when they match", async () => {
    (register as jest.Mock).mockResolvedValue({ token: "tok-2" });
    (getMe as jest.Mock).mockResolvedValue({ user: { id: "u2" }, favoritePoiIds: [], viewedPoiIds: [], visitedPoiIds: [] });

    const { result } = await renderHook(() => useAuthForm());
    result.current.setMode("register");
    result.current.setEmail("new@example.com");
    result.current.setUsername("NewUser");
    result.current.setPassword("hunter2");
    result.current.setConfirmPassword("hunter2");
    await waitFor(() => expect(result.current.confirmPassword).toBe("hunter2"));

    await result.current.handleSubmit();

    expect(register).toHaveBeenCalledWith("new@example.com", "hunter2", "NewUser", undefined);
  });

  it("surfaces the server error message when login fails", async () => {
    (login as jest.Mock).mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useAuthForm());
    await result.current.handleSubmit();

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("logs in via Yandex and hydrates the user", async () => {
    (yandexLogin as jest.Mock).mockResolvedValue({ token: "yandex-raw" });
    (loginWithYandex as jest.Mock).mockResolvedValue({ token: "tok-3" });
    (getMe as jest.Mock).mockResolvedValue({ user: { id: "u3" }, favoritePoiIds: [], viewedPoiIds: [], visitedPoiIds: [] });
    const hydrateAuth = jest.fn();
    useExplorerStore.setState({ hydrateAuth });

    const { result } = await renderHook(() => useAuthForm());
    await result.current.handleYandexLogin();

    expect(loginWithYandex).toHaveBeenCalledWith("yandex-raw");
    expect(saveToken).toHaveBeenCalledWith("tok-3");
    expect(hydrateAuth).toHaveBeenCalled();
    await waitFor(() => expect(result.current.isYandexSubmitting).toBe(false));
  });
});
