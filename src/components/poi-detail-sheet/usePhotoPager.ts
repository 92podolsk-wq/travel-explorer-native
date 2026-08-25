import { useEffect, useRef, useState } from "react";
import type { ScrollView } from "react-native";
import type { Poi } from "@/entities/poi/model/types";

const PHOTO_AUTO_ADVANCE_MS = 3000;

// Auto-advances the hero photo pager like an Instagram Story — 3s per photo,
// looping back to the first — while the sheet is open. Paused while the
// user is dragging the pager themselves or has opened the fullscreen photo
// viewer (where they page through manually instead).
export function usePhotoPager(poi: Poi | null) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [photoBoxWidth, setPhotoBoxWidth] = useState(0);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const photoScrollRef = useRef<ScrollView>(null);
  const isPhotoDraggingRef = useRef(false);

  useEffect(() => {
    setActivePhotoIndex(0);
    photoScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [poi?.id]);

  useEffect(() => {
    const photoCount = poi?.photos.length ?? 0;
    if (!poi || photoBoxWidth === 0 || photoCount <= 1 || isPhotoViewerOpen) return;
    const timer = setTimeout(() => {
      if (isPhotoDraggingRef.current) return;
      const nextIndex = (activePhotoIndex + 1) % photoCount;
      photoScrollRef.current?.scrollTo({ x: nextIndex * photoBoxWidth, animated: true });
      setActivePhotoIndex(nextIndex);
    }, PHOTO_AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [poi, photoBoxWidth, activePhotoIndex, isPhotoViewerOpen]);

  return {
    activePhotoIndex,
    setActivePhotoIndex,
    photoBoxWidth,
    setPhotoBoxWidth,
    isPhotoViewerOpen,
    setIsPhotoViewerOpen,
    photoScrollRef,
    isPhotoDraggingRef
  };
}
