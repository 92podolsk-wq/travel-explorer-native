import { useMemo, useState } from "react";
import type { Poi } from "@/entities/poi/model/types";
import { hapticSuccess, hapticSwipe } from "@/shared/haptics";

export function useSwipeDeck(pois: Poi[], onLike: (poiId: string) => void, onSkip: (poiId: string) => void) {
  const [deck] = useState(() => pois);
  const [index, setIndex] = useState(0);

  const current = deck[index];
  const next = deck[index + 1];
  const next2 = deck[index + 2];

  const backCards = useMemo(
    () => [
      { poi: next2, scale: 0.94, translateY: 14, opacity: 0.75 },
      { poi: next, scale: 0.97, translateY: 7, opacity: 0.9 }
    ],
    [next, next2]
  );

  function handleLike() {
    if (!current) return;
    onLike(current.id);
    setIndex((i) => i + 1);
  }

  function handleSkip() {
    if (!current) return;
    onSkip(current.id);
    setIndex((i) => i + 1);
  }

  function handleLikeButton() {
    hapticSuccess();
    handleLike();
  }

  function handleSkipButton() {
    hapticSwipe();
    handleSkip();
  }

  return { deck, index, current, backCards, handleLike, handleSkip, handleLikeButton, handleSkipButton };
}
