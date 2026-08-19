import type { Language } from "@/shared/i18n/types";

// Abbreviated units ("мин.", "ч.", "дн.") sidestep Russian noun pluralization
// (min/mins/minutes forms differ by count) without needing a full plural-rules table.
export function formatLastSeen(lastSeenAt: string | null, isOnline: boolean, language: Language): string {
  if (isOnline) return language === "ru" ? "В сети" : "Online";
  if (!lastSeenAt) return language === "ru" ? "Не в сети" : "Offline";

  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return language === "ru" ? "Был(а) в сети только что" : "Last seen just now";
  if (diffMin < 60) return language === "ru" ? `Был(а) в сети ${diffMin} мин. назад` : `Last seen ${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return language === "ru" ? `Был(а) в сети ${diffHours} ч. назад` : `Last seen ${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return language === "ru" ? "Был(а) в сети вчера" : "Last seen yesterday";
  if (diffDays < 30) return language === "ru" ? `Был(а) в сети ${diffDays} дн. назад` : `Last seen ${diffDays}d ago`;

  return language === "ru" ? "Давно не был(а) в сети" : "Last seen a while ago";
}
