import { useEffect } from "react";
import { Dimensions, Image, Pressable, StyleSheet } from "react-native";
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
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { hapticSuccess, hapticTap } from "@/shared/haptics";

type WelcomeIntroProps = { onFinish: () => void };

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const SKY = ["#f5e9d3", "#e7d3ad", "#7fa393", "#386358"];
const MTN_BACK = "#4c7267";
const MTN_FRONT = "#2c4d43";
const ORB_COLOR = "#e8672e";
const PATH_COLOR = "#f6efe0";
const MARKER_COLOR = "#e8672e";

const MTN_BACK_D =
  "M -20 150 L 30 100 L 70 135 L 120 85 L 170 130 L 210 95 L 260 140 L 320 110 L 320 220 L -20 220 Z";
const MTN_FRONT_D =
  "M -20 175 L 40 130 L 90 165 L 150 120 L 200 160 L 250 125 L 320 165 L 320 220 L -20 220 Z";
const ROUTE_D = "M 34 168 C 88 118, 116 184, 158 132 C 190 92, 228 112, 262 58";
const ROUTE_LENGTH = 420;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  const bird1X = useSharedValue(-30);
  const bird1Y = useSharedValue(0);
  const bird1Opacity = useSharedValue(0);
  const bird2X = useSharedValue(-30);
  const bird2Y = useSharedValue(0);
  const bird2Opacity = useSharedValue(0);

  useEffect(() => {
    mtnBackX.value = withRepeat(
      withSequence(withTiming(8, { duration: 3500 }), withTiming(-8, { duration: 3500 })),
      -1
    );
    mtnFrontX.value = withRepeat(
      withSequence(withTiming(-8, { duration: 2250 }), withTiming(8, { duration: 2250 })),
      -1
    );

    orbOpacity.value = withDelay(100, withTiming(0.92, { duration: 900, easing: Easing.out(Easing.cubic) }));
    orbR.value = withDelay(100, withTiming(20, { duration: 900, easing: Easing.out(Easing.cubic) }));

    pathProgress.value = withDelay(600, withTiming(1, { duration: 1600, easing: Easing.bezier(0.4, 0, 0.2, 1) }));

    ptA.value = withDelay(700, withTiming(1, { duration: 500 }));
    ptB.value = withDelay(1150, withTiming(1, { duration: 500 }));
    ptCOpacity.value = withDelay(1600, withTiming(1, { duration: 500 }));
    ptCScale.value = withDelay(
      1600,
      withSequence(
        withTiming(1, { duration: 500 }),
        withDelay(400, withSequence(withTiming(1.5, { duration: 400 }), withTiming(1, { duration: 400 })))
      )
    );

    markerOpacity.value = withDelay(2150, withTiming(1, { duration: 300 }));
    markerT.value = withDelay(2150, withTiming(1, { duration: 1150, easing: Easing.bezier(0.4, 0, 0.2, 1) }));

    logoOpacity.value = withDelay(
      3150,
      withTiming(1, { duration: 1400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }, (finished) => {
        if (finished) runOnJS(hapticSuccess)();
      })
    );
    logoScale.value = withDelay(3150, withTiming(1, { duration: 1400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));

    wordOpacity.value = withDelay(
      3750,
      withTiming(1, { duration: 1000 }, (finished) => {
        if (finished) runOnJS(hapticTap)();
      })
    );
    wordSpacing.value = withDelay(3750, withTiming(6, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));

    bird1Opacity.value = withDelay(
      400,
      withSequence(withTiming(0.75, { duration: 700 }), withTiming(0.75, { duration: 3600 }), withTiming(0, { duration: 700 }))
    );
    bird1X.value = withDelay(400, withTiming(SCREEN_W + 30, { duration: 5000, easing: Easing.linear }));
    bird1Y.value = withDelay(400, withSequence(withTiming(-14, { duration: 2500 }), withTiming(-28, { duration: 2500 })));

    bird2Opacity.value = withDelay(
      1800,
      withSequence(withTiming(0.7, { duration: 700 }), withTiming(0.7, { duration: 2600 }), withTiming(0, { duration: 700 }))
    );
    bird2X.value = withDelay(1800, withTiming(SCREEN_W + 30, { duration: 4000, easing: Easing.linear }));
    bird2Y.value = withDelay(1800, withSequence(withTiming(-10, { duration: 2000 }), withTiming(-20, { duration: 2000 })));

    containerOpacity.value = withDelay(
      5150,
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
  const bird1Style = useAnimatedStyle(() => ({
    opacity: bird1Opacity.value,
    transform: [{ translateX: bird1X.value }, { translateY: bird1Y.value }]
  }));
  const bird2Style = useAnimatedStyle(() => ({
    opacity: bird2Opacity.value,
    transform: [{ translateX: bird2X.value }, { translateY: bird2Y.value }]
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onFinish} />

      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={SKY[0]} />
            <Stop offset="0.22" stopColor={SKY[1]} />
            <Stop offset="0.55" stopColor={SKY[2]} />
            <Stop offset="1" stopColor={SKY[3]} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="url(#sky)" />
      </Svg>

      <Animated.View style={[styles.bird, bird1Style]}>
        <BirdIcon />
      </Animated.View>
      <Animated.View style={[styles.bird, styles.birdLower, bird2Style]}>
        <BirdIcon />
      </Animated.View>

      <Svg
        width={SCREEN_W}
        height={SCREEN_H}
        viewBox="0 0 300 220"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <AnimatedCircle cx={245} cy={40} r={4} fill={ORB_COLOR} animatedProps={orbProps} />
        <AnimatedPath d={MTN_BACK_D} fill={MTN_BACK} opacity={0.75} animatedProps={mtnBackProps} />
        <AnimatedPath d={MTN_FRONT_D} fill={MTN_FRONT} animatedProps={mtnFrontProps} />
        <AnimatedPath
          d={ROUTE_D}
          fill="none"
          stroke={PATH_COLOR}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeDasharray={String(ROUTE_LENGTH)}
          animatedProps={routeProps}
        />
        <AnimatedCircle cx={34} cy={168} r={5.5} fill={PATH_COLOR} origin="34,168" animatedProps={ptAProps} />
        <AnimatedCircle cx={158} cy={132} r={5.5} fill={PATH_COLOR} origin="158,132" animatedProps={ptBProps} />
        <AnimatedCircle cx={262} cy={58} r={7} fill={PATH_COLOR} origin="262,58" animatedProps={ptCProps} />
        <AnimatedCircle r={4.5} fill={MARKER_COLOR} animatedProps={markerProps} />
      </Svg>

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image source={require("../../assets/splash-icon.png")} style={styles.logo} />
      </Animated.View>
      <Animated.Text style={[styles.wordmark, wordStyle]}>WAYORA</Animated.Text>
    </Animated.View>
  );
}

function BirdIcon() {
  return (
    <Svg width={20} height={10} viewBox="0 0 20 10">
      <Path d="M1 6 Q5 1 10 6 Q15 1 19 6" stroke={PATH_COLOR} strokeWidth={1.6} strokeLinecap="round" fill="none" />
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
    backgroundColor: SKY[3],
    zIndex: 999
  },
  bird: {
    position: "absolute",
    top: "16%",
    left: 0
  },
  birdLower: { top: "26%" },
  logoWrap: {
    position: "absolute",
    top: "40%",
    left: "50%",
    marginLeft: -62,
    marginTop: -62,
    width: 124,
    height: 124,
    borderRadius: 62,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10
  },
  logo: { width: "100%", height: "100%", resizeMode: "cover" },
  wordmark: {
    position: "absolute",
    top: "68%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800",
    color: PATH_COLOR
  }
});
