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
});
