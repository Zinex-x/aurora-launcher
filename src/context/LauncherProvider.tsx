import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type Modloader = "vanilla" | "forge" | "fabric";

export type Instance = {
  id: string;
  name: string;
  version: string;
  modloader: Modloader;
  createdAt: number;
  lastPlayed: number | null;
  iconHue: number;
};

export type User = { nickname: string } | null;

export type View =
  | { kind: "home" }
  | { kind: "library" }
  | { kind: "create" }
  | { kind: "instance"; id: string };

type Ctx = {
  view: View;
  setView: (v: View) => void;
  instances: Instance[];
  addInstance: (i: Omit<Instance, "id" | "createdAt" | "lastPlayed" | "iconHue">) => Instance;
  touchInstance: (id: string) => void;
  launchInstance: (id: string) => void;
  user: User;
  setUser: (u: User) => void;
};

const LauncherContext = createContext<Ctx | null>(null);

const STORAGE = "launcher.v1";

function loadState(): { instances: Instance[]; user: User } {
  if (typeof window === "undefined") return { instances: [], user: null };
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { instances: [], user: null };
    return JSON.parse(raw);
  } catch { return { instances: [], user: null }; }
}

export function LauncherProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>({ kind: "home" });
  const [instances, setInstances] = useState<Instance[]>([]);
  const [user, setUserState] = useState<User>(null);

  useEffect(() => {
    const s = loadState();
    setInstances(s.instances);
    setUserState(s.user);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify({ instances, user })); } catch { /* noop */ }
  }, [instances, user]);

  const addInstance: Ctx["addInstance"] = (i) => {
    const inst: Instance = {
      ...i,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      lastPlayed: null,
      iconHue: Math.floor(Math.random() * 360),
    };
    setInstances((prev) => [inst, ...prev]);
    return inst;
  };

  const touchInstance = (id: string) =>
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, lastPlayed: Date.now() } : i)));

  const launchInstance = (id: string) => {
    const inst = instances.find(i => i.id === id);
    if (!inst) return;

    touchInstance(id);
    toast.success(`Launching ${inst.name}...`, {
      description: `Minecraft ${inst.version} (${inst.modloader})`,
      icon: "🚀"
    });

    // In a real Electron app, this would use window.electron.launch(...)
    console.log("ELECTRON: Launching instance", inst);
  };

  return (
    <LauncherContext.Provider
      value={{
        view,
        setView,
        instances,
        addInstance,
        touchInstance,
        launchInstance,
        user,
        setUser: setUserState
      }}
    >
      {children}
    </LauncherContext.Provider>
  );
}

export function useLauncher() {
  const ctx = useContext(LauncherContext);
  if (!ctx) throw new Error("useLauncher must be used within LauncherProvider");
  return ctx;
}
