import { useEffect, useMemo } from "react";
import { Dimensions, Image, Pressable, StyleSheet, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { Text } from "@/shared/ui/AppText";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { hapticSoft, hapticTap } from "@/shared/haptics";

type WelcomeIntroProps = { onFinish: () => void };

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type TimeOfDay = "morning" | "day" | "evening" | "night";

function resolveTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 18) return "day";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

type Palette = {
  sky: [string, string, string, string];
  mtnBack: string;
  mtnBackOpacity: number;
  mtnFront: string;
  orbColor: string;
  orbOpacity: number;
  pathColor: string;
  pathOpacity: number;
  markerColor: string;
  wordmarkColor: string;
  greetingColor: string;
  stars: boolean;
};

const PALETTES: Record<TimeOfDay, Palette> = {
  morning: {
    sky: ["#fbe4d3", "#f2b9b0", "#c98fb0", "#6f4f7c"],
    mtnBack: "#8a6b8f",
    mtnBackOpacity: 0.65,
    mtnFront: "#5a3f66",
    orbColor: "#f2894a",
    orbOpacity: 0.92,
    pathColor: "#f6efe0",
    pathOpacity: 1,
    markerColor: "#f2894a",
    wordmarkColor: "#4a2e40",
    greetingColor: "#4a2e40",
    stars: false
  },
  day: {
    sky: ["#eaf6ff", "#bee3f8", "#8fc4e8", "#3e93c9"],
    mtnBack: "#6fae7c",
    mtnBackOpacity: 0.7,
    mtnFront: "#3f7c4f",
    orbColor: "#ffe9a8",
    orbOpacity: 0.95,
    pathColor: "#ffffff",
    pathOpacity: 1,
    markerColor: "#e8672e",
    wordmarkColor: "#204f37",
    greetingColor: "#204f37",
    stars: false
  },
  evening: {
    sky: ["#ffd39b", "#f2935c", "#a8567a", "#3d2f5c"],
    mtnBack: "#7a5474",
    mtnBackOpacity: 0.7,
    mtnFront: "#43305a",
    orbColor: "#ff8a3d",
    orbOpacity: 0.92,
    pathColor: "#fff2df",
    pathOpacity: 1,
    markerColor: "#ff8a3d",
    wordmarkColor: "#3d2540",
    greetingColor: "#3d2540",
    stars: false
  },
  night: {
    sky: ["#1b2a4a", "#142038", "#101b33", "#080d1a"],
    mtnBack: "#1c2338",
    mtnBackOpacity: 0.8,
    mtnFront: "#0c1020",
    orbColor: "#eef1f8",
    orbOpacity: 0.9,
    pathColor: "#8fa3d6",
    pathOpacity: 0.8,
    markerColor: "#eef1f8",
    wordmarkColor: "#c7d2ef",
    greetingColor: "#c7d2ef",
    stars: true
  }
};

// The brand teal, matching the site's default category color — used for the
// seal ring and the little cat that circles it, regardless of time of day.
const SEAL_COLOR = "#2f8f8a";

const MTN_BACK_D =
  "M -20 150 L 30 100 L 70 135 L 120 85 L 170 130 L 210 95 L 260 140 L 320 110 L 320 220 L -20 220 Z";
const MTN_FRONT_D =
  "M -20 175 L 40 130 L 90 165 L 150 120 L 200 160 L 250 125 L 320 165 L 320 220 L -20 220 Z";
const ROUTE_D = "M 34 168 C 88 118, 116 184, 158 132 C 190 92, 228 112, 262 58";
const ROUTE_LENGTH = 420;

const STAR_POSITIONS = [
  { x: 40, y: 30 },
  { x: 90, y: 18 },
  { x: 140, y: 40 },
  { x: 200, y: 22 },
  { x: 250, y: 45 },
  { x: 60, y: 60 }
];

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedView = Animated.View;

function cubic(t: number, p0: number, p1: number, p2: number, p3: number) {
  "worklet";
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function pointOnRoute(t: number) {
  "worklet";
  if (t <= 0.5) {
    const lt = t / 0.5;
    return { x: cubic(lt, 34, 88, 116, 158), y: cubic(lt, 168, 118, 184, 132) };
  }
  const lt = (t - 0.5) / 0.5;
  return { x: cubic(lt, 158, 190, 228, 262), y: cubic(lt, 132, 92, 112, 58) };
}

export function WelcomeIntro({ onFinish }: WelcomeIntroProps) {
  const t = useTranslations();
  const timeOfDay = useMemo(resolveTimeOfDay, []);
  const palette = PALETTES[timeOfDay];
  const greeting =
    timeOfDay === "morning"
      ? t.app.greetingMorning
      : timeOfDay === "day"
        ? t.app.greetingDay
        : timeOfDay === "evening"
          ? t.app.greetingEvening
          : t.app.greetingNight;
  const greetingSound = useAudioPlayer(require("../../assets/sounds/greeting.mp3"));

  const containerOpacity = useSharedValue(1);
  const mtnBackX = useSharedValue(-8);
  const mtnFrontX = useSharedValue(8);
  const orbR = useSharedValue(4);
  const orbOpacity = useSharedValue(0);
  const pathProgress = useSharedValue(0);
  const ptA = useSharedValue(0);
  const ptB = useSharedValue(0);
  const ptCOpacity = useSharedValue(0);
  const ptCScale = useSharedValue(0);
  const markerT = useSharedValue(0);
  const markerOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(1.22);
  const wordOpacity = useSharedValue(0);
  const wordSpacing = useSharedValue(14);
  const greetingOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0.85);
  const shimmerX = useSharedValue(-140);
  const bird1X = useSharedValue(-30);
  const bird1Y = useSharedValue(0);
  const bird1Opacity = useSharedValue(0);
  const bird2X = useSharedValue(-30);
  const bird2Y = useSharedValue(0);
  const bird2Opacity = useSharedValue(0);

  useEffect(() => {
    greetingSound.volume = 0.5;
    greetingSound.seekTo(0);
    greetingSound.play();
    hapticSoft();

    mtnBackX.value = withRepeat(withSequence(withTiming(8, { duration: 3500 }), withTiming(-8, { duration: 3500 })), -1);
    mtnFrontX.value = withRepeat(withSequence(withTiming(-8, { duration: 2250 }), withTiming(8, { duration: 2250 })), -1);

    orbOpacity.value = withDelay(100, withTiming(palette.orbOpacity, { duration: 700, easing: Easing.out(Easing.cubic) }));
    orbR.value = withDelay(100, withTiming(20, { duration: 700, easing: Easing.out(Easing.cubic) }));

    pathProgress.value = withDelay(450, withTiming(1, { duration: 1150, easing: Easing.bezier(0.4, 0, 0.2, 1) }));

    ptA.value = withDelay(500, withTiming(1, { duration: 350 }));
    ptB.value = withDelay(800, withTiming(1, { duration: 350 }));
    ptCOpacity.value = withDelay(1150, withTiming(1, { duration: 350 }));
    ptCScale.value = withDelay(
      1150,
      withSequence(withTiming(1, { duration: 350 }), withDelay(250, withSequence(withTiming(1.5, { duration: 300 }), withTiming(1, { duration: 300 }))))
    );

    markerOpacity.value = withDelay(1500, withTiming(1, { duration: 250 }));
    markerT.value = withDelay(1500, withTiming(1, { duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1) }));

    logoOpacity.value = withDelay(
      2300,
      withTiming(1, { duration: 900, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }, (finished) => {
        if (finished) runOnJS(hapticSoft)();
      })
    );
    logoScale.value = withDelay(2300, withTiming(1, { duration: 900, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));

    glowPulse.value = withDelay(
      2300,
      withRepeat(withSequence(withTiming(1.15, { duration: 1300, easing: Easing.inOut(Easing.sin) }), withTiming(0.85, { duration: 1300, easing: Easing.inOut(Easing.sin) })), -1)
    );

    wordOpacity.value = withDelay(
      2700,
      withTiming(1, { duration: 600 }, (finished) => {
        if (finished) {
          runOnJS(hapticTap)();
          shimmerX.value = withDelay(150, withTiming(140, { duration: 900, easing: Easing.inOut(Easing.cubic) }));
        }
      })
    );
    wordSpacing.value = withDelay(2700, withTiming(6, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));

    greetingOpacity.value = withDelay(2900, withTiming(1, { duration: 500 }));

    bird1Opacity.value = withDelay(
      300,
      withSequence(withTiming(0.75, { duration: 500 }), withTiming(0.75, { duration: 2500 }), withTiming(0, { duration: 500 }))
    );
    bird1X.value = withDelay(300, withTiming(SCREEN_W + 30, { duration: 3600, easing: Easing.linear }));
    bird1Y.value = withDelay(300, withSequence(withTiming(-10, { duration: 1800 }), withTiming(-20, { duration: 1800 })));

    bird2Opacity.value = withDelay(
      1300,
      withSequence(withTiming(0.7, { duration: 500 }), withTiming(0.7, { duration: 1800 }), withTiming(0, { duration: 500 }))
    );
    bird2X.value = withDelay(1300, withTiming(SCREEN_W + 30, { duration: 2900, easing: Easing.linear }));
    bird2Y.value = withDelay(1300, withSequence(withTiming(-7, { duration: 1450 }), withTiming(-14, { duration: 1450 })));

    containerOpacity.value = withDelay(
      3550,
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));

  const mtnBackProps = useAnimatedProps(() => ({ transform: [{ translateX: mtnBackX.value }] }));
  const mtnFrontProps = useAnimatedProps(() => ({ transform: [{ translateX: mtnFrontX.value }] }));
  const orbProps = useAnimatedProps(() => ({ r: orbR.value, opacity: orbOpacity.value }));
  const routeProps = useAnimatedProps(() => ({ strokeDashoffset: ROUTE_LENGTH * (1 - pathProgress.value) }));
  const ptAProps = useAnimatedProps(() => ({ opacity: ptA.value, transform: [{ scale: 0.4 + 0.6 * ptA.value }] }));
  const ptBProps = useAnimatedProps(() => ({ opacity: ptB.value, transform: [{ scale: 0.4 + 0.6 * ptB.value }] }));
  const ptCProps = useAnimatedProps(() => ({ opacity: ptCOpacity.value, transform: [{ scale: ptCScale.value }] }));
  const markerProps = useAnimatedProps(() => {
    const p = pointOnRoute(markerT.value);
    return { cx: p.x, cy: p.y, opacity: markerOpacity.value };
  });

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }]
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    letterSpacing: wordSpacing.value
  }));
  const greetingStyle = useAnimatedStyle(() => ({ opacity: greetingOpacity.value }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: glowPulse.value }]
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { rotate: "20deg" }]
  }));
  const bird1Style = useAnimatedStyle(() => ({
    opacity: bird1Opacity.value,
    transform: [{ translateX: bird1X.value }, { translateY: bird1Y.value }]
  }));
  const bird2Style = useAnimatedStyle(() => ({
    opacity: bird2Opacity.value,
    transform: [{ translateX: bird2X.value }, { translateY: bird2Y.value }]
  }));

  return (
    <AnimatedView style={[styles.container, containerStyle, { backgroundColor: palette.sky[3] }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onFinish} />

      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.sky[0]} />
            <Stop offset="0.22" stopColor={palette.sky[1]} />
            <Stop offset="0.55" stopColor={palette.sky[2]} />
            <Stop offset="1" stopColor={palette.sky[3]} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="url(#sky)" />
        {palette.stars
          ? STAR_POSITIONS.map((star, index) => (
              <Circle key={index} cx={(star.x / 320) * SCREEN_W} cy={(star.y / 220) * SCREEN_H * 0.6} r={1.1} fill="#ffffff" opacity={0.8} />
            ))
          : null}
      </Svg>

      <AnimatedView style={[styles.bird, bird1Style]}>
        <BirdIcon color={palette.pathColor} />
      </AnimatedView>
      <AnimatedView style={[styles.bird, styles.birdLower, bird2Style]}>
        <BirdIcon color={palette.pathColor} />
      </AnimatedView>

      <Svg
        width={SCREEN_W}
        height={SCREEN_H}
        viewBox="0 0 300 220"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <AnimatedCircle cx={245} cy={40} r={4} fill={palette.orbColor} animatedProps={orbProps} />
        <AnimatedPath d={MTN_BACK_D} fill={palette.mtnBack} opacity={palette.mtnBackOpacity} animatedProps={mtnBackProps} />
        <AnimatedPath d={MTN_FRONT_D} fill={palette.mtnFront} animatedProps={mtnFrontProps} />
        <AnimatedPath
          d={ROUTE_D}
          fill="none"
          stroke={palette.pathColor}
          strokeOpacity={palette.pathOpacity}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeDasharray={String(ROUTE_LENGTH)}
          animatedProps={routeProps}
        />
        <AnimatedCircle cx={34} cy={168} r={5.5} fill={palette.pathColor} origin="34,168" animatedProps={ptAProps} />
        <AnimatedCircle cx={158} cy={132} r={5.5} fill={palette.pathColor} origin="158,132" animatedProps={ptBProps} />
        <AnimatedCircle cx={262} cy={58} r={7} fill={palette.pathColor} origin="262,58" animatedProps={ptCProps} />
        <AnimatedCircle r={4.5} fill={palette.markerColor} animatedProps={markerProps} />
      </Svg>

      <View style={styles.wordmarkClip}>
        <View style={styles.wordmarkInner}>
          <AnimatedText style={[styles.wordmark, wordStyle, { color: palette.wordmarkColor }]}>WAYORA</AnimatedText>
          <AnimatedView style={[styles.wordmarkShimmer, shimmerStyle]} pointerEvents="none">
            <ExpoLinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.wordmarkShimmerGradient}
            />
          </AnimatedView>
        </View>
      </View>

      <AnimatedView style={[styles.logoWrap, logoStyle]}>
        <AnimatedView style={[styles.sealGlowWrap, glowStyle]}>
          <Svg width={220} height={220} viewBox="0 0 220 220">
            <Defs>
              <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={SEAL_COLOR} stopOpacity={0.32} />
                <Stop offset="1" stopColor={SEAL_COLOR} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={110} cy={110} r={110} fill="url(#glow)" />
          </Svg>
        </AnimatedView>
        <Image source={require("../../assets/splash-icon.png")} style={styles.logo} />
      </AnimatedView>

      <AnimatedView style={[styles.greetingWrap, greetingStyle]}>
        <Text style={[styles.greeting, { color: palette.greetingColor }]}>{greeting}</Text>
      </AnimatedView>
    </AnimatedView>
  );
}

function BirdIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={10} viewBox="0 0 20 10">
      <Path d="M1 6 Q5 1 10 6 Q15 1 19 6" stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999
  },
  bird: {
    position: "absolute",
    top: "16%",
    left: 0
  },
  birdLower: { top: "26%" },
  wordmarkClip: {
    position: "absolute",
    top: "28%",
    left: 0,
    right: 0,
    alignItems: "center"
  },
  wordmarkInner: {
    width: 210,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  wordmark: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800"
  },
  wordmarkShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60
  },
  wordmarkShimmerGradient: {
    flex: 1
  },
  logoWrap: {
    position: "absolute",
    top: "47%",
    left: "50%",
    marginLeft: -62,
    marginTop: -62,
    width: 124,
    height: 124,
    alignItems: "center",
    justifyContent: "center"
  },
  sealGlowWrap: {
    position: "absolute",
    top: -48,
    left: -48
  },
  logo: {
    width: 124,
    height: 124,
    borderRadius: 62,
    resizeMode: "cover",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10
  },
  greetingWrap: {
    position: "absolute",
    top: "78%",
    left: 0,
    right: 0,
    alignItems: "center"
  },
  greeting: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8
  }
});
