import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import type { TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Line, Path, Rect, Stop } from "react-native-svg";
import { Text } from "@/shared/ui/AppText";
import { TextInput } from "@/shared/ui/AppTextInput";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { useAuthForm } from "./useAuthForm";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_HEIGHT = 230;

const SKY = ["#f6ecd8", "#eeddbb", "#b9d2c1", "#7fa893"];
const MTN_BACK = "#82ac9a";
const MTN_FRONT = "#57816e";
const SUN_COLOR = "#e8672e";

const MTN_BACK_D =
  "M -20 150 L 30 100 L 70 135 L 120 85 L 170 130 L 210 95 L 260 140 L 320 110 L 320 220 L -20 220 Z";
const MTN_FRONT_D = "M -20 175 L 40 130 L 90 165 L 150 120 L 200 160 L 250 125 L 320 165 L 320 220 L -20 220 Z";

type AuthFieldProps = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
};

function AuthField({ label, icon, isPassword, colors, styles, ...inputProps }: AuthFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
        <Ionicons name={icon} size={18} color={isFocused ? colors.primary : colors.icon} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...inputProps}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setIsPasswordVisible((value) => !value)} hitSlop={8}>
            <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={18} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function AuthHero({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.hero}>
      <Svg width={SCREEN_W} height={HERO_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="authSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={SKY[0]} />
            <Stop offset="0.3" stopColor={SKY[1]} />
            <Stop offset="0.65" stopColor={SKY[2]} />
            <Stop offset="1" stopColor={SKY[3]} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={SCREEN_W} height={HERO_HEIGHT} fill="url(#authSky)" />
      </Svg>
      <Svg
        width={SCREEN_W}
        height={HERO_HEIGHT}
        viewBox="0 0 300 220"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Circle cx={44} cy={46} r={16} fill={SUN_COLOR} opacity={0.85} />
        <Ellipse cx={238} cy={54} rx={13} ry={16} fill="none" stroke="#57816e" strokeWidth={1.6} opacity={0.7} />
        <Path d="M 232 68 L 227 78 L 249 78 L 244 68 Z" fill="none" stroke="#57816e" strokeWidth={1.6} opacity={0.7} />
        <Line x1={228} y1={68} x2={233} y2={78} stroke="#57816e" strokeWidth={1} opacity={0.7} />
        <Line x1={248} y1={68} x2={243} y2={78} stroke="#57816e" strokeWidth={1} opacity={0.7} />
        <Path d={MTN_BACK_D} fill={MTN_BACK} opacity={0.7} />
        <Path d={MTN_FRONT_D} fill={MTN_FRONT} />
      </Svg>
      <View style={styles.heroContent}>
        <View style={styles.wordmarkRow}>
          <Ionicons name="sparkles" size={18} color="#f6efe0" />
          <Text style={styles.wordmark}>Wayora</Text>
        </View>
      </View>
    </View>
  );
}

export function AuthScreen() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    mode,
    setMode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    name,
    setName,
    username,
    setUsername,
    error,
    isSubmitting,
    isYandexSubmitting,
    handleSubmit,
    handleYandexLogin
  } = useAuthForm();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthHero styles={styles} />

        <View style={styles.sheet}>
          <Text style={styles.title}>{mode === "login" ? t.auth.loginTitle : t.auth.registerTitle}</Text>
          <Text style={styles.subtitle}>{mode === "login" ? t.auth.loginSubtitle : t.auth.registerSubtitle}</Text>

          {mode === "register" && (
            <AuthField
              label={t.auth.username}
              icon="at-outline"
              placeholder={t.auth.username}
              value={username}
              onChangeText={(value) => setUsername(value.toLowerCase())}
              autoCapitalize="none"
              autoCorrect={false}
              colors={colors}
              styles={styles}
            />
          )}
          {mode === "register" && (
            <AuthField
              label={t.auth.name}
              icon="person-outline"
              placeholder={t.auth.name}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              colors={colors}
              styles={styles}
            />
          )}
          <AuthField
            label={t.auth.email}
            icon="mail-outline"
            placeholder={t.auth.email}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            colors={colors}
            styles={styles}
          />
          <AuthField
            label={t.auth.password}
            icon="lock-closed-outline"
            placeholder={t.auth.password}
            value={password}
            onChangeText={setPassword}
            isPassword
            colors={colors}
            styles={styles}
          />
          {mode === "register" && (
            <AuthField
              label={t.auth.confirmPassword}
              icon="lock-closed-outline"
              placeholder={t.auth.confirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              colors={colors}
              styles={styles}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Text style={styles.buttonText}>{t.auth.submit}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t.auth.continueWith}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.yandexButton} onPress={handleYandexLogin} disabled={isYandexSubmitting}>
            {isYandexSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={styles.yandexMark}>
                  <Text style={styles.yandexMarkText}>Я</Text>
                </View>
                <Text style={styles.yandexButtonText}>{t.auth.loginWithYandex}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode((m) => (m === "login" ? "register" : "login"))}>
            <Text style={styles.switchLink}>{mode === "login" ? t.auth.switchToRegister : t.auth.switchToLogin}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1 },
    hero: { height: HERO_HEIGHT, overflow: "hidden" },
    heroContent: { flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 16 },
    wordmarkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    wordmark: { fontSize: 24, fontWeight: "800", color: "#f6efe0", letterSpacing: 0.5 },
    sheet: {
      marginTop: -24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: colors.surface,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 32
    },
    title: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
    subtitle: { fontSize: 13.5, color: colors.textSecondary, marginTop: 4, marginBottom: 22 },
    field: { marginBottom: 14 },
    label: { fontSize: 12.5, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border
    },
    inputRowFocused: { borderColor: colors.primary },
    inputIcon: { marginRight: 8 },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary
    },
    error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      marginTop: 4
    },
    buttonText: { color: colors.textInverse, fontWeight: "700", fontSize: 15 },
    dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 22, marginBottom: 16 },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
    dividerText: { fontSize: 12, color: colors.textTertiary },
    yandexButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: "#fc3f1d",
      borderRadius: 10,
      paddingVertical: 14
    },
    yandexMark: {
      width: 20,
      height: 20,
      borderRadius: 5,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center"
    },
    yandexMarkText: { color: "#fc3f1d", fontSize: 12, fontWeight: "800" },
    yandexButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    switchLink: { marginTop: 22, textAlign: "center", color: colors.textSecondary, fontSize: 13 }
  });
}
