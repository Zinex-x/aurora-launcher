import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLauncher, type Modloader } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";
import { ModloaderBadge } from "../ModloaderBadge";
import { ProgressInstall } from "../ProgressInstall";

export function CreateInstanceView() {
  const { t } = useT();
  const { addInstance, setView, user, setAuthModalOpen } = useLauncher();
  const [name, setName] = useState("");
  const [allVersions, setAllVersions] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [version, setVersion] = useState("");
  const [loader, setLoader] = useState<Modloader>("vanilla");
  const [phase, setPhase] = useState<"form" | "progress" | "success">("form");
  const [error, setError] = useState("");

  const { downloadInstance } = useLauncher();

  useEffect(() => {
    if (window.electron) {
      window.electron.getVanillaVersions().then((res: any) => {
        setAllVersions(res.versions);
        if (res.versions.length > 0) {
          setVersion(res.versions[0].id);
        }
      });
    }
  }, []);

  const filteredVersions = useMemo(() => {
    if (showAll) return allVersions;
    return allVersions.filter(v => v.type === "release");
  }, [allVersions, showAll]);

  const submit = async () => {
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    let activeLoader = loader;
    if (loader === "fabric") {
      const isCompatible = await window.electron.checkFabricCompatibility(version);
      if (!isCompatible) {
        toast.warning(t("fabricUnavailable"), {
          icon: <AlertCircle className="text-orange-400" />
        });
        activeLoader = "vanilla";
      }
    }

    setError("");
    setPhase("progress");
    // Updated to pass loader to downloadInstance if needed
    // In our implementation, downloadVersion in main.cjs takes loader info
    // But LauncherProvider.tsx downloadInstance currently only takes (name, version)
    // We should fix that.
    downloadInstance(name.trim(), version, activeLoader);
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("minecraftVersion")}
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={showAll}
                      onChange={(e) => setShowAll(e.target.checked)}
                      className="size-3.5 rounded border-white/10 bg-white/5 accent-primary"
                    />
                    {t("showAllVersions")}
                  </label>
                </div>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none focus:border-primary/50 focus:bg-white/10 transition-all appearance-none"
                >
                  {filteredVersions.map((v) => (
                    <option key={v.id} value={v.id} className="bg-background">
                      {v.id} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("modloader")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["vanilla", /* "forge", */ "fabric"] as const).map((m) => (
                    <ModloaderBadge
                      key={m}
                      loader={m}
                      active={loader === m}
                      onClick={() => setLoader(m)}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={submit}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground glow-grass transition-transform",
                  !user ? "opacity-50 grayscale cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
                )}
              >
                <Sparkles className="size-4" />
                {t("createBtn")}
              </button>
            </motion.div>
          )}

          {phase === "progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 py-6"
            >
              <h2 className="font-display text-xl font-semibold text-center">{t("creating")}</h2>
              <ProgressInstall instanceName={name.trim()} versionId={version} onDone={onDone} />
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
