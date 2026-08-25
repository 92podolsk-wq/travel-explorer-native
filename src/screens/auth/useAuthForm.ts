import { useState } from "react";
import { yandexLogin } from "react-native-yandex-login";
import { login, register, loginWithYandex, getMe } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";
import { saveToken } from "@/shared/storage/token-storage";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useTranslations } from "@/shared/i18n/useTranslations";
import type { AuthMeResponse, User } from "@/entities/user/model/types";

export type AuthMode = "login" | "register";

export function useAuthForm() {
  const t = useTranslations();
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isYandexSubmitting, setIsYandexSubmitting] = useState(false);

  function applyAuthUser(user: User | null, me: AuthMeResponse) {
    hydrateAuth(
      user,
      user
        ? {
            favoritePoiIds: me.favoritePoiIds ?? [],
            viewedPoiIds: me.viewedPoiIds ?? [],
            visitedPoiIds: me.visitedPoiIds ?? []
          }
        : undefined
    );
  }

  async function handleSubmit() {
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const { token } =
        mode === "login" ? await login(email, password) : await register(email, password, username, name || undefined);
      await saveToken(token);
      const me = await getMe();
      applyAuthUser(me.user, me);
    } catch (err) {
      const serverMessage = err instanceof ApiError && (err.body as { error?: string } | null)?.error;
      setError(serverMessage || (mode === "login" ? t.auth.loginError : t.auth.registerError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleYandexLogin() {
    setError(null);
    setIsYandexSubmitting(true);
    try {
      const { token: yandexToken } = await yandexLogin();
      const { token } = await loginWithYandex(yandexToken);
      await saveToken(token);
      const me = await getMe();
      applyAuthUser(me.user, me);
    } catch (err) {
      const serverMessage = err instanceof ApiError && (err.body as { error?: string } | null)?.error;
      setError(serverMessage || t.auth.yandexError);
    } finally {
      setIsYandexSubmitting(false);
    }
  }

  return {
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
  };
}
