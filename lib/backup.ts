import { DataError } from "@/lib/db/database";

export const BACKUP_APP_ID = "invoicer-by-swaniki";
export const BACKUP_FORMAT_VERSION = "1";

export const BACKUP_TABLES = [
  "business",
  "settings",
  "customers",
  "products",
  "invoices",
  "payments",
  "presets",
] as const;

export type BackupTableName = (typeof BACKUP_TABLES)[number];

export interface BackupFile {
  app: string;
  version: string;
  exportedAt: string;
  data: Partial<Record<BackupTableName, unknown[]>>;
}

export interface BackupSummary {
  exportedAt: string;
  records: number;
  overview: Array<{ label: string; count: number }>;
}

const MAX_RECORDS_PER_TABLE = 1_000_000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Parse and validate a backup file. Throws a friendly DataError when the file
 * isn't ours, isn't JSON, or contains corrupt sections — nothing is written.
 */
export function parseBackup(json: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new DataError("That file isn't valid JSON. Make sure you picked the backup file you exported.");
  }

  if (!isPlainObject(raw)) {
    throw new DataError("That backup file is empty or malformed.");
  }
  const root = raw as Record<string, unknown>;

  if (root.app !== BACKUP_APP_ID) {
    throw new DataError("That file wasn't created by Invoicer by Swaniki.");
  }
  if (typeof root.version !== "string") {
    throw new DataError("That backup file is missing its version.");
  }
  if (typeof root.exportedAt !== "string") {
    throw new DataError("That backup file is missing its export date.");
  }
  if (!isPlainObject(root.data)) {
    throw new DataError("That backup file has no data inside.");
  }

  const data = root.data as Record<string, unknown>;
  const out: BackupFile = {
    app: BACKUP_APP_ID,
    version: root.version,
    exportedAt: root.exportedAt,
    data: {},
  };

  let found = 0;
  for (const table of BACKUP_TABLES) {
    const value = data[table];
    if (value === undefined) continue;
    found += 1;
    if (!Array.isArray(value)) {
      throw new DataError(`The “${table}” section of this backup is corrupt.`);
    }
    if (value.length > MAX_RECORDS_PER_TABLE) {
      throw new DataError(`The “${table}” section of this backup is too large.`);
    }
    for (const record of value) {
      if (!isPlainObject(record)) {
        throw new DataError(`The “${table}” section of this backup contains invalid entries.`);
      }
    }
    out.data[table] = value as unknown[];
  }

  if (found === 0) {
    throw new DataError("That backup doesn't contain any recognized data.");
  }
  return out;
}

const TABLE_LABELS: Record<BackupTableName, string> = {
  business: "Business",
  settings: "Settings",
  customers: "Customers",
  products: "Products",
  invoices: "Invoices",
  payments: "Payments",
  presets: "Presets",
};

/** Human-friendly counts used for the import confirmation screen. */
export function summarizeBackup(file: BackupFile): BackupSummary {
  const overview: BackupSummary["overview"] = [];
  let records = 0;
  for (const table of BACKUP_TABLES) {
    const count = file.data[table]?.length ?? 0;
    if (count <= 0) continue;
    records += count;
    overview.push({ label: TABLE_LABELS[table], count });
  }
  return { exportedAt: file.exportedAt, records, overview };
}

/**
 * Decide which records get written for an import. "replace" wipes every table
 * first (caller clears the store, then writes these); "merge" keeps everything
 * and simply upserts the backed-up records by their ids.
 */
export function planBackupWrite(
  file: BackupFile,
  mode: "replace" | "merge"
): Array<{ name: BackupTableName; records: unknown[] }> {
  if (mode !== "replace" && mode !== "merge") {
    throw new DataError("Unknown import mode.");
  }
  const plans: Array<{ name: BackupTableName; records: unknown[] }> = [];
  for (const table of BACKUP_TABLES) {
    const records = file.data[table];
    if (records === undefined) continue;
    plans.push({ name: table, records });
  }
  return plans;
}

/** Prompt a download of a serialized backup from the browser. */
export function downloadBackupFile(json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `invoicer-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}