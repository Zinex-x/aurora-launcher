const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { MinecraftFolder } = require("@xmcl/core");
const {
  installTask,
  installVersionTask,
  installLibrariesTask,
  installAssetsTask,
  installJreFromMojangTask,
  fetchJavaRuntimeManifest,
  installJavaRuntimeTask,
  installFabric,
  installForgeTask,
  getFabricLoaders,
  getForgeVersionList,
} = require("@xmcl/installer");
const LZMA = require("lzma-purejs");
const { Client } = require("minecraft-launcher-core");

let mainWindow;
let currentProcess = null;

const LAUNCHER_DIR = path.join(app.getPath("appData"), ".aurora-launcher");
const SHARED_DIR = LAUNCHER_DIR;
const PROFILES_DIR = path.join(LAUNCHER_DIR, "profiles");

// Ensure base directories exist
if (!fs.existsSync(LAUNCHER_DIR)) fs.mkdirSync(LAUNCHER_DIR, { recursive: true });
if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true });

async function findJavaExecutable(baseDir) {
  const isWin = process.platform === "win32";
  const exeName = isWin ? "java.exe" : "java";

  async function search(dir, depth) {
    if (depth > 4) return null;
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.toLowerCase() === exeName.toLowerCase()) {
          return path.join(dir, entry.name);
        }
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const found = await search(path.join(dir, entry.name), depth + 1);
          if (found) return found;
        }
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  return await search(baseDir, 0);
}

function sanitizeInstanceName(name) {
  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new Error("Instance name cannot be empty.");
  }
  const sanitized = name.trim();
  const invalidChars = /[<>:"|?*\\\/]/g;
  if (invalidChars.test(sanitized)) {
    throw new Error('Instance name contains invalid characters: < > : " | ? * / \\');
  }
  if (sanitized === "." || sanitized === "..") {
    throw new Error("Invalid instance name.");
  }
  return sanitized;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window-maximized", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window-maximized", false);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// IPC Handlers
ipcMain.handle("get-installed-instances", async () => {
  if (!fs.existsSync(PROFILES_DIR)) return [];
  const folders = fs.readdirSync(PROFILES_DIR);
  const instances = [];
  for (const folder of folders) {
    const profilePath = path.join(PROFILES_DIR, folder);
    const instanceJsonPath = path.join(profilePath, "instance.json");
    if (fs.statSync(profilePath).isDirectory() && fs.existsSync(instanceJsonPath)) {
      try {
        const content = fs.readFileSync(instanceJsonPath, "utf-8");
        const instance = JSON.parse(content);
        // Ensure standard fields
        instance.name = instance.name || folder;
        instance.version = instance.version || instance.mcVersion;
        instances.push(instance);
      } catch (err) {
        console.error(`Error reading instance.json in ${folder}:`, err);
      }
    }
  }
  return instances;
});

ipcMain.handle("update-instance-config", async (event, { instanceName, config }) => {
  const profileDir = path.join(PROFILES_DIR, instanceName);
  const instanceJsonPath = path.join(profileDir, "instance.json");
  if (fs.existsSync(instanceJsonPath)) {
    const data = JSON.parse(fs.readFileSync(instanceJsonPath, "utf-8"));
    const updated = { ...data, ...config };
    fs.writeFileSync(instanceJsonPath, JSON.stringify(updated, null, 2));
    return updated;
  }
  throw new Error("Instance not found");
});

ipcMain.handle("get-instance-mods", async (event, instanceName) => {
  const modsDir = path.join(PROFILES_DIR, instanceName, ".minecraft", "mods");
  if (!fs.existsSync(modsDir)) return [];
  const files = fs.readdirSync(modsDir);
  return files.filter(f => f.endsWith(".jar"));
});

ipcMain.handle("open-mods-folder", async (event, instanceName) => {
  const modsDir = path.join(PROFILES_DIR, instanceName, ".minecraft", "mods");
  if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir, { recursive: true });
  shell.openPath(modsDir);
});

ipcMain.handle("launch-game", async (event, { instanceName, auth }) => {
  if (currentProcess) {
    throw new Error("A game is already running.");
  }

  const profileDir = path.join(PROFILES_DIR, instanceName);
  const minecraftDir = path.join(profileDir, ".minecraft");
  const instanceJsonPath = path.join(profileDir, "instance.json");

  if (!fs.existsSync(instanceJsonPath)) {
    throw new Error(`Instance config not found for ${instanceName}`);
  }

  const instanceData = JSON.parse(fs.readFileSync(instanceJsonPath, "utf-8"));
  const launcher = new Client();

  const opts = {
    authorization: {
      access_token: auth.accessToken,
      uuid: auth.uuid,
      name: auth.nickname,
      user_properties: "{}",
    },
    root: minecraftDir,
    version: {
      number: instanceData.actualVersionId || instanceData.mcVersion,
      type: "release",
    },
    memory: {
      max: instanceData.maxRam || "4G",
      min: instanceData.minRam || "2G",
    },
    javaPath: instanceData.javaPath,
    overrides: {
      assetRoot: path.join(LAUNCHER_DIR, "assets"),
      libraryRoot: path.join(LAUNCHER_DIR, "libraries"),
      versionRoot: path.join(LAUNCHER_DIR, "versions"),
      gameDirectory: minecraftDir,
    },
  };

  try {
    currentProcess = launcher.launch(opts);

    currentProcess.on("close", (code) => {
      console.log(`Game exited with code ${code}`);
      currentProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("game-exited", { instanceName });
      }
    });

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("game-launched", { instanceName });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to launch game:", error);
    currentProcess = null;
    throw error;
  }
});

ipcMain.handle("kill-game", async () => {
  if (currentProcess) {
    currentProcess.kill();
    currentProcess = null;
    return { success: true };
  }
  return { success: false, error: "No game running" };
});

ipcMain.on("window-minimize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on("window-maximize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on("window-close", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

ipcMain.handle("get-window-maximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle("get-vanilla-versions", async () => {
  try {
    const response = await axios.get(
      "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json",
    );
    const { latest, versions } = response.data;

    const filteredVersions = versions
      .filter((v) => v.type === "release" || v.type === "snapshot")
      .map((v) => ({
        id: v.id,
        type: v.type,
        url: v.url,
        releaseTime: v.releaseTime,
      }));

    return {
      latest,
      versions: filteredVersions,
    };
  } catch (error) {
    console.error("Failed to fetch vanilla versions:", error);
    throw new Error("Failed to fetch Minecraft versions. Please check your internet connection.");
  }
});

ipcMain.handle("get-fabric-versions", async (event, mcVersion) => {
  try {
    const loaders = await getFabricLoaders();
    // Usually we want to filter by mcVersion if needed, but getFabricLoaders often returns all.
    // However, Fabric is usually compatible across versions if you have the right mapping.
    // Some versions of getFabricLoaders might take mcVersion.
    return loaders;
  } catch (error) {
    console.error("Failed to fetch Fabric versions:", error);
    return [];
  }
});

ipcMain.handle("get-forge-versions", async (event, mcVersion) => {
  try {
    const versions = await getForgeVersionList({ mcversion: mcVersion });
    return versions;
  } catch (error) {
    console.error("Failed to fetch Forge versions:", error);
    return [];
  }
});

ipcMain.handle("download-version", async (event, { instanceName, versionId, loader, loaderVersion }) => {
  try {
    const sanitizedName = sanitizeInstanceName(instanceName);
    const profileDir = path.join(PROFILES_DIR, sanitizedName);
    const minecraftDir = path.join(profileDir, ".minecraft");
    const instanceJsonPath = path.join(profileDir, "instance.json");

    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    if (!fs.existsSync(minecraftDir)) {
      fs.mkdirSync(minecraftDir, { recursive: true });
      const subfolders = ["mods", "saves", "config", "resourcepacks", "shaderpacks"];
      for (const folder of subfolders) {
        fs.mkdirSync(path.join(minecraftDir, folder), { recursive: true });
      }
    }

    let instanceData = {};
    if (fs.existsSync(instanceJsonPath)) {
      instanceData = JSON.parse(fs.readFileSync(instanceJsonPath, "utf-8"));
    } else {
      instanceData = {
        name: sanitizedName,
        mcVersion: versionId,
        loader: loader || null,
        loaderVersion: loaderVersion || null,
        createdAt: new Date().toISOString(),
      };
      fs.writeFileSync(instanceJsonPath, JSON.stringify(instanceData, null, 2));
    }

    const mcFolder = new MinecraftFolder(SHARED_DIR);

    const manifestRes = await axios.get(
      "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json",
    );
    const versionMeta = manifestRes.data.versions.find((v) => v.id === versionId);

    if (!versionMeta) {
      throw new Error(`Version ${versionId} not found in Mojang manifest.`);
    }

    // Fetch full version JSON to get javaVersion
    const versionJsonRes = await axios.get(versionMeta.url);
    const fullVersionMeta = versionJsonRes.data;
    const majorVersion = fullVersionMeta.javaVersion?.majorVersion || 8;
    const component = fullVersionMeta.javaVersion?.component || "jre-legacy";

    // Java Runtime Handling
    const runtimeDir = path.join(LAUNCHER_DIR, "runtime", String(majorVersion));
    let javaPath = await findJavaExecutable(runtimeDir);

    if (!javaPath) {
      try {
        console.log(`Downloading Java ${majorVersion}...`);

        // Patching Request for undici issue (UND_ERR_INVALID_ARG: throwOnError)
        const originalRequest = global.Request;
        if (originalRequest) {
          global.Request = class extends originalRequest {
            constructor(input, options) {
              if (options && typeof options === "object" && "throwOnError" in options) {
                delete options.throwOnError;
              }
              super(input, options);
            }
          };
        }

        let javaTask;
        if (majorVersion === 8) {
          javaTask = installJreFromMojangTask({
            destination: runtimeDir,
            unpackLZMA: async (src, dest) => {
              const compressed = await fs.promises.readFile(src);
              const decompressed = LZMA.decompressFile(compressed);
              await fs.promises.writeFile(dest, Buffer.from(decompressed));
            },
          });
        } else {
          const manifest = await fetchJavaRuntimeManifest({
            target: component,
          });
          javaTask = installJavaRuntimeTask({
            manifest,
            destination: runtimeDir,
            lzma: async (src, dest) => {
              const compressed = await fs.promises.readFile(src);
              const decompressed = LZMA.decompressFile(compressed);
              await fs.promises.writeFile(dest, Buffer.from(decompressed));
            },
          });
        }

        await javaTask.startAndWait({
          onUpdate(child) {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("download-progress", {
                instanceName: sanitizedName,
                task: `java.${child.path || child.name || "download"}`,
                current: child.progress || 0,
                total: child.total || 0,
                percent: child.total > 0 ? Math.round((child.progress / child.total) * 100) : 0,
              });
            }
          },
        });

        // Restore Request
        if (originalRequest) {
          global.Request = originalRequest;
        }

        javaPath = await findJavaExecutable(runtimeDir);
        if (javaPath) {
          instanceData.javaPath = javaPath;
          instanceData.javaMajorVersion = majorVersion;
          fs.writeFileSync(instanceJsonPath, JSON.stringify(instanceData, null, 2));
        }
      } catch (javaError) {
        console.warn("Failed to download Java runtime with primary method:", javaError);

        // Fallback for Windows x64 using manual manifest fetch
        if (process.platform === "win32") {
          try {
            console.log(`Attempting manual Java ${majorVersion} download for Windows...`);
            const allJsonUrl = "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";
            const allRes = await axios.get(allJsonUrl);
            const arch = "windows-x64";
            // component is defined in the parent scope of the try-catch
            const entry = allRes.data[arch]?.[component]?.[0];

            if (entry) {
              const manifestUrl = entry.manifest.url;
              const manifestRes = await axios.get(manifestUrl);
              const files = manifestRes.data.files;

              if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, { recursive: true });

              // Filter for some critical files to demonstrate it works or download all.
              // For a robust fix, we should download all files.
              // To keep it clean and fast for the agent, I'll implement a loop that downloads.

              const fileEntries = Object.entries(files);
              let downloadedCount = 0;

              for (const [filePath, fileData] of fileEntries) {
                if (fileData.type === "directory") {
                  fs.mkdirSync(path.join(runtimeDir, filePath), { recursive: true });
                  continue;
                }

                const destPath = path.join(runtimeDir, filePath);
                const parentDir = path.dirname(destPath);
                if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });

                const downloadInfo = fileData.downloads.lzma || fileData.downloads.raw;
                const isLzma = !!fileData.downloads.lzma;

                const fileRes = await axios({
                  url: downloadInfo.url,
                  method: 'GET',
                  responseType: 'arraybuffer'
                });

                let finalBuffer = Buffer.from(fileRes.data);
                if (isLzma) {
                  const decompressed = LZMA.decompressFile(finalBuffer);
                  finalBuffer = Buffer.from(decompressed);
                }

                fs.writeFileSync(destPath, finalBuffer);
                if (fileData.executable) {
                  fs.chmodSync(destPath, 0o755);
                }

                downloadedCount++;
                if (downloadedCount % 10 === 0 && mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("download-progress", {
                    instanceName,
                    task: `java.manual.${majorVersion}`,
                    current: downloadedCount,
                    total: fileEntries.length,
                    percent: Math.round((downloadedCount / fileEntries.length) * 100),
                  });
                }
              }

              javaPath = await findJavaExecutable(runtimeDir);
              if (javaPath) {
                instanceData.javaPath = javaPath;
                instanceData.javaMajorVersion = majorVersion;
                fs.writeFileSync(instanceJsonPath, JSON.stringify(instanceData, null, 2));
              }
            }
          } catch (fallbackError) {
            console.error("Java manual fallback failed:", fallbackError);
          }
        }
      }
    } else {
      if (instanceData.javaPath !== javaPath) {
        instanceData.javaPath = javaPath;
        instanceData.javaMajorVersion = majorVersion;
        fs.writeFileSync(instanceJsonPath, JSON.stringify(instanceData, null, 2));
      }
    }

    const task = installTask(versionMeta, mcFolder, {
      libraryDownloadConcurrency: 10,
      assetDownloadConcurrency: 10,
    });

    await task.startAndWait({
      onUpdate(child) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          const progress = {
            instanceName: sanitizedName,
            task: child.path || child.name || "downloading",
            current: child.progress || 0,
            total: child.total || 0,
            percent: child.total > 0 ? Math.round((child.progress / child.total) * 100) : 0,
          };
          mainWindow.webContents.send("download-progress", progress);
        }
      },
      onFailed(child, error) {
        console.error(`Task ${child.path || child.name} failed:`, error);
      },
    });

    let actualVersionId = versionId;

    if (loader === "fabric" && loaderVersion) {
      console.log(`Installing Fabric ${loaderVersion} for ${versionId}...`);
      actualVersionId = await installFabric(loaderVersion, versionId, SHARED_DIR);
    } else if (loader === "forge" && loaderVersion) {
      console.log(`Installing Forge ${loaderVersion} for ${versionId}...`);
      const forgeTask = installForgeTask({
        version: loaderVersion,
        mc: versionId
      }, SHARED_DIR);
      await forgeTask.startAndWait({
        onUpdate(child) {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("download-progress", {
              instanceName: sanitizedName,
              task: `forge.${child.path || child.name || "install"}`,
              current: child.progress || 0,
              total: child.total || 0,
              percent: child.total > 0 ? Math.round((child.progress / child.total) * 100) : 0,
            });
          }
        }
      });
      // Forge usually creates a version named like this:
      actualVersionId = `${versionId}-forge-${loaderVersion}`;
    }

    instanceData.actualVersionId = actualVersionId;
    fs.writeFileSync(instanceJsonPath, JSON.stringify(instanceData, null, 2));

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("download-complete", {
        instanceName: sanitizedName,
        versionId,
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Download failed:", error);
    const errorMessage = error.message || "An unknown error occurred during download.";
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("download-error", {
        message: errorMessage,
        instanceName,
        versionId,
      });
    }
    throw error;
  }
});

// === Microsoft Auth Flow (встроенный BrowserWindow, проверенно рабочий) ===
const CLIENT_ID = "00000000402b5328";
const REDIRECT_URI = "https://login.live.com/oauth20_desktop.srf";

ipcMain.handle("microsoft-login", async () => {
  return new Promise((resolve, reject) => {
    let codeReceived = false;

    const authWindow = new BrowserWindow({
      width: 500,
      height: 600,
      title: "Microsoft Authentication",
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const authUrl = `https://login.live.com/oauth20_authorize.srf?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=XboxLive.signin%20offline_access`;

    authWindow.loadURL(authUrl);

    const handleNavigation = async (url) => {
      if (url.includes("https://login.live.com/oauth20_desktop.srf") && url.includes("code=")) {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get("code");

        codeReceived = true;
        authWindow.destroy();

        try {
          const msTokenRes = await axios.post(
            "https://login.live.com/oauth20_token.srf",
            new URLSearchParams({
              client_id: CLIENT_ID,
              code,
              grant_type: "authorization_code",
              redirect_uri: REDIRECT_URI,
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
          );
          const msAccessToken = msTokenRes.data.access_token;

          const xblRes = await axios.post("https://user.auth.xboxlive.com/user/authenticate", {
            Properties: {
              AuthMethod: "RPS",
              SiteName: "user.auth.xboxlive.com",
              RpsTicket: `d=${msAccessToken}`,
            },
            RelyingParty: "http://auth.xboxlive.com",
            TokenType: "JWT",
          });
          const xblToken = xblRes.data.Token;
          const userHash = xblRes.data.DisplayClaims.xui[0].uhs;

          const xstsRes = await axios.post("https://xsts.auth.xboxlive.com/xsts/authorize", {
            Properties: {
              SandboxId: "RETAIL",
              UserTokens: [xblToken],
            },
            RelyingParty: "rp://api.minecraftservices.com/",
            TokenType: "JWT",
          });
          const xstsToken = xstsRes.data.Token;

          const mcAuthRes = await axios.post(
            "https://api.minecraftservices.com/authentication/login_with_xbox",
            { identityToken: `XBL3.0 x=${userHash};${xstsToken}` },
          );
          const mcAccessToken = mcAuthRes.data.access_token;

          const entitlementsRes = await axios.get(
            "https://api.minecraftservices.com/entitlements/mcstore",
            { headers: { Authorization: `Bearer ${mcAccessToken}` } },
          );

          const hasGame = entitlementsRes.data.items.some((item) => item.name === "game_minecraft");
          if (!hasGame) {
            reject(new Error("License Missing: You do not own Minecraft on this account."));
            return;
          }

          const profileRes = await axios.get("https://api.minecraftservices.com/minecraft/profile", {
            headers: { Authorization: `Bearer ${mcAccessToken}` },
          });

          const userData = {
            nickname: profileRes.data.name,
            uuid: profileRes.data.id,
            accessToken: mcAccessToken,
            skin:
              profileRes.data.skins[0]?.url ||
              "https://textures.minecraft.net/texture/31aa375d8363711d9d43513a968846399435b6f0412e23e2a2550f2495b6c",
          };

          resolve(userData);
        } catch (err) {
          reject(err);
        }
      }
    };

    authWindow.webContents.on("will-navigate", (event, url) => {
      handleNavigation(url);
    });

    authWindow.webContents.on("did-redirect-navigation", (event, url) => {
      handleNavigation(url);
    });

    const filter = { urls: [REDIRECT_URI + "*"] };
    authWindow.webContents.session.webRequest.onBeforeRedirect(filter, (details) => {
      handleNavigation(details.redirectURL);
    });

    authWindow.on("closed", () => {
      if (!codeReceived) {
        reject(new Error("Login window closed by user"));
      }
    });
  });
});
