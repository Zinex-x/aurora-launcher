import { Minus, Square, X, Copy } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.electron) return;

    // Check initial state
    window.electron.isMaximized().then(setIsMaximized);

    // Listen for changes
    const unsubscribe = window.electron.onMaximized(setIsMaximized);
    return () => unsubscribe();
  }, []);

  const onMinimize = () => window.electron?.minimize();
  const onMaximize = () => window.electron?.maximize();
  const onClose = () => window.electron?.close();

  return (
    <div
      className="flex h-12 w-full select-none items-center justify-between border-b border-white/5 bg-[#0a0a0a] px-4"
      style={{ "-webkit-app-region": "drag" } as CSSProperties}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
            <div className="size-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
            Electron Launcher
          </span>
        </div>
      </div>

      <div
        className="flex items-center"
        style={{ "-webkit-app-region": "no-drag" } as CSSProperties}
      >
        <button
          onClick={onMinimize}
          className="group flex h-12 w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <Minus className="size-4" />
        </button>
        <button
          onClick={onMaximize}
          className="group flex h-12 w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          {isMaximized ? <Copy className="size-3.5 rotate-180" /> : <Square className="size-3.5" />}
        </button>
        <button
          onClick={onClose}
          className="group flex h-12 w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-red-500/80 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
