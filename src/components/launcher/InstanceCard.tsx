import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { Instance } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";

export function InstanceCard({
  instance,
  onClick,
  onPlay,
}: {
  instance: Instance;
  onClick: () => void;
  onPlay?: () => void;
}) {
  const { t } = useT();
  const hue = instance.iconHue;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl glass-panel text-left w-full"
    >
      <div
        className="aspect-square w-full relative"
        style={{
          background: `linear-gradient(135deg, oklch(0.55 0.18 ${hue}), oklch(0.35 0.15 ${(hue + 40) % 360}))`,
        }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,.6), transparent 50%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="text-white font-display font-semibold text-sm truncate drop-shadow-lg">
            {instance.name}
          </div>
          <div className="text-white/80 text-[11px] truncate">
            {instance.modloader} · {instance.version}
          </div>
        </div>
        {onPlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
              className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold glow-grass"
            >
              <Play className="size-4 fill-current" /> {t("quickPlay")}
            </button>
          </div>
        )}
      </div>
    </motion.button>
  );
}
