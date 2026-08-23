import { renderHook, waitFor } from "@testing-library/react-native";
import { useItineraryRealtime } from "./useItineraryRealtime";

jest.mock("@react-navigation/native", () => ({
  // Minimal stand-in for React Navigation's real focus-effect semantics —
  // this test only exercises the WebSocket half of the hook, so focus is
  // simulated as "always focused from mount", not real screen-focus events.
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require("react");
    React.useEffect(() => callback(), []);
  }
}));

jest.mock("@/shared/storage/token-storage", () => ({ getToken: jest.fn() }));

import { getToken } from "@/shared/storage/token-storage";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  send = jest.fn();
  close = jest.fn();
  constructor(
    public url: string,
    public protocols: undefined,
    public options: { headers: Record<string, string> }
  ) {
    FakeWebSocket.instances.push(this);
  }
}

async function connectSocket() {
  await waitFor(() => expect(FakeWebSocket.instances.length).toBeGreaterThan(0));
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
}

describe("useItineraryRealtime", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    (getToken as jest.Mock).mockResolvedValue("test-token");
    (global as unknown as { WebSocket: unknown }).WebSocket = FakeWebSocket;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("connects with a bearer-token header and subscribes to the itinerary on open", async () => {
    await renderHook(() => useItineraryRealtime("itin-1", jest.fn()));
    const socket = await connectSocket();

    expect(socket.url).toMatch(/^wss:\/\/.*\/realtime$/);
    expect(socket.options.headers.Authorization).toBe("Bearer test-token");

    socket.onopen?.();
    await waitFor(() => expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ type: "subscribe", itineraryId: "itin-1" })));
  });

  it("calls onUpdate for itinerary:updated messages matching this itinerary, and ignores other itineraries", async () => {
    const onUpdate = jest.fn();
    await renderHook(() => useItineraryRealtime("itin-1", onUpdate));
    const socket = await connectSocket();
    onUpdate.mockClear(); // drop the focus-mount call so this test only counts socket-driven calls

    socket.onmessage?.({ data: JSON.stringify({ type: "itinerary:updated", itineraryId: "itin-1" }) });
    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));

    onUpdate.mockClear();
    socket.onmessage?.({ data: JSON.stringify({ type: "itinerary:updated", itineraryId: "some-other-itinerary" }) });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("ignores malformed message frames instead of throwing", async () => {
    await renderHook(() => useItineraryRealtime("itin-1", jest.fn()));
    const socket = await connectSocket();

    expect(() => socket.onmessage?.({ data: "not json" })).not.toThrow();
  });

  it("tracks presence users from presence messages and clears them on close", async () => {
    const { result } = await renderHook(() => useItineraryRealtime("itin-1", jest.fn()));
    const socket = await connectSocket();

    const users = [{ id: "u1", name: "Alex", username: "alex", avatarId: null }];
    socket.onmessage?.({ data: JSON.stringify({ type: "presence", itineraryId: "itin-1", users }) });
    await waitFor(() => expect(result.current).toEqual(users));

    socket.onclose?.();
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("reconnects 3s after the socket closes", async () => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    await renderHook(() => useItineraryRealtime("itin-1", jest.fn()));
    await waitFor(() => expect(FakeWebSocket.instances.length).toBe(1));

    FakeWebSocket.instances[0].onclose?.();
    jest.advanceTimersByTime(3000);

    await waitFor(() => expect(FakeWebSocket.instances.length).toBe(2));
  });
});
