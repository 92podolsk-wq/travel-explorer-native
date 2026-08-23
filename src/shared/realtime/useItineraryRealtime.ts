import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { API_ORIGIN } from "@/shared/api/client";
import { getToken } from "@/shared/storage/token-storage";

export type ItineraryPresenceUser = { id: string; name: string | null; username: string; avatarId: string | null };

const POLL_INTERVAL_MS = 45000;
const RECONNECT_DELAY_MS = 3000;

// Keeps a shared itinerary in sync while multiple people co-edit it: a
// WebSocket subscription delivers near-instant updates, and a
// focus-refetch + slow poll is the fallback for whenever the socket is down
// (e.g. briefly backgrounded on mobile) so the trip still stays in sync
// without a manual restart. Deliberately has no dependency on the api/store
// layers — `onUpdate` is supplied by the caller and invoked whenever this
// hook believes the itinerary may have changed server-side, keeping this
// hook unit-testable with a mocked global WebSocket.
export function useItineraryRealtime(itineraryId: string | null, onUpdate: () => void) {
  const [presenceUsers, setPresenceUsers] = useState<ItineraryPresenceUser[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!itineraryId) return;
      onUpdate();
      const interval = setInterval(onUpdate, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itineraryId])
  );

  useEffect(() => {
    if (!itineraryId) return;
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    // RN's WebSocket supports a 3rd `{ headers }` argument for custom
    // headers (used here for the bearer token) — a runtime extension the
    // standard lib's WebSocket type doesn't know about.
    const RNWebSocket = WebSocket as unknown as new (
      url: string,
      protocols: undefined,
      options: { headers: Record<string, string> }
    ) => WebSocket;

    const connect = async () => {
      if (cancelled) return;
      const token = await getToken();
      if (!token || cancelled) return;

      socket = new RNWebSocket(`${API_ORIGIN.replace("https:", "wss:").replace("http:", "ws:")}/realtime`, undefined, {
        headers: { Authorization: `Bearer ${token}` }
      });

      socket.onopen = () => {
        socket?.send(JSON.stringify({ type: "subscribe", itineraryId }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.type === "itinerary:updated" && message.itineraryId === itineraryId) {
            onUpdate();
          } else if (message.type === "presence" && message.itineraryId === itineraryId) {
            if (!cancelled) setPresenceUsers(message.users);
          }
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        if (!cancelled) setPresenceUsers([]);
        if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      setPresenceUsers([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId]);

  return presenceUsers;
}
