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
  downloadVersion: (payload) => ipcRenderer.invoke("download-version", payload),
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
});
