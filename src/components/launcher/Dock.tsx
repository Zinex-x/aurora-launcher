import { Home, Library, Plus, Settings } from "lucide-react";
import { useLauncher, type Instance } from "@/context/LauncherProvider";
import { cn } from "@/lib/utils";
import { useT } from "@/context/LanguageProvider";

export function Dock() {
  const { t } = useT();
  const { view, setView, instances, setSettingsOpen } = useLauncher();

  // Get last played instance
  const lastPlayed = instances
    .filter((i) => i.lastPlayed !== null)
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))[0];

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-full p-2 border border-white/10 shadow-lg">
        {/* Left Zone */}
        <div className="flex items-center gap-1">
          <DockButton
            active={view.kind === "home"}
            onClick={() => setView({ kind: "home" })}
            icon={<Home className="size-5" />}
            title={t("home")}
          />
          <DockButton
            active={view.kind === "library"}
            onClick={() => setView({ kind: "library" })}
            icon={<Library className="size-5" />}
            title={t("library")}
          />
          <DockButton
            active={false}
            onClick={() => setSettingsOpen(true)}
            icon={<Settings className="size-5" />}
            title={t("settings")}
          />
        </div>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-white/20 mx-2" />

        {/* Right Zone */}
        <div className="flex items-center gap-1">
          <DockButton
            active={view.kind === "create"}
            onClick={() => setView({ kind: "create" })}
            icon={<Plus className="size-5" />}
            title={t("createInstance")}
          />
          {lastPlayed && (
            <button
              onClick={() => setView({ kind: "instance", id: lastPlayed.id })}
              title={lastPlayed.name}
              className={cn(
                "group relative flex size-10 items-center justify-center rounded-full transition-all overflow-hidden",
                view.kind === "instance" && view.id === lastPlayed.id
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "hover:scale-105",
              )}
            >
              <div
                className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs uppercase"
                style={{
                  background: `linear-gradient(135deg, oklch(0.7 0.2 ${lastPlayed.iconHue}), oklch(0.5 0.2 ${lastPlayed.iconHue + 40}))`,
                }}
              >
                {lastPlayed.name.charAt(0)}
              </div>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function DockButton({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition-all",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_8px_24px_-8px_oklch(from_var(--primary)_l_c_h_/_0.6)]"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 hover:shadow-[0_4px_12px_-4px_oklch(from_var(--primary)_l_c_h_/_0.3)]",
      )}
    >
      {icon}
    </button>
  );
}
