import { renderHook, waitFor } from "@testing-library/react-native";
import { usePhotoPager } from "./usePhotoPager";
import type { Poi } from "@/entities/poi/model/types";

function makePoi(id: string, photoCount: number): Poi {
  return {
    id,
    photos: Array.from({ length: photoCount }, (_, i) => ({ id: `${id}-photo-${i}` }))
  } as unknown as Poi;
}

describe("usePhotoPager", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resets to the first photo when the poi changes", async () => {
    const poiA = makePoi("a", 3);
    const poiB = makePoi("b", 2);
    const { result, rerender } = await renderHook((props: { poi: Poi }) => usePhotoPager(props.poi), { initialProps: { poi: poiA } });

    result.current.setActivePhotoIndex(2);
    await rerender({ poi: poiA });
    expect(result.current.activePhotoIndex).toBe(2);

    await rerender({ poi: poiB });
    await waitFor(() => expect(result.current.activePhotoIndex).toBe(0));
  });

  it("does not auto-advance for a single-photo poi", async () => {
    const poi = makePoi("a", 1);
    const { result, rerender } = await renderHook((props: { poi: Poi }) => usePhotoPager(props.poi), { initialProps: { poi } });

    result.current.setPhotoBoxWidth(300);
    await rerender({ poi });
    jest.advanceTimersByTime(5000);

    expect(result.current.activePhotoIndex).toBe(0);
  });

  it("auto-advances and loops back to the first photo", async () => {
    const poi = makePoi("a", 2);
    const { result, rerender } = await renderHook((props: { poi: Poi }) => usePhotoPager(props.poi), { initialProps: { poi } });

    result.current.setPhotoBoxWidth(300);
    await rerender({ poi });

    jest.advanceTimersByTime(3000);
    await rerender({ poi });
    await waitFor(() => expect(result.current.activePhotoIndex).toBe(1));

    jest.advanceTimersByTime(3000);
    await rerender({ poi });
    await waitFor(() => expect(result.current.activePhotoIndex).toBe(0));
  });

  it("pauses auto-advance while the fullscreen photo viewer is open", async () => {
    const poi = makePoi("a", 2);
    const { result, rerender } = await renderHook((props: { poi: Poi }) => usePhotoPager(props.poi), { initialProps: { poi } });

    result.current.setPhotoBoxWidth(300);
    result.current.setIsPhotoViewerOpen(true);
    await rerender({ poi });

    jest.advanceTimersByTime(5000);
    expect(result.current.activePhotoIndex).toBe(0);
  });
});
