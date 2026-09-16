import { describe, expect, it } from "vitest";
import {
  BACKUP_APP_ID,
  BACKUP_FORMAT_VERSION,
  parseBackup,
  planBackupWrite,
  summarizeBackup,
  type BackupFile,
} from "@/lib/backup";

function makeBackup(
  overrides: Partial<BackupFile> = {}
): Record<string, unknown> {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_FORMAT_VERSION,
    exportedAt: "2026-09-16T10:00:00.000Z",
    data: {
      customers: [
        { id: "cus-1", name: "Aarav", createdAt: 1, updatedAt: 1 },
      ],
      invoices: [
        { id: "inv-1", invoiceNumber: "INV-1", total: 100 },
      ],
    },
    ...overrides,
  };
}

describe("parseBackup", () => {
  it("accepts a well-formed backup", () => {
    const file = parseBackup(JSON.stringify(makeBackup()));
    expect(file.app).toBe(BACKUP_APP_ID);
    expect(file.data.customers).toHaveLength(1);
    expect(file.data.invoices).toHaveLength(1);
  });

  it("rejects text that isn't JSON", () => {
    expect(() => parseBackup("not json")).toThrow(/isn't valid JSON/i);
  });

  it("rejects a backup from another app", () => {
    const payload = makeBackup({ app: "some-other-app" });
    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      /wasn't created by Invoicer by Swaniki/
    );
  });

  it("rejects a backup with no export date", () => {
    const payload = makeBackup({ exportedAt: undefined as unknown as string });
    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      /missing its export date/
    );
  });

  it("rejects a backup with no data section", () => {
    const payload = makeBackup({ data: undefined as unknown as Record<string, never> });
    expect(() => parseBackup(JSON.stringify(payload))).toThrow(/no data inside/i);
  });

  it("rejects a corrupt table section", () => {
    const payload = makeBackup({ data: { customers: "oops" } as never });
    expect(() => parseBackup(JSON.stringify(payload))).toThrow(/customers.*corrupt/i);
  });

  it("rejects a table containing non-record entries", () => {
    const payload = makeBackup({
      data: { customers: [{ id: "ok" }, 42] } as never,
    });
    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      /invalid entries/i
    );
  });

  it("rejects a backup with no recognized tables", () => {
    const payload = makeBackup({ data: { other: [] } as never });
    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      /doesn't contain any recognized data/
    );
  });
});

describe("summarizeBackup", () => {
  it("counts records per table and total", () => {
    const file = parseBackup(JSON.stringify(makeBackup()));
    const summary = summarizeBackup(file);
    expect(summary.records).toBe(2);
    expect(summary.overview).toEqual([
      { label: "Customers", count: 1 },
      { label: "Invoices", count: 1 },
    ]);
  });

  it("drops empty tables from the overview", () => {
    const payload = makeBackup({
      data: { customers: [], invoices: [{ id: "inv-1" }] } as never,
    });
    const summary = summarizeBackup(parseBackup(JSON.stringify(payload)));
    expect(summary.overview).toEqual([{ label: "Invoices", count: 1 }]);
  });
});

describe("planBackupWrite", () => {
  it("returns the backed-up records for replace and merge", () => {
    const file = parseBackup(JSON.stringify(makeBackup()));
    const replacePlan = planBackupWrite(file, "replace");
    const mergePlan = planBackupWrite(file, "merge");
    expect(replacePlan.map((p) => p.name)).toEqual(["customers", "invoices"]);
    expect(replacePlan[0].records).toHaveLength(1);
    expect(mergePlan).toEqual(replacePlan);
  });

  it("includes tables that are present but empty, and skips absent ones", () => {
    const file = parseBackup(
      JSON.stringify(makeBackup({ data: { invoices: [] } as never }))
    );
    const plan = planBackupWrite(file, "replace");
    expect(plan).toEqual([{ name: "invoices", records: [] }]);
  });
});