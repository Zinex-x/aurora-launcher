import { cn } from "@/lib/utils";
import type { Modloader } from "@/context/LauncherProvider";

const styles: Record<Modloader, string> = {
  vanilla: "bg-stone-500/15 text-stone-200 border-stone-300/25 light:text-stone-700",
  forge: "bg-amber-500/15 text-amber-200 border-amber-300/30 light:text-amber-800",
  fabric: "bg-violet-500/15 text-violet-200 border-violet-300/30 light:text-violet-800",
};

const labels: Record<Modloader, string> = {
  vanilla: "Vanilla",
  forge: "Forge",
  fabric: "Fabric",
};

export function ModloaderBadge({
  loader,
  active,
  onClick,
  className,
}: {
  loader: Modloader;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Cmp = onClick ? "button" : "span";
  return (
    <Cmp
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium uppercase tracking-wider backdrop-blur-md transition-all",
        styles[loader],
        onClick && "cursor-pointer hover:scale-105",
        active && "ring-2 ring-primary/60 ring-offset-2 ring-offset-transparent scale-105",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {labels[loader]}
    </Cmp>
  );
}
