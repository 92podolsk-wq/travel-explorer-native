import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/shared/ui/AppText";
import { TextInput } from "@/shared/ui/AppTextInput";
import { Ionicons } from "@expo/vector-icons";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import type { ThemeColors } from "@/shared/theme/colors";
import { formatLastSeen } from "@/shared/lib/format-last-seen";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { acceptFriendRequest, getFriends, removeFriendship, searchUsers, sendFriendRequest } from "@/shared/api/friends";
import type { FriendEntry, FriendsResponse, FriendUser } from "@/entities/user/model/types";
import type { Language } from "@/shared/i18n/types";

const EMPTY_RESPONSE: FriendsResponse = { friends: [], incoming: [], outgoing: [] };

type Styles = ReturnType<typeof createStyles>;

export function FriendsCard() {
  const t = useTranslations();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const language = useExplorerStore((state) => state.language);

  const [data, setData] = useState<FriendsResponse>(EMPTY_RESPONSE);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  async function loadFriends() {
    try {
      setData(await getFriends());
    } catch {
      // keep previous data on failure
    }
  }

  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);
    loadFriends().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      searchUsers(query.trim())
        .then((body) => setResults(body.users))
        .catch(() => setResults([]))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!currentUser) return null;

  const friendIds = new Set(data.friends.map((entry) => entry.user.id));
  const outgoingIds = new Set(data.outgoing.map((entry) => entry.user.id));
  const incomingIds = new Set(data.incoming.map((entry) => entry.user.id));

  async function handleSendRequest(username: string) {
    setRequestError(null);
    setPendingActionId(username);
    try {
      await sendFriendRequest(username);
      setQuery("");
      setResults([]);
      await loadFriends();
    } catch {
      setRequestError(t.auth.registerError);
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleAccept(friendshipId: string) {
    setPendingActionId(friendshipId);
    try {
      await acceptFriendRequest(friendshipId);
      await loadFriends();
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleRemove(friendshipId: string) {
    setPendingActionId(friendshipId);
    try {
      await removeFriendship(friendshipId);
      await loadFriends();
    } finally {
      setPendingActionId(null);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t.auth.friendsTitle}</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={14} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.auth.friendsSearchPlaceholder}
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {requestError ? <Text style={styles.errorText}>{requestError}</Text> : null}

      {query.trim().length >= 2 ? (
        <View style={styles.resultsGroup}>
          {isSearching ? (
            <Text style={styles.mutedText}>{t.auth.friendsSearching}</Text>
          ) : results.length === 0 ? (
            <Text style={styles.mutedText}>{t.auth.friendsNoResults}</Text>
          ) : (
            results.map((user) => (
              <View key={user.id} style={styles.row}>
                <View style={styles.rowUser}>
                  <View style={styles.avatarWrap}>
                    <ProfileAvatar avatarId={user.avatarId} size={28} />
                    {user.isOnline ? <View style={styles.avatarOnlineDot} /> : null}
                  </View>
                  <View style={styles.rowUserText}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {user.name || `@${user.username}`}
                    </Text>
                    <Text style={styles.rowUsername} numberOfLines={1}>
                      {`@${user.username} · ${formatLastSeen(user.lastSeenAt, user.isOnline, language)}`}
                    </Text>
                  </View>
                </View>
                {friendIds.has(user.id) ? (
                  <Text style={styles.mutedText}>{t.auth.friendsAlreadyFriends}</Text>
                ) : outgoingIds.has(user.id) ? (
                  <Text style={styles.mutedText}>{t.auth.friendsRequestSent}</Text>
                ) : incomingIds.has(user.id) ? (
                  <Text style={styles.mutedText}>{t.auth.friendsRespondBelow}</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleSendRequest(user.username)}
                    disabled={pendingActionId === user.username}
                  >
                    {pendingActionId === user.username ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="person-add-outline" size={12} color={colors.primary} />
                        <Text style={styles.primaryButtonLabel}>{t.auth.friendsAdd}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      ) : null}

      {data.incoming.length > 0 ? (
        <View style={styles.resultsGroup}>
          <Text style={styles.subTitle}>{t.auth.friendsIncomingTitle}</Text>
          {data.incoming.map((entry) => (
            <FriendRow key={entry.id} entry={entry} styles={styles} busy={pendingActionId === entry.id} language={language}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleAccept(entry.id)}
                disabled={pendingActionId === entry.id}
              >
                <Ionicons name="checkmark" size={12} color={colors.primary} />
                <Text style={styles.primaryButtonLabel}>{t.auth.friendsAccept}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleRemove(entry.id)}
                disabled={pendingActionId === entry.id}
              >
                <Ionicons name="close" size={12} color={colors.textSecondary} />
                <Text style={styles.secondaryButtonLabel}>{t.auth.friendsDecline}</Text>
              </TouchableOpacity>
            </FriendRow>
          ))}
        </View>
      ) : null}

      {data.outgoing.length > 0 ? (
        <View style={styles.resultsGroup}>
          <Text style={styles.subTitle}>{t.auth.friendsOutgoingTitle}</Text>
          {data.outgoing.map((entry) => (
            <FriendRow key={entry.id} entry={entry} styles={styles} busy={pendingActionId === entry.id} language={language}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleRemove(entry.id)}
                disabled={pendingActionId === entry.id}
              >
                <Ionicons name="close" size={12} color={colors.textSecondary} />
                <Text style={styles.secondaryButtonLabel}>{t.auth.friendsCancel}</Text>
              </TouchableOpacity>
            </FriendRow>
          ))}
        </View>
      ) : null}

      <View style={styles.resultsGroup}>
        <Text style={styles.subTitle}>{t.auth.friendsListTitle}</Text>
        {isLoading ? (
          <Text style={styles.mutedText}>{t.auth.friendsLoading}</Text>
        ) : data.friends.length === 0 ? (
          <Text style={styles.mutedText}>{t.auth.friendsEmpty}</Text>
        ) : (
          data.friends.map((entry) => (
            <FriendRow key={entry.id} entry={entry} styles={styles} busy={pendingActionId === entry.id} language={language}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleRemove(entry.id)}
                disabled={pendingActionId === entry.id}
              >
                <Ionicons name="person-remove-outline" size={12} color={colors.danger} />
                <Text style={[styles.secondaryButtonLabel, { color: colors.danger }]}>{t.auth.friendsRemove}</Text>
              </TouchableOpacity>
            </FriendRow>
          ))
        )}
      </View>
    </View>
  );
}

function FriendRow({
  entry,
  styles,
  busy,
  language,
  children
}: {
  entry: FriendEntry;
  styles: Styles;
  busy: boolean;
  language: Language;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.row, busy && styles.rowBusy]}>
      <View style={styles.rowUser}>
        <View style={styles.avatarWrap}>
          <ProfileAvatar avatarId={entry.user.avatarId} size={28} />
          {entry.user.isOnline ? <View style={styles.avatarOnlineDot} /> : null}
        </View>
        <View style={styles.rowUserText}>
          <Text style={styles.rowName} numberOfLines={1}>
            {entry.user.name || `@${entry.user.username}`}
          </Text>
          <Text style={styles.rowUsername} numberOfLines={1}>
            {`@${entry.user.username} · ${formatLastSeen(entry.user.lastSeenAt, entry.user.isOnline, language)}`}
          </Text>
        </View>
      </View>
      <View style={styles.rowActions}>{children}</View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 },
    cardTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 36
    },
    searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary },
    errorText: { fontSize: 11, fontWeight: "600", color: colors.danger, marginTop: 8 },
    resultsGroup: { marginTop: 12, gap: 6 },
    subTitle: { fontSize: 11, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.3 },
    mutedText: { fontSize: 12, color: colors.textTertiary },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6
    },
    rowBusy: { opacity: 0.6 },
    rowUser: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 },
    avatarWrap: { position: "relative" },
    avatarOnlineDot: {
      position: "absolute",
      right: -1,
      bottom: -1,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#34d399",
      borderWidth: 1.5,
      borderColor: colors.background
    },
    rowUserText: { flex: 1, minWidth: 0 },
    rowName: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
    rowUsername: { fontSize: 11, color: colors.textTertiary },
    rowActions: { flexDirection: "row", alignItems: "center", gap: 6 },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: colors.primarySoft
    },
    primaryButtonLabel: { fontSize: 11, fontWeight: "700", color: colors.primary },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: colors.border
    },
    secondaryButtonLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary }
  });
}
