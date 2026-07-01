import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useLauncher } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";
import { InstanceCard } from "../InstanceCard";

export function HomeView() {
  const { instances, setView, launchInstance, user, setSettingsOpen } = useLauncher();
  const { t } = useT();

  const recent = [...instances]
    .sort((a, b) => (b.lastPlayed ?? b.createdAt) - (a.lastPlayed ?? a.createdAt))
    .slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <section className="space-y-3">
        <h2 className="font-display text-4xl font-bold tracking-tight">{t("welcome")}</h2>
        <p className="text-muted-foreground max-w-xl">{t("welcomeSubtitle")}</p>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold">{t("recentInstances")}</h3>

        {recent.length === 0 ? (
          <button
            onClick={() => setView({ kind: "create" })}
            className="glass-panel flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-12 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="size-5" />
            {t("noInstances")}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recent.map((inst) => (
              <InstanceCard
                key={inst.id}
                instance={inst}
                onClick={() => setView({ kind: "instance", id: inst.id })}
                onPlay={() => {
                  if (!user) {
                    setSettingsOpen(true); // Open settings which has AuthZone
                    return;
                  }
                  launchInstance(inst.id);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
