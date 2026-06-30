import { AnimatePresence, motion } from "framer-motion";
import { Dock } from "./Dock";
import { TopNavbar } from "./TopNavbar";
import { HomeView } from "./views/HomeView";
import { LibraryView } from "./views/LibraryView";
import { CreateInstanceView } from "./views/CreateInstanceView";
import { InstanceDetailView } from "./views/InstanceDetailView";
import { useLauncher } from "@/context/LauncherProvider";
import bgImg from "@/assets/launcher-bg.jpg";

export function LauncherShell() {
  const { view } = useLauncher();
  const viewKey = view.kind === "instance" ? `instance:${view.id}` : view.kind;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background image */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      {/* Gradient overlay (themed) */}
      <div className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 800px at 80% -10%, color-mix(in oklch, var(--primary) 18%, transparent), transparent 60%), linear-gradient(180deg, color-mix(in oklch, var(--background) 65%, transparent), color-mix(in oklch, var(--background) 88%, transparent))",
        }}
      />

      <div className="flex h-screen w-full flex-col gap-3 p-3 pb-28">
        <TopNavbar />
        <main className="glass-panel flex-1 overflow-y-auto rounded-2xl p-8 scrollbar-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {view.kind === "home" && <HomeView />}
              {view.kind === "library" && <LibraryView />}
              {view.kind === "create" && <CreateInstanceView />}
              {view.kind === "instance" && <InstanceDetailView id={view.id} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Dock />
    </div>
  );
}
