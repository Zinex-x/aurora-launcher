const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  isMaximized: () => ipcRenderer.invoke("get-window-maximized"),
  onMaximized: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on("window-maximized", subscription);
    return () => ipcRenderer.removeListener("window-maximized", subscription);
  },
  loginWithMicrosoft: () => ipcRenderer.invoke("microsoft-login"),
  getVanillaVersions: () => ipcRenderer.invoke("get-vanilla-versions"),
  checkFabricCompatibility: (mcVersion) => ipcRenderer.invoke("check-fabric-compatibility", mcVersion),
  getFabricVersions: (mcVersion) => ipcRenderer.invoke("get-fabric-versions", mcVersion),
  getForgeVersions: (mcVersion) => ipcRenderer.invoke("get-forge-versions", mcVersion),
  downloadVersion: (payload) => ipcRenderer.invoke("download-version", payload),
  getInstalledInstances: () => ipcRenderer.invoke("get-installed-instances"),
  launchGame: (payload) => ipcRenderer.invoke("launch-game", payload),
  killGame: () => ipcRenderer.invoke("kill-game"),
  updateInstanceConfig: (payload) => ipcRenderer.invoke("update-instance-config", payload),
  getInstanceMods: (instanceName) => ipcRenderer.invoke("get-instance-mods", instanceName),
  openModsFolder: (instanceName) => ipcRenderer.invoke("open-mods-folder", instanceName),
  onDownloadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("download-progress", subscription);
    return () => ipcRenderer.removeListener("download-progress", subscription);
  },
  onDownloadComplete: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("download-complete", subscription);
    return () => ipcRenderer.removeListener("download-complete", subscription);
  },
  onDownloadError: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("download-error", subscription);
    return () => ipcRenderer.removeListener("download-error", subscription);
  },
  onGameLaunched: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("game-launched", subscription);
    return () => ipcRenderer.removeListener("game-launched", subscription);
  },
  onGameExited: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("game-exited", subscription);
    return () => ipcRenderer.removeListener("game-exited", subscription);
  },
});
