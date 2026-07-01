import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Palette,
  Languages,
  ShieldCheck,
  Coffee,
  Settings2,
  Box,
  Check,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useLauncher } from "@/context/LauncherProvider";
import { useTheme, type AccentColor } from "@/context/ThemeProvider";
import { useT } from "@/context/LanguageProvider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Category = "appearance" | "language" | "privacy" | "java" | "defaults" | "resources";

export function SettingsModal() {
  const { isSettingsOpen, setSettingsOpen } = useLauncher();
  const { t, lang, setLang } = useT();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const [activeCategory, setActiveCategory] = useState<Category>("appearance");

  if (!isSettingsOpen) return null;

  const categories: { id: Category; label: string; icon: LucideIcon; beta?: boolean }[] = [
    { id: "appearance", label: t("appearance"), icon: Palette },
    { id: "language", label: t("language"), icon: Languages, beta: true },
    { id: "privacy", label: t("privacy"), icon: ShieldCheck },
    { id: "java", label: t("javaInstallations"), icon: Coffee },
    { id: "defaults", label: t("defaultInstanceOptions"), icon: Settings2 },
    { id: "resources", label: t("resourceManagement"), icon: Box },
  ];

  const accents: { id: AccentColor; color: string; label: string }[] = [
    { id: "cyan", color: "#22d3ee", label: t("cyan") },
    { id: "green", color: "#22c55e", label: t("green") },
    { id: "purple", color: "#a855f7", label: t("purple") },
    { id: "red", color: "#ef4444", label: t("red") },
    { id: "orange", color: "#f97316", label: t("orange") },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
      onClick={() => setSettingsOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[600px] w-[900px] overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl"
      >
        {/* Sidebar */}
        <div className="flex w-64 flex-col border-r border-white/5 bg-black/20 p-6">
          <div className="mb-8 flex items-center gap-2 px-2 text-xl font-bold tracking-tight">
            <Settings2 className="size-6 text-primary" />
            {t("settings")}
          </div>

          <nav className="flex-1 space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  activeCategory === cat.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                <cat.icon className="size-4" />
                <span className="flex-1 text-left">{cat.label}</span>
                {cat.beta && (
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border-0"
                  >
                    Beta
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto px-2 pt-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
            Electron Launcher (Aurora) — alpha 0.1.0
          </div>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 overflow-y-auto p-10 scrollbar-none">
          <button
            onClick={() => setSettingsOpen(false)}
            className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <X className="size-5" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="mb-8 text-2xl font-bold tracking-tight">
                {categories.find((c) => c.id === activeCategory)?.label}
              </h2>

              {activeCategory === "appearance" && (
                <div className="space-y-10">
                  <section>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("theme")}
                    </h3>
                    <div className="flex gap-4">
                      <ThemeCard
                        active={theme === "dark"}
                        onClick={() => setTheme("dark")}
                        icon={<Moon className="size-5" />}
                        label={t("dark")}
                      />
                      <ThemeCard
                        active={theme === "light"}
                        onClick={() => setTheme("light")}
                        icon={<Sun className="size-5" />}
                        label={t("light")}
                      />
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("accentColor")}
                    </h3>
                    <div className="grid grid-cols-5 gap-3">
                      {accents.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setAccentColor(acc.id)}
                          className={cn(
                            "group relative flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border transition-all",
                            accentColor === acc.id
                              ? "border-primary bg-primary/5 text-foreground shadow-lg"
                              : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground",
                          )}
                        >
                          <div
                            className="size-6 rounded-full shadow-inner"
                            style={{ backgroundColor: acc.color }}
                          />
                          <span className="text-xs font-medium">{acc.label}</span>
                          {accentColor === acc.id && (
                            <div className="absolute right-2 top-2">
                              <Check className="size-3 text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeCategory === "language" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <LangCard
                      active={lang === "ru"}
                      onClick={() => setLang("ru")}
                      label="Русский"
                      sub="Russian"
                    />
                    <LangCard
                      active={lang === "en"}
                      onClick={() => setLang("en")}
                      label="English"
                      sub="United States"
                    />
                  </div>
                </div>
              )}

              {activeCategory !== "appearance" && activeCategory !== "language" && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary/5 text-primary/40">
                    <Box className="size-8" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{t("comingSoon")}</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    {t("placeholderComingSoon")}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function ThemeCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center gap-3 rounded-2xl border p-4 transition-all",
        active
          ? "border-primary bg-primary/5 text-foreground shadow-lg shadow-primary/5"
          : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground",
      )}
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-xl transition-colors",
          active ? "bg-primary text-primary-foreground" : "bg-white/5",
        )}
      >
        {icon}
      </div>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function LangCard({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-2xl border p-5 transition-all",
        active
          ? "border-primary bg-primary/5 text-foreground shadow-lg shadow-primary/5"
          : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground",
      )}
    >
      <div className="text-left">
        <div className="font-bold">{label}</div>
        <div className="text-xs opacity-50">{sub}</div>
      </div>
      {active && <Check className="size-5 text-primary" />}
    </button>
  );
}
