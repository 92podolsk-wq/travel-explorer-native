import { apiFetch } from "./client";

export async function submitPoiReport(poiId: string, message: string): Promise<void> {
  const res = await apiFetch("/api/me/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ poiId, message })
  });
  if (!res.ok) {
    throw new Error("Failed to submit report");
  }
}
