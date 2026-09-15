"use client";

import { useState } from "react";
import { Download, Upload, AlertTriangle, FlaskConical, Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Button } from "@/components/common/button";
import { db } from "@/lib/db/database";
import { useToast } from "@/lib/providers";
import type { Business } from "@/lib/types";

const APP_VERSION = "0.1.0";

export function DataSection() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  async function exportBackup() {
    setExporting(true);
    try {
      const dump = await db.transaction("r", db.tables, async () => {
        const result: Record<string, unknown> = {};
        for (const table of db.tables) {
          result[table.name] = await table.toArray();
        }
        return result;
      });

      const payload = {
        app: "invoicer-by-swaniki",
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        data: dump,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `invoicer-backup-${stamp}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast("Backup exported to your device.", "success");
    } catch {
      showToast("Couldn't export the backup. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function loadDemoData() {
    try {
      await db.business.put({
        id: "default",
        name: "Swaniki Demo Studio",
        email: "hello@swaniki.example",
        phone: "+91 90000 00000",
        website: "swaniki.example",
        address: "Bengaluru, Karnataka",
        gstin: "29ABCDE1234F1Z5",
        upiId: "demo@swaniki",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as Business);
      showToast("Demo business loaded (Swaniki Demo Studio).", "success");
    } catch {
      showToast("Couldn't load demo data.", "error");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>
            Your data lives only on this device. Take a copy with you anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={exportBackup} disabled={exporting} className="flex-1">
              <Download className="h-4 w-4" aria-hidden="true" />
              {exporting ? "Exporting…" : "Export Backup"}
            </Button>
            <Button variant="secondary" disabled className="flex-1">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import Backup
            </Button>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Import and restore are coming in a later milestone.
          </p>
        </CardContent>
      </Card>

      {isDev && (
        <Card>
          <CardHeader>
            <CardTitle>Developer tools</CardTitle>
            <CardDescription>
              Visible in development builds only — never in production.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={loadDemoData}>
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              Load demo data
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-200 dark:border-red-900/60">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-400">
            Dangerous zone
          </CardTitle>
          <CardDescription>
            Clearing all data deletes every invoice, customer and setting on
            this device. Use with care.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Clear All Data
          </Button>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
            Available in a later milestone, with strong confirmation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}