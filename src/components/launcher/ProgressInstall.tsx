import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useT } from "@/context/LanguageProvider";

import { useLauncher } from "@/context/LauncherProvider";
import { type StringKey } from "@/i18n/strings";
import { AlertCircle, RefreshCw } from "lucide-react";

export function ProgressInstall({
  instanceName,
  versionId,
  onDone,
}: {
  instanceName: string;
  versionId: string;
  onDone: () => void;
}) {
  const { t } = useT();
  const { downloads, downloadInstance } = useLauncher();

  const download = downloads[instanceName];

  useEffect(() => {
    if (download?.status === "ready") {
      setTimeout(onDone, 500);
    }
  }, [download?.status, onDone]);

  if (!download) {
    return null;
  }

  const labelKey = download.currentTaskLabel as StringKey;
  const pct = download.overallPercent;

  if (download.status === "error") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">{t("error")}</p>
            <p className="text-xs text-destructive/80 leading-relaxed">{download.error}</p>
          </div>
        </div>
        <button
          onClick={() => downloadInstance(instanceName, versionId)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="size-4" />
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{t(labelKey) || download.currentTaskLabel}</span>
        <span className="tabular-nums text-muted-foreground">{Math.floor(pct)}%</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-[var(--grass-glow)]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "inset 0 0 12px rgba(255,255,255,.05)" }}
        />
      </div>
    </div>
  );
}
