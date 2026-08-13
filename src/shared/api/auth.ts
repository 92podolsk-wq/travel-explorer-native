import type { AuthMeResponse, User } from "@/entities/user/model/types";
import { apiJson } from "./client";

type AuthResponse = { user: User; token: string };

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
}

export function register(email: string, password: string, username: string, name?: string): Promise<AuthResponse> {
  return apiJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username, name })
  });
}

export function getMe(): Promise<AuthMeResponse> {
  return apiJson<AuthMeResponse>("/api/auth/me");
}

export function revokeToken(token: string): Promise<void> {
  return apiJson<void>("/api/auth/device-token", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
}

export function updateAvatar(avatarId: string): Promise<{ user: User }> {
  return apiJson<{ user: User }>("/api/me/avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarId })
  });
}

export function updateProfile(name: string, username: string, hideFromSearch?: boolean): Promise<{ user: User }> {
  return apiJson<{ user: User }>("/api/me/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username, hideFromSearch })
  });
}
