import { useCallback, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Category } from "@/entities/category/model/types";
import { customMarkerColors } from "@/entities/custom-marker/model/types";

// Renders each POI-pin (per category) and custom-marker-pin (per palette color)
// off-screen once, then rasterizes them to PNGs via react-native-view-shot so
// they can be registered as map sprites and drawn by a native SymbolLayer.
// GL-layer icons stay perfectly locked to the map surface during pan/zoom,
// unlike the old View-based Marker overlays which visibly lagged behind.

export function poiSpriteKey(categoryId: string) {
  return `poi-${categoryId}`;
}

export function poiVisitedSpriteKey(categoryId: string) {
  return `poi-${categoryId}-visited`;
}

export function customMarkerSpriteKey(color: string) {
  return `custom-${color}`;
}

type MapMarkerSpritesProps = {
  categories: Category[];
  onReady: (uris: Record<string, string>) => void;
};

export function MapMarkerSprites({ categories, onReady }: MapMarkerSpritesProps) {
  const viewRefs = useRef<Record<string, View | null>>({});
  const captureStarted = useRef<Record<string, boolean>>({});
  const results = useRef<Record<string, string>>({});
  const total = categories.length * 2 + customMarkerColors.length;

  const handleCaptured = useCallback(() => {
    if (Object.keys(results.current).length === total && total > 0) {
      onReady({ ...results.current });
    }
  }, [onReady, total]);

  const handleLayout = useCallback(
    (key: string) => {
      if (captureStarted.current[key]) return;
      captureStarted.current[key] = true;
      // onLayout fires once the container has its size, but the vector icon
      // glyph inside can still be a frame or two from actually painting —
      // capturing immediately sometimes rasterizes just the empty pin.
      // Waiting two frames gives it time to land before the snapshot.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const view = viewRefs.current[key];
          if (!view) {
            captureStarted.current[key] = false;
            return;
          }
          // "tmpfile" (a fresh file:// path each run) rather than "data-uri":
          // a data URI is content-addressed, so if a capture is ever bad, the
          // native image loader can cache that exact bitmap under the same
          // key indefinitely across app reinstalls. A unique temp-file path
          // per run guarantees a cache miss and a fresh decode every time.
          captureRef(view, { format: "png", result: "tmpfile" })
            .then((uri) => {
              results.current[key] = uri;
              handleCaptured();
            })
            .catch(() => {
              captureStarted.current[key] = false;
            });
        });
      });
    },
    [handleCaptured]
  );

  return (
    <View style={styles.offscreen} pointerEvents="none">
      {categories.map((category) => {
        const key = poiSpriteKey(category.id);
        return (
          <View
            key={key}
            ref={(view) => {
              viewRefs.current[key] = view;
            }}
            collapsable={false}
            style={[styles.poiPin, { backgroundColor: category.color }]}
            onLayout={() => handleLayout(key)}
          >
            <CategoryIcon icon={category.icon} size={13} />
          </View>
        );
      })}
      {categories.map((category) => {
        const key = poiVisitedSpriteKey(category.id);
        return (
          <View
            key={key}
            ref={(view) => {
              viewRefs.current[key] = view;
            }}
            collapsable={false}
            style={[styles.poiPin, { backgroundColor: category.color }]}
            onLayout={() => handleLayout(key)}
          >
            <CategoryIcon icon={category.icon} size={13} />
            <View style={styles.visitedBadge}>
              <Ionicons name="checkmark" size={7} color="#ffffff" />
            </View>
          </View>
        );
      })}
      {customMarkerColors.map((color) => {
        const key = customMarkerSpriteKey(color);
        return (
          <View
            key={key}
            ref={(view) => {
              viewRefs.current[key] = view;
            }}
            collapsable={false}
            style={[styles.customPin, { backgroundColor: color }]}
            onLayout={() => handleLayout(key)}
          >
            <Ionicons name="location" size={14} color="#ffffff" />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: { position: "absolute", left: -9999, top: 0 },
  poiPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  customPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  visitedBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#287f72",
    borderWidth: 1,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  }
});
