import { db } from "./database";
import {
  BACKUP_TABLES,
  BACKUP_APP_ID,
  BACKUP_FORMAT_VERSION,
  planBackupWrite,
  type BackupFile,
} from "@/lib/backup";

export interface ImportResult {
  tables: number;
  records: number;
}

/** Read every table into a serialized backup payload. */
export async function serializeBackup(): Promise<string> {
  const data: BackupFile["data"] = {};
  await db.transaction("r", db.tables, async () => {
    for (const table of BACKUP_TABLES) {
      data[table] = await db.table(table).toArray();
    }
  });
  const payload: BackupFile = {
    app: BACKUP_APP_ID,
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Write a validated backup into the database.
 * "replace" wipes every table first, then restores the backed-up records.
 * "merge" keeps current data and upserts backed-up records by id.
 */
export async function importBackup(
  file: BackupFile,
  mode: "replace" | "merge"
): Promise<ImportResult> {
  const plans = planBackupWrite(file, mode);

  await db.transaction("rw", db.tables, async () => {
    if (mode === "replace") {
      await Promise.all(BACKUP_TABLES.map((table) => db.table(table).clear()));
    }
    for (const plan of plans) {
      if (plan.records.length === 0) continue;
      await db.table(plan.name).bulkPut(plan.records as never[]);
    }
  });

  return {
    tables: plans.filter((plan) => plan.records.length > 0).length,
    records: plans.reduce((sum, plan) => sum + plan.records.length, 0),
  };
}