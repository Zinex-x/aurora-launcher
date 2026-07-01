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
  minRam?: string;
  maxRam?: string;
};

export type User = {
  nickname: string;
  uuid?: string;
  accessToken?: string;
  skin?: string;
} | null;

export type DownloadStatus = "idle" | "downloading" | "ready" | "error";

export type DownloadState = {
  status: DownloadStatus;
  overallPercent: number;
  currentTaskLabel: string;
  error?: string;
  _tasksSeen?: Record<string, number>;
};

export type View =
  | { kind: "home" }
  | { kind: "library" }
  | { kind: "skins" }
  | { kind: "create" }
  | { kind: "instance"; id: string };

type Ctx = {
  view: View;
  setView: (v: View) => void;
  instances: Instance[];
  addInstance: (i: Omit<Instance, "id" | "createdAt" | "lastPlayed" | "iconHue">) => Instance;
  touchInstance: (id: string) => void;
  updateInstance: (id: string, config: Partial<Instance>) => Promise<void>;
  launchInstance: (id: string) => Promise<void>;
  killInstance: () => Promise<void>;
  runningInstance: string | null;
  isLaunching: boolean;
  user: User;
  setUser: (u: User) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  isInstanceSettingsOpen: boolean;
  setInstanceSettingsOpen: (open: boolean) => void;
  downloads: Record<string, DownloadState>;
  downloadInstance: (instanceName: string, versionId: string, loader?: Modloader) => Promise<void>;
};

const LauncherContext = createContext<Ctx | null>(null);

const TASK_WEIGHTS: Record<string, number> = {
  "java.download": 0.15,
  "java.extract": 0.05,
  "install.version.json": 0.02,
  "install.version.jar": 0.13,
  "install.libraries": 0.25,
  "install.assets.index": 0.05,
  "install.assets": 0.35,
};

const STORAGE = "launcher.v1";

function loadState(): { instances: Instance[]; user: User } {
  if (typeof window === "undefined") return { instances: [], user: null };
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { instances: [], user: null };
    return JSON.parse(raw);
  } catch {
    return { instances: [], user: null };
  }
}

export function LauncherProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>({ kind: "home" });
  const [instances, setInstances] = useState<Instance[]>([]);
  const [user, setUserState] = useState<User>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isInstanceSettingsOpen, setInstanceSettingsOpen] = useState(false);
  const [runningInstance, setRunningInstance] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  useEffect(() => {
    if (!window.electron) return;

    const unsubProgress = window.electron.onDownloadProgress((data) => {
      setDownloads((prev) => {
        const current = prev[data.instanceName] || {
          status: "downloading",
          overallPercent: 0,
          currentTaskLabel: "",
        };

        // Track sub-task progress to calculate overall weighted progress
        const tasksSeen = current._tasksSeen || {};
        tasksSeen[data.task] = data.percent / 100;

        let overallPercent = 0;
        for (const [task, p] of Object.entries(tasksSeen)) {
          overallPercent += (p as number) * (TASK_WEIGHTS[task] || 0);
        }

        return {
          ...prev,
          [data.instanceName]: {
            ...current,
            status: "downloading",
            overallPercent: Math.min(99, Math.round(overallPercent * 100)),
            currentTaskLabel: data.task,
            _tasksSeen: tasksSeen, // internal
          } as DownloadState,
        };
      });
    });

    const unsubComplete = window.electron.onDownloadComplete((data) => {
      setDownloads((prev) => ({
        ...prev,
        [data.instanceName]: {
          status: "ready",
          overallPercent: 100,
          currentTaskLabel: "finalizing",
        },
      }));
      toast.success(`Instance ${data.instanceName} is ready!`);
    });

    const unsubError = window.electron.onDownloadError((data) => {
      setDownloads((prev) => ({
        ...prev,
        [data.instanceName]: {
          status: "error",
          overallPercent: 0,
          currentTaskLabel: "error",
          error: data.message,
        },
      }));
      toast.error(`Download failed: ${data.message}`);
    });

    const unsubLaunched = window.electron.onGameLaunched((data) => {
      setRunningInstance(data.instanceName);
      setIsLaunching(false);
      toast.success(`Game launched: ${data.instanceName}`);
    });

    const unsubExited = window.electron.onGameExited((data) => {
      setRunningInstance(null);
      toast.info(`Game closed: ${data.instanceName}`);
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
      unsubLaunched();
      unsubExited();
    };
  }, []);

  useEffect(() => {
    async function init() {
      const s = loadState();
      setUserState(s.user);

      if (window.electron) {
        try {
          const installed = await window.electron.getInstalledInstances();
          if (installed && installed.length > 0) {
            // Map backend instances to frontend Instance type if necessary
            // For now assume they are compatible or merge with local state
            setInstances(installed.map((inst: any) => ({
              ...inst,
              id: inst.id || window.crypto.randomUUID(),
              createdAt: inst.createdAt ? new Date(inst.createdAt).getTime() : Date.now(),
              lastPlayed: inst.lastPlayed ? new Date(inst.lastPlayed).getTime() : null,
              iconHue: inst.iconHue || (Math.abs(inst.name.split('').reduce((a:number,b:string)=>((a<<5)-a)+b.charCodeAt(0),0)) % 360)
            })));
            return;
          }
        } catch (e) {
          console.error("Failed to load installed instances:", e);
        }
      }
      setInstances(s.instances);
    }
    init();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ instances, user }));
    } catch {
      /* noop */
    }
  }, [instances, user]);

  const addInstance: Ctx["addInstance"] = (i) => {
    // Deterministic hue based on name
    let hash = 0;
    for (let j = 0; j < i.name.length; j++) {
      hash = i.name.charCodeAt(j) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;

    const inst: Instance = {
      ...i,
      id: window.crypto.randomUUID(),
      createdAt: Date.now(),
      lastPlayed: null,
      iconHue: hue,
    };
    setInstances((prev) => [inst, ...prev]);
    return inst;
  };

  const touchInstance = (id: string) =>
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, lastPlayed: Date.now() } : i)));

  const updateInstance: Ctx["updateInstance"] = async (id, config) => {
    const inst = instances.find(i => i.id === id);
    if (!inst) return;

    setInstances(prev => prev.map(i => i.id === id ? { ...i, ...config } : i));

    if (window.electron) {
      try {
        await window.electron.updateInstanceConfig({
          instanceName: inst.name,
          config
        });
      } catch (e) {
        console.error("Failed to update instance config on disk:", e);
      }
    }
  };

  const downloadInstance = async (instanceName: string, versionId: string, loader: Modloader = "vanilla") => {
    setDownloads((prev) => ({
      ...prev,
      [instanceName]: {
        status: "downloading",
        overallPercent: 0,
        currentTaskLabel: "preparing",
      },
    }));

    try {
      await window.electron.downloadVersion({ instanceName, versionId, loader });
    } catch (e) {
      // Error handled via IPC event
    }
  };

  const launchInstance = async (id: string) => {
    const inst = instances.find((i) => i.id === id);
    if (!inst) return;
    if (!user) {
      toast.error("You must be logged in to launch the game.");
      return;
    }

    if (runningInstance || isLaunching) {
      toast.error("A game is already running or launching.");
      return;
    }

    setIsLaunching(true);
    touchInstance(id);
    toast.success(`Preparing to launch ${inst.name}...`, {
      description: `Minecraft ${inst.version} (${inst.modloader})`,
      icon: "🚀",
    });

    try {
      await window.electron.launchGame({
        instanceName: inst.name,
        auth: {
          accessToken: user.accessToken,
          uuid: user.uuid,
          nickname: user.nickname,
        }
      });
    } catch (e: any) {
      setIsLaunching(false);
      toast.error(`Failed to launch game: ${e.message}`);
    }
  };

  const killInstance = async () => {
    try {
      await window.electron.killGame();
    } catch (e: any) {
      toast.error(`Failed to kill game: ${e.message}`);
    }
  };

  return (
    <LauncherContext.Provider
      value={{
        view,
        setView,
        instances,
        addInstance,
        touchInstance,
        updateInstance,
        launchInstance,
        killInstance,
        runningInstance,
        isLaunching,
        user,
        setUser: setUserState,
        isSettingsOpen,
        setSettingsOpen,
        isInstanceSettingsOpen,
        setInstanceSettingsOpen,
        downloads,
        downloadInstance,
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
