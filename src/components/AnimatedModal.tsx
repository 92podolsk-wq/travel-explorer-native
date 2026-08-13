import { useEffect, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, type ViewStyle } from "react-native";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

const SPRING = { damping: 28, stiffness: 320 };
const EXIT_DURATION = 180;
// Larger than any sheet/card we show, so the slide-in always starts fully off-screen.
const SLIDE_DISTANCE = 600;

function useModalPresence(visible: boolean) {
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withSpring(1, SPRING);
    } else if (mounted) {
      progress.value = withTiming(0, { duration: EXIT_DURATION }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return { mounted, progress };
}

type AnimatedBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyle?: ViewStyle | ViewStyle[];
  backdropColor: string;
};

// Bottom sheet: fades in a backdrop and springs the content up from below,
// used for the app's various filter/picker/generator sheets.
export function AnimatedBottomSheet({ visible, onClose, children, contentStyle, backdropColor }: AnimatedBottomSheetProps) {
  const { mounted, progress } = useModalPresence(visible);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * SLIDE_DISTANCE }]
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: backdropColor }, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheetContainer, contentStyle, sheetStyle]}>{children}</Animated.View>
    </Modal>
  );
}

type AnimatedCenterModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyle?: ViewStyle | ViewStyle[];
  backdropColor: string;
};

// Centered card: fades in a backdrop and pops the card in with a soft scale,
// used for pickers/confirmations that aren't anchored to the bottom.
export function AnimatedCenterModal({ visible, onClose, children, contentStyle, backdropColor }: AnimatedCenterModalProps) {
  const { mounted, progress } = useModalPresence(visible);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.92 + progress.value * 0.08 }]
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: backdropColor }, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.centerContainer, cardStyle]} pointerEvents="box-none">
        <Pressable style={contentStyle} onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetContainer: { position: "absolute", left: 0, right: 0, bottom: 0 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "stretch", padding: 24 }
});
