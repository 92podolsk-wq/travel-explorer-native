import { forwardRef } from "react";
import { TextInput as RNTextInput } from "react-native";
import type { TextInput as RNTextInputInstance, TextInputProps } from "react-native";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { resolveManropeFamily } from "./fonts";

export const TextInput = forwardRef<RNTextInputInstance, TextInputProps>(function TextInput({ style, ...props }, ref) {
  const language = useExplorerStore((state) => state.language);

  if (language !== "ru") {
    return <RNTextInput ref={ref} style={style} {...props} />;
  }

  const fontFamily = resolveManropeFamily(style);
  return <RNTextInput ref={ref} style={[style, { fontFamily }]} {...props} />;
});
