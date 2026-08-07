import { OfflineManager, type OfflinePackStatus } from "@maplibre/maplibre-react-native";
import { Directory, File, Paths } from "expo-file-system";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import { API_ORIGIN } from "@/shared/api/client";

export type OfflineProgress = { percentage: number; state: OfflinePackStatus["state"] };

const PHOTOS_DIR_NAME = "offline-photos";

function photosDirectory(): Directory {
  return new Directory(Paths.document, PHOTOS_DIR_NAME);
}

// Deletes every cached offline photo regardless of which region it belongs
// to — used by the "clear cache" maintenance action in Profile settings.
// Map tile packs are left untouched (those are managed per-region via the
// download/delete controls, not bulk-cleared).
export function clearAllOfflinePhotoCache(): void {
  const dir = photosDirectory();
  if (dir.exists) dir.delete();
}

function extensionFromUrl(url: string): string {
  const match = url.match(/\.(jpe?g|png|webp)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

// photo.id is often derived from a source URL/path (e.g. a scraped image URL),
// so it can contain "/", ":", "?" etc. — strip anything unsafe as a filename.
function sanitizeFileName(id: string): string {
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(-120);
  return sanitized || "photo";
}

function localPhotoFile(photoId: string, url: string): File {
  return new File(photosDirectory(), `${sanitizeFileName(photoId)}.${extensionFromUrl(url)}`);
}

// Photo URLs from the backend can be relative (e.g. admin-uploaded photos
// stored under /uploads/...) since they resolve fine against the site's own
// origin in a browser, but React Native's Image has no notion of "current
// origin" — relative URIs just fail to load silently.
function resolveAbsoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url}`;
}

// Falls back to the remote URL when the photo hasn't been downloaded for
// offline use (or the region's offline pack was deleted).
export function resolveOfflinePhotoUri(photoId: string, url: string): string {
  const absoluteUrl = resolveAbsoluteUrl(url);
  try {
    const file = localPhotoFile(photoId, url);
    return file.exists ? file.uri : absoluteUrl;
  } catch {
    return absoluteUrl;
  }
}

export async function downloadRegionPhotos(
  regionPois: Poi[],
  onProgress: (done: number, total: number) => void
): Promise<void> {
  const dir = photosDirectory();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

  const photos = regionPois.flatMap((poi) => poi.photos);
  let done = 0;
  onProgress(0, photos.length);
  for (const photo of photos) {
    const file = localPhotoFile(photo.id, photo.url);
    if (!file.exists) {
      try {
        await File.downloadFileAsync(photo.url, file, { idempotent: true });
      } catch (e) {
        console.warn("[offline-maps] photo download failed", photo.url, e);
      }
    }
    done += 1;
    onProgress(done, photos.length);
  }
}

export function deleteRegionPhotos(regionPois: Poi[]): void {
  for (const poi of regionPois) {
    for (const photo of poi.photos) {
      try {
        const file = localPhotoFile(photo.id, photo.url);
        if (file.exists) file.delete();
      } catch {
        // ignore — best-effort cleanup
      }
    }
  }
}

function regionMetadata(regionId: string) {
  return { regionId };
}

export async function getDownloadedRegionIds(): Promise<string[]> {
  const packs = await OfflineManager.getPacks();
  return packs.filter((p) => typeof p.metadata.regionId === "string").map((p) => p.metadata.regionId as string);
}

// On-device storage (tiles + cached photos) for each downloaded region, in bytes.
export async function getOfflineStorageBytesByRegion(
  downloadedRegionIds: string[],
  allPois: Poi[]
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const regionId of downloadedRegionIds) result[regionId] = 0;

  const packs = await OfflineManager.getPacks();
  for (const pack of packs) {
    const regionId = pack.metadata.regionId;
    if (typeof regionId === "string" && regionId in result) {
      const status = await pack.status();
      result[regionId] += status.completedResourceSize;
    }
  }

  for (const poi of allPois) {
    if (!(poi.regionId in result)) continue;
    for (const photo of poi.photos) {
      result[poi.regionId] += localPhotoFile(photo.id, photo.url).size;
    }
  }

  return result;
}

export async function downloadRegionOffline(
  region: Region,
  mapStyleUrl: string,
  onProgress: (progress: OfflineProgress) => void
): Promise<void> {
  const bounds: [number, number, number, number] = [
    region.bounds[0][0],
    region.bounds[0][1],
    region.bounds[1][0],
    region.bounds[1][1]
  ];

  await OfflineManager.createPack(
    {
      mapStyle: mapStyleUrl,
      bounds,
      minZoom: Math.max(0, region.defaultZoom - 2),
      maxZoom: Math.min(16, region.defaultZoom + 4),
      metadata: regionMetadata(region.id)
    },
    (_pack, status) => onProgress({ percentage: status.percentage, state: status.state }),
    (_pack, error) => console.warn("[offline-maps] download error", error.message)
  );
}

export async function deleteRegionOffline(regionId: string): Promise<void> {
  const packs = await OfflineManager.getPacks();
  const pack = packs.find((p) => p.metadata.regionId === regionId);
  if (pack) await OfflineManager.deletePack(pack.id);
}
