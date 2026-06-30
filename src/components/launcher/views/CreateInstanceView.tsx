import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useLauncher, type Modloader } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";
import { ModloaderBadge } from "../ModloaderBadge";
import { ProgressInstall } from "../ProgressInstall";

const VERSIONS = ["1.21.1", "1.20.6", "1.20.1", "1.19.4", "1.18.2", "1.16.5", "1.12.2"];

export function CreateInstanceView() {
  const { t } = useT();
  const { addInstance, setView } = useLauncher();
  const [name, setName] = useState("");
  const [version, setVersion] = useState(VERSIONS[0]);
  const [loader, setLoader] = useState<Modloader>("vanilla");
  const [phase, setPhase] = useState<"form" | "progress" | "success">("form");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) { setError(t("nameRequired")); return; }
    setError("");
    setPhase("progress");
  };

  const onDone = () => {
    const inst = addInstance({ name: name.trim(), version, modloader: loader });
    setPhase("success");
    setTimeout(() => setView({ kind: "instance", id: inst.id }), 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl"
    >
      <div className="glass-panel-strong rounded-3xl p-8">
        <AnimatePresence mode="wait">
          {phase === "form" && (
            <motion.div key="form" exit={{ opacity: 0 }} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold">{t("createInstance")}</h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("instanceName")}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("instanceNamePlaceholder")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("minecraftVersion")}
                </label>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none focus:border-primary/50 focus:bg-white/10 transition-all appearance-none"
                >
                  {VERSIONS.map((v) => (
                    <option key={v} value={v} className="bg-background">{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("modloader")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["vanilla", "forge", "fabric"] as const).map((m) => (
                    <ModloaderBadge key={m} loader={m} active={loader === m} onClick={() => setLoader(m)} />
                  ))}
                </div>
              </div>

              <button
                onClick={submit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground glow-grass transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles className="size-4" />
                {t("createBtn")}
              </button>
            </motion.div>
          )}

          {phase === "progress" && (
            <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 py-6">
              <h2 className="font-display text-xl font-semibold text-center">{t("creating")}</h2>
              <ProgressInstall onDone={onDone} />
            </motion.div>
          )}

          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/20 border border-primary/50">
                <Check className="size-8 text-primary" />
              </div>
              <div className="font-display text-xl font-semibold">{t("successCreated")}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
