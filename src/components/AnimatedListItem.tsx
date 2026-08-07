import { type ReactNode } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

type AnimatedListItemProps = {
  index: number;
  children: ReactNode;
};

const STAGGER_MS = 35;
const MAX_DELAY_MS = 350;

export function AnimatedListItem({ index, children }: AnimatedListItemProps) {
  const delay = Math.min(index * STAGGER_MS, MAX_DELAY_MS);
  return <Animated.View entering={FadeInDown.delay(delay).duration(260).springify().damping(16)}>{children}</Animated.View>;
}
