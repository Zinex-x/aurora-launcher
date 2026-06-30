import { motion } from "framer-motion";
import { Play, Package, Settings as SettingsIcon, User } from "lucide-react";
import { useState } from "react";
import { useLauncher } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";
import { ModloaderBadge } from "../ModloaderBadge";
import { cn } from "@/lib/utils";

export function InstanceDetailView({ id }: { id: string }) {
  const { instances, touchInstance } = useLauncher();
  const { t, lang } = useT();
  const inst = instances.find((i) => i.id === id);
  const [tab, setTab] = useState<"mods" | "settings" | "skin">("mods");

  if (!inst) return null;

  const tabs = [
    { id: "mods" as const, label: t("mods"), icon: Package },
    { id: "settings" as const, label: t("instanceSettings"), icon: SettingsIcon },
    { id: "skin" as const, label: t("skin"), icon: User },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-panel-strong rounded-3xl overflow-hidden">
        <div
          className="relative h-44 w-full"
          style={{
            background: `linear-gradient(135deg, oklch(0.45 0.18 ${inst.iconHue}), oklch(0.28 0.15 ${(inst.iconHue + 60) % 360}))`,
          }}
        >
          <div className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.5), transparent 60%)" }}
          />
        </div>
        <div className="-mt-16 p-7 relative">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div
                className="size-24 rounded-2xl border-2 border-white/20 shadow-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, oklch(0.6 0.2 ${inst.iconHue}), oklch(0.4 0.18 ${(inst.iconHue + 40) % 360}))`,
                }}
              >
                <span className="font-display text-4xl font-bold text-white drop-shadow">
                  {inst.name.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div className="pb-1">
                <h2 className="font-display text-3xl font-bold">{inst.name}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <ModloaderBadge loader={inst.modloader} />
                  <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                    MC {inst.version}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => touchInstance(inst.id)}
              className="flex items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-5 font-display text-2xl font-bold tracking-widest text-primary-foreground glow-grass"
            >
              <Play className="size-7 fill-current" />
              {t("play")}
            </motion.button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:max-w-md">
            <Stat label={t("version")} value={inst.version} />
            <Stat
              label={t("lastPlayed")}
              value={inst.lastPlayed ? new Date(inst.lastPlayed).toLocaleString(lang === "ru" ? "ru-RU" : "en-US") : t("never")}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-2">
        <div className="flex gap-1">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                tab === tb.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tb.icon className="size-4" />
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground">
        {t("comingSoon")}
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  );
}
