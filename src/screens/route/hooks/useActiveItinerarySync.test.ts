import { renderHook, waitFor } from "@testing-library/react-native";
import { useActiveItinerarySync } from "./useActiveItinerarySync";
import { getItinerary } from "@/shared/api/itineraries";
import type { Itinerary } from "@/entities/itinerary/model/types";

jest.mock("@/shared/api/itineraries", () => ({ getItinerary: jest.fn() }));

function makeItinerary(id: string): Itinerary {
  return { id } as unknown as Itinerary;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("useActiveItinerarySync", () => {
  beforeEach(() => {
    (getItinerary as jest.Mock).mockReset();
  });

  describe("refreshItinerary", () => {
    it("does nothing when there is no active itinerary", async () => {
      const setItinerary = jest.fn();
      const { result } = await renderHook(() => useActiveItinerarySync(null, setItinerary));

      result.current.refreshItinerary();

      expect(getItinerary).not.toHaveBeenCalled();
    });

    it("applies the response when the active id hasn't changed", async () => {
      const setItinerary = jest.fn();
      const itinerary = makeItinerary("trip-1");
      (getItinerary as jest.Mock).mockResolvedValueOnce(itinerary);

      const { result } = await renderHook(() => useActiveItinerarySync("trip-1", setItinerary));
      result.current.refreshItinerary();

      await waitFor(() => expect(setItinerary).toHaveBeenCalledWith(itinerary));
    });

    it("drops a stale response for a trip the user has since switched away from", async () => {
      const setItinerary = jest.fn();
      const pendingRequest = deferred<Itinerary>();
      (getItinerary as jest.Mock).mockReturnValueOnce(pendingRequest.promise);

      const { result, rerender } = await renderHook(
        (props: { id: string | null }) => useActiveItinerarySync(props.id, setItinerary),
        { initialProps: { id: "trip-1" as string | null } }
      );

      result.current.refreshItinerary();
      expect(getItinerary).toHaveBeenCalledWith("trip-1");

      // User switches trips while the trip-1 request is still in flight.
      await rerender({ id: "trip-2" });

      pendingRequest.resolve(makeItinerary("trip-1"));
      await new Promise((r) => setTimeout(r, 0));

      expect(setItinerary).not.toHaveBeenCalled();
    });
  });

  describe("fetchItineraryIfStillActive", () => {
    it("applies the response for the id that's still active", async () => {
      const setItinerary = jest.fn();
      const itinerary = makeItinerary("trip-1");
      (getItinerary as jest.Mock).mockResolvedValueOnce(itinerary);

      const { result } = await renderHook(() => useActiveItinerarySync("trip-1", setItinerary));
      await result.current.fetchItineraryIfStillActive("trip-1");

      expect(setItinerary).toHaveBeenCalledWith(itinerary);
    });

    it("drops the result if the active id changed again before it resolved", async () => {
      const setItinerary = jest.fn();
      const pendingRequest = deferred<Itinerary>();
      (getItinerary as jest.Mock).mockReturnValueOnce(pendingRequest.promise);

      const { result, rerender } = await renderHook(
        (props: { id: string | null }) => useActiveItinerarySync(props.id, setItinerary),
        { initialProps: { id: "trip-1" as string | null } }
      );

      const pending = result.current.fetchItineraryIfStillActive("trip-1");
      // A faster second switch (e.g. rapid taps on the trip switcher) lands
      // before the first request resolves.
      await rerender({ id: "trip-2" });

      pendingRequest.resolve(makeItinerary("trip-1"));
      await pending;

      expect(setItinerary).not.toHaveBeenCalled();
    });
  });
});
