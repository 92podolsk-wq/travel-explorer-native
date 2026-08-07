import { StyleSheet, Text, View } from "react-native";
import { avatarPresentation, isAvatarId } from "@/entities/user/model/avatars";

type ProfileAvatarProps = {
  avatarId?: string | null;
  size?: number;
};

export function ProfileAvatar({ avatarId, size = 40 }: ProfileAvatarProps) {
  const resolved = avatarId && isAvatarId(avatarId) ? avatarId : "torii";
  const { emoji, color } = avatarPresentation[resolved];

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", overflow: "hidden" }
});
