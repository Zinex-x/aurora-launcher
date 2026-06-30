import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useLauncher, type Instance } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";
import { cn } from "@/lib/utils";

export function LibraryView() {
  const { instances, setView, touchInstance } = useLauncher();
  const { t } = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className="space-y-1">
        <h2 className="font-display text-4xl font-bold tracking-tight">
          {t("library")}
        </h2>
        <p className="text-muted-foreground">{t("librarySubtitle")}</p>
      </section>

      <div className="flex flex-col gap-2">
        {instances.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground">
            {t("noInstances")}
          </div>
        ) : (
          instances.map((inst) => (
            <InstanceRow
              key={inst.id}
              instance={inst}
              onClick={() => setView({ kind: "instance", id: inst.id })}
              onPlay={() => {
                touchInstance(inst.id);
                setView({ kind: "instance", id: inst.id });
              }}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

function InstanceRow({
  instance,
  onClick,
  onPlay,
}: {
  instance: Instance;
  onClick: () => void;
  onPlay: () => void;
}) {
  const hue = instance.iconHue;

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl">
        {/* Default Icon */}
        <div
          className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-white transition-opacity duration-300 group-hover:opacity-0"
          style={{
            background: `linear-gradient(135deg, oklch(0.55 0.18 ${hue}), oklch(0.35 0.15 ${(hue + 40) % 360}))`,
          }}
        >
          {instance.name.slice(0, 1).toUpperCase()}
        </div>

        {/* Hover Play Button */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-green-500 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
        >
          <Play className="size-6 fill-current translate-x-0.5" />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-start overflow-hidden">
        <span className="w-full truncate text-left font-semibold leading-tight">
          {instance.name}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {instance.modloader} {instance.version}
        </span>
      </div>
    </button>
  );
}
