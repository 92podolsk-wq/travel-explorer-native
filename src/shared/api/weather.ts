import { apiJson } from "./client";

export type WeatherPoint = { tempC: number; code: string };
export type WeatherResponse = { now: WeatherPoint; tomorrow: WeatherPoint };

export function getWeather(lat: number, lon: number, timeZoneOffsetHours: number): Promise<WeatherResponse> {
  return apiJson<WeatherResponse>(`/api/weather?lat=${lat}&lon=${lon}&tz=${timeZoneOffsetHours}`);
}
