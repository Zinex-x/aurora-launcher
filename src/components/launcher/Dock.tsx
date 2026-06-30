import { Home, Library, Plus, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useLauncher } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";
import { SettingsPopover } from "./SettingsPopover";
import { cn } from "@/lib/utils";

export function Dock() {
  const { view, setView, instances } = useLauncher();
  const { t } = useT();

  const isHome = view.kind === "home";
  const isLibrary = view.kind === "library";
  const isCreate = view.kind === "create";

  const lastPlayedInstance = [...instances]
    .filter((i) => i.lastPlayed !== null)
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))[0];

  return (
    <div className="fixed bottom-0 inset-x-0 pb-4 flex justify-center z-40 pointer-events-none">
      <div className="glass rounded-full p-2 flex items-center gap-1 pointer-events-auto shadow-2xl">
        {/* Left Zone */}
        <div className="flex items-center gap-1">
          <DockBtn
            title={t("home")}
            active={isHome}
            onClick={() => setView({ kind: "home" })}
          >
            <Home className="size-5" />
          </DockBtn>
          <DockBtn
            title={t("library")}
            active={isLibrary}
            onClick={() => setView({ kind: "library" })}
          >
            <Library className="size-5" />
          </DockBtn>
          <SettingsPopover
            side="top"
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/10"
          />
        </div>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-white/20 mx-2" />

        {/* Right Zone */}
        <div className="flex items-center gap-1">
          <DockBtn
            title={t("createInstance")}
            active={isCreate}
            onClick={() => setView({ kind: "create" })}
          >
            <Plus className="size-5" />
          </DockBtn>

          {lastPlayedInstance && (
            <motion.button
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView({ kind: "instance", id: lastPlayedInstance.id })}
              title={lastPlayedInstance.name}
              className={cn(
                "relative size-10 overflow-hidden rounded-full border transition-all",
                view.kind === "instance" && view.id === lastPlayedInstance.id
                  ? "border-primary ring-2 ring-primary/40 shadow-[0_8px_24px_-8px_oklch(from_var(--primary)_l_c_h_/_0.6)]"
                  : "border-white/10 hover:border-white/30",
              )}
              style={{
                background: `linear-gradient(135deg, oklch(0.55 0.18 ${lastPlayedInstance.iconHue}), oklch(0.35 0.15 ${(lastPlayedInstance.iconHue + 40) % 360}))`,
              }}
            >
              <span className="flex items-center justify-center h-full w-full font-display text-sm font-bold text-white drop-shadow">
                {lastPlayedInstance.name.slice(0, 1).toUpperCase()}
              </span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

function DockBtn({
  children,
  title,
  active,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={title}
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition-all",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_8px_24px_-8px_oklch(from_var(--primary)_l_c_h_/_0.6)]"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/10",
      )}
    >
      {children}
    </motion.button>
  );
}
