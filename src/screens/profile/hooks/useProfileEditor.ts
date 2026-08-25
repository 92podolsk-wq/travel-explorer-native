import { useState } from "react";
import { Alert } from "react-native";
import { updateAvatar, updateProfile } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";

export function useProfileEditor() {
  const t = useTranslations();
  const currentUser = useExplorerStore((state) => state.currentUser);
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);

  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hideFromSearchDraft, setHideFromSearchDraft] = useState(false);

  async function handleSelectAvatar(avatarId: string) {
    try {
      const { user } = await updateAvatar(avatarId);
      hydrateAuth(user);
      setIsAvatarPickerOpen(false);
    } catch (err) {
      const serverMessage = err instanceof ApiError && (err.body as { error?: string } | null)?.error;
      Alert.alert(t.auth.registerError, serverMessage || undefined);
    }
  }

  function handleStartEditProfile() {
    setNameDraft(currentUser?.name ?? "");
    setUsernameDraft(currentUser?.username ?? "");
    setHideFromSearchDraft(currentUser?.hideFromSearch ?? false);
    setProfileError(null);
    setIsEditProfileOpen(true);
  }

  async function handleSaveProfile() {
    setProfileError(null);
    setIsSavingProfile(true);
    try {
      const { user } = await updateProfile(nameDraft, usernameDraft, hideFromSearchDraft);
      hydrateAuth(user);
      setIsEditProfileOpen(false);
    } catch (err) {
      const serverMessage = err instanceof ApiError && (err.body as { error?: string } | null)?.error;
      setProfileError(serverMessage || t.auth.registerError);
    } finally {
      setIsSavingProfile(false);
    }
  }

  return {
    isAvatarPickerOpen,
    setIsAvatarPickerOpen,
    isEditProfileOpen,
    setIsEditProfileOpen,
    nameDraft,
    setNameDraft,
    usernameDraft,
    setUsernameDraft,
    profileError,
    isSavingProfile,
    hideFromSearchDraft,
    setHideFromSearchDraft,
    handleSelectAvatar,
    handleStartEditProfile,
    handleSaveProfile
  };
}
