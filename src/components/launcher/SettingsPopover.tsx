import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import { useT } from "@/context/LanguageProvider";
import { cn } from "@/lib/utils";

export function SettingsPopover({
  side = "right",
  className,
}: {
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useT();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex size-10 items-center justify-center rounded-full transition-colors",
            className,
          )}
          aria-label={t("settings")}
        >
          <Settings className="size-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align="center"
        sideOffset={12}
        className="w-64 glass-panel-strong rounded-2xl border-0 p-4"
      >
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("theme")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ThemeBtn active={theme === "dark"} onClick={() => setTheme("dark")} icon={<Moon className="size-4" />} label={t("dark")} />
              <ThemeBtn active={theme === "light"} onClick={() => setTheme("light")} icon={<Sun className="size-4" />} label={t("light")} />
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("language")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <LangBtn active={lang === "ru"} onClick={() => setLang("ru")} label="RU" />
              <LangBtn active={lang === "en"} onClick={() => setLang("en")} label="EN" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ThemeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
        active ? "border-primary/50 bg-primary/15 text-foreground" : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
      )}
    >
      {icon} {label}
    </button>
  );
}

function LangBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-semibold tracking-wider transition-all",
        active ? "border-primary/50 bg-primary/15 text-foreground" : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
