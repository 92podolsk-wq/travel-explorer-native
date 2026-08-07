import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { hapticSuccess, hapticTap } from "@/shared/haptics";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type WelcomeIntroProps = { onFinish: () => void };

export function WelcomeIntro({ onFinish }: WelcomeIntroProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iconScale = useSharedValue(0.5);
  const iconOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(8);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    iconOpacity.value = withTiming(1, { duration: 260 });
    iconScale.value = withSequence(
      withTiming(1.08, { duration: 420, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 160 }, (finished) => {
        if (finished) runOnJS(hapticSuccess)();
      })
    );

    titleOpacity.value = withDelay(
      520,
      withTiming(1, { duration: 300 }, (finished) => {
        if (finished) runOnJS(hapticTap)();
      })
    );
    titleTranslateY.value = withDelay(520, withTiming(0, { duration: 300 }));

    containerOpacity.value = withDelay(
      1700,
      withTiming(0, { duration: 350 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const iconStyle = useAnimatedStyle(() => ({ opacity: iconOpacity.value, transform: [{ scale: iconScale.value }] }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }]
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onFinish} />
      <Animated.Image source={require("../../assets/splash-icon.png")} style={[styles.icon, iconStyle]} />
      <Animated.Text style={[styles.title, titleStyle]}>Wayora</Animated.Text>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999
    },
    icon: { width: 96, height: 96, resizeMode: "contain" },
    title: { marginTop: 18, fontSize: 22, fontWeight: "800", color: colors.textPrimary, letterSpacing: 1 }
  });
}
