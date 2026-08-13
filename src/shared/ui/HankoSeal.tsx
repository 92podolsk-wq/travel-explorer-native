import { StyleSheet, View } from "react-native";
import { Text } from "@/shared/ui/AppText";

type HankoSealProps = {
  character: string;
  size?: number;
};

// Ported from the web app's src/shared/ui/hanko-seal.tsx — a plain rotated
// square, not SVG, so it needed no native dependency to bring over.
export function HankoSeal({ character, size = 28 }: HankoSealProps) {
  return (
    <View style={[styles.seal, { width: size, height: size, borderRadius: size * 0.15 }]}>
      <Text style={[styles.character, { fontSize: size * 0.5 }]}>{character}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  seal: {
    backgroundColor: "#a3312c",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  character: { color: "#f6efe2", fontWeight: "700" }
});
