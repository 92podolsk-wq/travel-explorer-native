import { renderHook, waitFor } from "@testing-library/react-native";
import { useSwipeDeck } from "./useSwipeDeck";
import type { Poi } from "@/entities/poi/model/types";

function makePoi(id: string): Poi {
  return { id } as unknown as Poi;
}

describe("useSwipeDeck", () => {
  it("exposes the first poi as current and the next two as back cards", async () => {
    const pois = [makePoi("p1"), makePoi("p2"), makePoi("p3")];
    const { result } = await renderHook(() => useSwipeDeck(pois, jest.fn(), jest.fn()));

    expect(result.current.current?.id).toBe("p1");
    expect(result.current.backCards.map((c) => c.poi?.id)).toEqual(["p3", "p2"]);
  });

  it("handleLike calls onLike with the current poi and advances the deck", async () => {
    const pois = [makePoi("p1"), makePoi("p2")];
    const onLike = jest.fn();
    const { result } = await renderHook(() => useSwipeDeck(pois, onLike, jest.fn()));

    result.current.handleLike();

    expect(onLike).toHaveBeenCalledWith("p1");
    await waitFor(() => expect(result.current.current?.id).toBe("p2"));
  });

  it("handleSkip calls onSkip with the current poi and advances the deck", async () => {
    const pois = [makePoi("p1"), makePoi("p2")];
    const onSkip = jest.fn();
    const { result } = await renderHook(() => useSwipeDeck(pois, jest.fn(), onSkip));

    result.current.handleSkip();

    expect(onSkip).toHaveBeenCalledWith("p1");
    await waitFor(() => expect(result.current.current?.id).toBe("p2"));
  });

  it("does nothing when the deck is exhausted", async () => {
    const onLike = jest.fn();
    const { result } = await renderHook(() => useSwipeDeck([], onLike, jest.fn()));

    expect(result.current.current).toBeUndefined();
    result.current.handleLike();
    expect(onLike).not.toHaveBeenCalled();
  });

  it("keeps the deck snapshot stable even if the input pois array is replaced", async () => {
    const pois = [makePoi("p1"), makePoi("p2")];
    const { result, rerender } = await renderHook((props: { pois: Poi[] }) => useSwipeDeck(props.pois, jest.fn(), jest.fn()), {
      initialProps: { pois }
    });

    await rerender({ pois: [makePoi("p3"), makePoi("p4")] });

    expect(result.current.deck.map((p) => p.id)).toEqual(["p1", "p2"]);
  });
});
