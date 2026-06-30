import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useT } from "@/context/LanguageProvider";

const stages: Array<{ at: number; key: "downloading" | "installing" | "finalizing" }> = [
  { at: 0, key: "downloading" },
  { at: 55, key: "installing" },
  { at: 85, key: "finalizing" },
];

export function ProgressInstall({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const total = 2600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / total) * 100);
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 350);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  const stage = [...stages].reverse().find((s) => pct >= s.at)!.key;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{t(stage)}</span>
        <span className="tabular-nums text-muted-foreground">{Math.floor(pct)}%</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-[var(--grass-glow)]"
          style={{ width: `${pct}%` }}
          transition={{ ease: "linear" }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "inset 0 0 12px rgba(255,255,255,.05)" }}
        />
      </div>
    </div>
  );
}
