import { forwardRef } from "react";
import { Text as RNText } from "react-native";
import type { Text as RNTextInstance, TextProps } from "react-native";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { resolveManropeFamily } from "./fonts";

export const Text = forwardRef<RNTextInstance, TextProps>(function Text({ style, ...props }, ref) {
  const language = useExplorerStore((state) => state.language);

  if (language !== "ru") {
    return <RNText ref={ref} style={style} {...props} />;
  }

  const fontFamily = resolveManropeFamily(style);
  return <RNText ref={ref} style={[style, { fontFamily }]} {...props} />;
});
