import { Home, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useLauncher } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";
import { SettingsPopover } from "./SettingsPopover";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { view, setView, instances } = useLauncher();
  const { t } = useT();

  const isHome = view.kind === "home";
  const isCreate = view.kind === "create";

  return (
    <aside className="glass-panel flex h-full w-24 flex-col items-center gap-3 rounded-2xl p-3">
      <SidebarBtn
        title={t("home")}
        active={isHome}
        onClick={() => setView({ kind: "home" })}
      >
        <Home className="size-5" />
      </SidebarBtn>

      <div className="my-1 h-px w-8 bg-white/10" />

      <div className="flex-1 w-full overflow-y-auto scrollbar-none">
        <div className="flex flex-col items-center gap-2.5">
          {instances.map((inst) => {
            const active = view.kind === "instance" && view.id === inst.id;
            return (
              <motion.button
                key={inst.id}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setView({ kind: "instance", id: inst.id })}
                title={inst.name}
                className={cn(
                  "relative size-14 overflow-hidden rounded-xl border transition-all",
                  active ? "border-primary/60 ring-2 ring-primary/40" : "border-white/10 hover:border-white/30",
                )}
                style={{
                  background: `linear-gradient(135deg, oklch(0.55 0.18 ${inst.iconHue}), oklch(0.35 0.15 ${(inst.iconHue + 40) % 360}))`,
                }}
              >
                <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold text-white drop-shadow">
                  {inst.name.slice(0, 1).toUpperCase()}
                </span>
                {active && (
                  <span className="absolute -left-3 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <SidebarBtn
          title={t("createInstance")}
          active={isCreate}
          onClick={() => setView({ kind: "create" })}
          accent
        >
          <Plus className="size-5" />
        </SidebarBtn>
        <SettingsPopover />
      </div>
    </aside>
  );
}

function SidebarBtn({
  children,
  title,
  active,
  accent,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex size-12 items-center justify-center rounded-xl border transition-all",
        active
          ? "border-primary/60 bg-primary/15 text-foreground"
          : accent
            ? "border-primary/30 bg-primary/10 text-foreground hover:bg-primary/20"
            : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}
