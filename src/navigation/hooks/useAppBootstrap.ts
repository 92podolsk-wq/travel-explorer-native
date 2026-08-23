import { useCallback, useEffect, useState } from "react";
import { getBootstrap } from "@/shared/api/bootstrap";
import { getMe } from "@/shared/api/auth";
import { useExplorerStore, waitForStoreHydration } from "@/shared/model/explorer-store";

// Loads the initial user + reference data on app start, falls back to
// on-device cached data when offline, and retries in the background while
// running on that cache. Extracted from RootNavigator (which just composes
// this alongside the other bootstrap-adjacent hooks) with the exact same
// effect bodies/deps.
export function useAppBootstrap() {
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const setBootstrapData = useExplorerStore((state) => state.setBootstrapData);
  const setIsOffline = useExplorerStore((state) => state.setIsOffline);
  const flushPendingPoiActions = useExplorerStore((state) => state.flushPendingPoiActions);
  const isOffline = useExplorerStore((state) => state.isOffline);

  const [bootError, setBootError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadBootstrap = useCallback(async () => {
    try {
      const [me, bootstrap] = await Promise.all([getMe(), getBootstrap()]);
      hydrateAuth(
        me.user,
        me.user
          ? {
              favoritePoiIds: me.favoritePoiIds ?? [],
              viewedPoiIds: me.viewedPoiIds ?? [],
              visitedPoiIds: me.visitedPoiIds ?? []
            }
          : undefined
      );
      setBootstrapData(bootstrap);
      setIsOffline(false);
      setBootError(false);
      flushPendingPoiActions();
    } catch {
      // Network/server failure — fall back to whatever reference data is
      // cached on-device (see explorer-store's persist partialize) instead
      // of hard-blocking the whole app. Only show the error screen when
      // there's truly nothing to fall back to (e.g. very first launch with
      // no network). hasHydrated may not have flipped yet if AsyncStorage
      // hasn't finished reading, so wait for it before deciding.
      await waitForStoreHydration();
      const hasCachedData = useExplorerStore.getState().regions.length > 0;
      if (hasCachedData) {
        hydrateAuth(null);
        setIsOffline(true);
        setBootError(false);
      } else {
        setBootError(true);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [hydrateAuth, setBootstrapData, setIsOffline, flushPendingPoiActions]);

  useEffect(() => {
    loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While running on cached data with no network, periodically retry the
  // bootstrap fetch in the background so the app recovers on its own once
  // connectivity returns, instead of requiring a manual restart.
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => {
      loadBootstrap();
    }, 20000);
    return () => clearInterval(interval);
  }, [isOffline, loadBootstrap]);

  function handleRetry() {
    setIsRetrying(true);
    loadBootstrap();
  }

  return { bootError, isRetrying, handleRetry };
}
