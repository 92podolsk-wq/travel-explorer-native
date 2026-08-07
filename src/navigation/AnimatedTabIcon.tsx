import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type AnimatedTabIconProps = {
  focusedName: keyof typeof Ionicons.glyphMap;
  unfocusedName: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
};

export function AnimatedTabIcon({ focusedName, unfocusedName, color, size, focused }: AnimatedTabIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 180 });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={focused ? focusedName : unfocusedName} color={color} size={size} />
    </Animated.View>
  );
}
