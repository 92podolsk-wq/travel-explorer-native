import { useState } from "react";
import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Text } from "@/shared/ui/AppText";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { resolveOfflinePhotoUri } from "@/shared/map/offline-maps";
import type { Photo } from "@/entities/poi/model/types";

type PhotoViewerModalProps = {
  visible: boolean;
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
};

const DISMISS_DISTANCE = 220;
const DISMISS_THRESHOLD = 90;

// Renders as a plain absolutely-positioned overlay rather than its own RN
// <Modal> — a nested Modal opens a second native window on Android, and a
// GestureDetector inside it has no GestureHandlerRootView ancestor within
// that window (the app's root one lives in the outer PoiDetailSheet Modal),
// which crashed the app as soon as this opened. Rendering as a sibling
// inside PoiDetailSheet's existing Modal/GestureHandlerRootView avoids the
// second window entirely.
export function PhotoViewerModal({ visible, photos, initialIndex, onClose }: PhotoViewerModalProps) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const translateY = useSharedValue(0);

  // Swiping the photo itself up or down (not the horizontal photo-to-photo
  // swipe) dismisses the viewer, matching the bidirectional close gesture
  // already used on the map's POI preview card.
  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-12, 12])
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const pastThreshold = Math.abs(translateY.value) > DISMISS_THRESHOLD || Math.abs(event.velocityY) > 800;
      if (pastThreshold) {
        const direction = translateY.value < 0 ? -1 : 1;
        translateY.value = withTiming(direction * DISMISS_DISTANCE, { duration: 180 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 150 });
      }
    });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1 - Math.min(1, Math.abs(translateY.value) / DISMISS_DISTANCE) * 0.6
  }));

  // The early return must come after every hook above — bailing out before
  // useAnimatedStyle would call a different number of hooks on the render
  // where `visible` flips to true than on the renders before it, which
  // crashes React with a "Rendered more hooks than during the previous
  // render" error the instant this modal opens.
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.backdrop}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.flex, containerAnimatedStyle]}>
            <FlatList
              data={photos}
              keyExtractor={(photo) => photo.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={initialIndex}
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
              }}
              renderItem={({ item }) => (
                <View style={{ width, height }}>
                  <Image
                    source={{ uri: resolveOfflinePhotoUri(item.id, item.url) }}
                    style={styles.image}
                    contentFit="contain"
                  />
                </View>
              )}
            />
          </Animated.View>
        </GestureDetector>

        <AnimatedPressable style={styles.closeButton} onPress={onClose} scaleTo={0.85} haptic={false}>
          <Ionicons name="close" size={20} color="#fff" />
        </AnimatedPressable>

        {photos.length > 1 ? (
          <View style={styles.counter} pointerEvents="none">
            <Text style={styles.counterLabel}>
              {index + 1} / {photos.length}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 100, elevation: 100 },
  backdrop: { flex: 1, backgroundColor: "#000" },
  flex: { flex: 1 },
  image: { width: "100%", height: "100%" },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 44,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center"
  },
  counter: {
    position: "absolute",
    alignSelf: "center",
    top: 50,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  counterLabel: { fontSize: 12, fontWeight: "700", color: "#fff" }
});
