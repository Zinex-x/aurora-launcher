import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings2,
  Cpu,
  User,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useLauncher } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

type Category = "general" | "memory";

export function InstanceSettingsModal() {
  const { isInstanceSettingsOpen, setInstanceSettingsOpen, view, instances } = useLauncher();
  const { t } = useT();
  const [activeCategory, setActiveCategory] = useState<Category>("general");

  const instId = view.kind === "instance" ? view.id : null;
  const inst = instances.find((i) => i.id === instId);

  if (!isInstanceSettingsOpen || !inst) return null;

  const categories: { id: Category; label: string; icon: LucideIcon }[] = [
    { id: "general", label: t("general"), icon: User },
    { id: "memory", label: t("memory"), icon: Cpu },
  ];

  const handleRamChange = (val: number[]) => {
    // Round to multiples of 128MB
    const rounded = Math.round(val[0] / 128) * 128;
    // In a real app, this would update the instance.json on disk via IPC
    console.log("RAM Update:", rounded);
    inst.maxRam = `${rounded}M`;
  };

  const currentRamValue = parseInt(inst.maxRam || "4096") || 4096;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
      onClick={() => setInstanceSettingsOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[500px] w-[800px] overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl"
      >
        {/* Sidebar */}
        <div className="flex w-56 flex-col border-r border-white/5 bg-black/20 p-6">
          <div className="mb-8 flex items-center gap-2 px-2 text-xl font-bold tracking-tight">
            <Settings2 className="size-6 text-primary" />
            {t("instanceSettings")}
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
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 overflow-y-auto p-10 scrollbar-none">
          <button
            onClick={() => setInstanceSettingsOpen(false)}
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

              {activeCategory === "general" && (
                <div className="space-y-6">
                  <section>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("instanceName")}
                    </h3>
                    <input
                      type="text"
                      defaultValue={inst.name}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </section>
                </div>
              )}

              {activeCategory === "memory" && (
                <div className="space-y-10">
                  <section>
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("allocatedMemory")}
                      </h3>
                      <span className="text-2xl font-bold text-primary">
                        {currentRamValue} MB
                      </span>
                    </div>
                    <Slider
                      defaultValue={[currentRamValue]}
                      max={16384}
                      min={1024}
                      step={128}
                      onValueChange={handleRamChange}
                      className="py-4"
                    />
                    <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                      <span>1 GB</span>
                      <span>16 GB</span>
                    </div>
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
