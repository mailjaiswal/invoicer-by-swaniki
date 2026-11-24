import { db, getBusiness } from "@/lib/db/database";
import { serializeBackup, importBackup } from "@/lib/db/backup";
import { parseBackup } from "@/lib/backup";

export const AUTO_SNAPSHOT_KEY = "invoicer:auto-snapshot:v1";

export interface StoragePersistenceStatus {
  supported: boolean;
  persisted: boolean;
}

/**
 * Check if the browser supports `navigator.storage.persist()` and whether
 * storage is already marked persistent.
 */
export async function getStoragePersistenceStatus(): Promise<StoragePersistenceStatus> {
  if (typeof navigator === "undefined" || !navigator.storage?.persisted) {
    return { supported: false, persisted: false };
  }
  try {
    const persisted = await navigator.storage.persisted();
    return { supported: true, persisted };
  } catch {
    return { supported: false, persisted: false };
  }
}

/**
 * Ask the browser to mark this origin's IndexedDB as persistent so it won't be
 * evicted automatically after long periods of inactivity or disk pressure.
 */
export async function requestPersistentStorage(): Promise<StoragePersistenceStatus> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return { supported: false, persisted: false };
  }
  try {
    const already = navigator.storage.persisted
      ? await navigator.storage.persisted()
      : false;
    if (already) return { supported: true, persisted: true };
    const granted = await navigator.storage.persist();
    return { supported: true, persisted: granted };
  } catch {
    return { supported: false, persisted: false };
  }
}

/**
 * Mirror a full backup snapshot into `localStorage` as a secondary recovery
 * layer if IndexedDB is evicted by the browser. Silently ignores quota errors.
 */
export async function saveLocalSnapshot(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const business = await getBusiness();
    if (!business?.name?.trim()) return;
    const json = await serializeBackup();
    try {
      window.localStorage.setItem(AUTO_SNAPSHOT_KEY, json);
    } catch {
      // If full backup exceeds ~5MB localStorage quota, save a lightweight
      // core snapshot (business + settings + customers + products + presets)
      // without large invoice history so at least the setup never disappears.
      const [settings, customers, products, presets] = await Promise.all([
        db.settings.toArray(),
        db.customers.toArray(),
        db.products.toArray(),
        db.presets.toArray(),
      ]);
      const parsed = JSON.parse(json);
      parsed.data = {
        business: [business],
        settings,
        customers,
        products,
        presets,
        invoices: [],
        payments: [],
      };
      try {
        window.localStorage.setItem(AUTO_SNAPSHOT_KEY, JSON.stringify(parsed));
      } catch {
        // Ignore if even core snapshot exceeds quota.
      }
    }
  } catch {
    // Ignore snapshot errors; IndexedDB remains primary.
  }
}

/**
 * Clear the auto-snapshot (called when the user intentionally clears all data).
 */
export function clearLocalSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTO_SNAPSHOT_KEY);
  } catch {
    // Ignore storage access errors.
  }
}

/**
 * If IndexedDB has no configured business (e.g. after browser storage eviction),
 * attempt to restore automatically from the localStorage mirror.
 * Returns `true` if data was restored.
 */
export async function restoreLocalSnapshotIfNeeded(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const existing = await getBusiness();
    if (existing?.name?.trim()) return false;

    const raw = window.localStorage.getItem(AUTO_SNAPSHOT_KEY);
    if (!raw) return false;

    const parsed = parseBackup(raw);
    if (!parsed.data.business?.length) return false;

    await importBackup(parsed, "replace");
    return true;
  } catch {
    return false;
  }
}
