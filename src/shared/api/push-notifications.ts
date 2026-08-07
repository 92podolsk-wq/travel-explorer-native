import { apiFetch } from "./client";

export function registerPushTokenApi(token: string) {
  return apiFetch("/api/me/push-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
}

export function unregisterPushTokenApi(token: string) {
  return apiFetch("/api/me/push-token", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
}
