import { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { login, register, getMe } from "@/shared/api/auth";
import { saveToken } from "@/shared/storage/token-storage";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";

type Mode = "login" | "register";

export function AuthScreen() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const { token } = mode === "login" ? await login(email, password) : await register(email, password, name || undefined);
      await saveToken(token);
      const me = await getMe();
      hydrateAuth(
        me.user,
        me.user
          ? {
              favoritePoiIds: me.favoritePoiIds ?? [],
              viewedPoiIds: me.viewedPoiIds ?? [],
              visitedPoiIds: me.visitedPoiIds ?? []
            }
          : undefined
      );
    } catch {
      setError(mode === "login" ? t.auth.loginError : t.auth.registerError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>{mode === "login" ? t.auth.loginTitle : t.auth.registerTitle}</Text>

      {mode === "register" && (
        <TextInput style={styles.input} placeholder={t.auth.name} value={name} onChangeText={setName} autoCapitalize="words" />
      )}
      <TextInput
        style={styles.input}
        placeholder={t.auth.email}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput style={styles.input} placeholder={t.auth.password} value={password} onChangeText={setPassword} secureTextEntry />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.buttonText}>{t.auth.submit}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode((m) => (m === "login" ? "register" : "login"))}>
        <Text style={styles.switchLink}>
          {mode === "login" ? t.auth.switchToRegister : t.auth.switchToLogin}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.background },
    title: { fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center", color: colors.textPrimary },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary
    },
    error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
    button: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
    buttonText: { color: colors.textInverse, fontWeight: "600", fontSize: 15 },
    switchLink: { marginTop: 16, textAlign: "center", color: colors.textSecondary, fontSize: 13 }
  });
}
