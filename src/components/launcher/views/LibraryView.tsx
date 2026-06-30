import { Play } from "lucide-react";
import { useLauncher, type Instance } from "@/context/LauncherProvider";
import { cn } from "@/lib/utils";
import { useT } from "@/context/LanguageProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function LibraryView() {
  const { instances, setView, launchInstance } = useLauncher();
  const { t } = useT();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white">{t("library")}</h1>
        <p className="text-muted-foreground mt-1">{t("librarySubtitle")}</p>
      </div>

      <div className="grid gap-3">
        {instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl border border-white/5">
            <p className="text-muted-foreground">{t("noInstances")}</p>
          </div>
        ) : (
          instances.map((instance) => (
            <InstanceRow
              key={instance.id}
              instance={instance}
              onSelect={() => setView({ kind: "instance", id: instance.id })}
              onPlay={() => launchInstance(instance.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function InstanceRow({
  instance,
  onSelect,
  onPlay,
}: {
  instance: Instance;
  onSelect: () => void;
  onPlay: () => void;
}) {
  const { t } = useT();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      className="group relative flex items-center gap-4 p-3 glass hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer overflow-hidden"
    >
      <div className="relative size-12 shrink-0">
        <AnimatePresence mode="wait">
          {!isHovered ? (
            <motion.div
              key="icon"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center rounded-xl font-bold text-white uppercase text-lg shadow-lg"
              style={{
                background: `linear-gradient(135deg, oklch(0.7 0.2 ${instance.iconHue}), oklch(0.5 0.2 ${instance.iconHue + 40}))`,
              }}
            >
              {instance.name.charAt(0)}
            </motion.div>
          ) : (
            <motion.button
              key="play"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              title={t("play")}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_var(--grass-glow)] hover:scale-105 transition-transform"
            >
              <Play className="size-6 fill-current ml-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{instance.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-wider font-medium">
            {instance.modloader}
          </span>
          <span>{instance.version}</span>
        </div>
      </div>

      <div className="hidden sm:block px-4">
        <div className="text-xs text-muted-foreground text-right">
          {instance.lastPlayed ? new Date(instance.lastPlayed).toLocaleDateString() : t("never")}
        </div>
      </div>
    </div>
  );
}
