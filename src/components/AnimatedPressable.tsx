import { type ReactNode } from "react";
import { Pressable, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { hapticTap } from "@/shared/haptics";

type AnimatedPressableProps = {
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  disabled?: boolean;
  haptic?: boolean;
  scaleTo?: number;
  hitSlop?: number;
  accessibilityLabel?: string;
};

export function AnimatedPressable({
  onPress,
  onLongPress,
  style,
  children,
  disabled,
  haptic = true,
  scaleTo = 0.95,
  hitSlop,
  accessibilityLabel
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        disabled={disabled}
        hitSlop={hitSlop}
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => {
          scale.value = withTiming(scaleTo, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 140 });
        }}
        onPress={(event) => {
          if (haptic) hapticTap();
          onPress?.(event);
        }}
        onLongPress={onLongPress}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
