import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

// A radar-style pulsing ring anchored to a map coordinate — used to call out
// the user's live location and the currently selected POI. Rendered as a
// hollow ring (no fill) so it can never visually cover whatever marker
// already sits at that point, regardless of GL/annotation stacking order.
type PulseMarkerProps = {
  lngLat: [number, number];
  color: string;
};

const RING_SIZE = 44;

export function PulseMarker({ lngLat, color }: PulseMarkerProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 0.3 + progress.value * 0.7 }]
  }));

  return (
    <Marker lngLat={lngLat} anchor="center">
      <Animated.View style={[styles.ring, { borderColor: color }, animatedStyle]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    backgroundColor: "transparent"
  }
});
