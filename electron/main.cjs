const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const express = require("express");
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
} = require("@xmcl/installer");
const LZMA = require("lzma-purejs");

let mainWindow;

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
      // Check files in current dir
      for (const entry of entries) {
        if (entry.isFile() && entry.name.toLowerCase() === exeName.toLowerCase()) {
          return path.join(dir, entry.name);
        }
      }
      // Recurse into directories
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
  // Windows-forbidden characters: < > : " | ? * and slashes
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
    // Optional: Open devtools
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Handle window state events
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

ipcMain.handle("download-version", async (event, { instanceName, versionId }) => {
  try {
    const sanitizedName = sanitizeInstanceName(instanceName);
    const profileDir = path.join(PROFILES_DIR, sanitizedName);
    const minecraftDir = path.join(profileDir, ".minecraft");
    const instanceJsonPath = path.join(profileDir, "instance.json");

    // 1. Initialize profile folder
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    if (!fs.existsSync(minecraftDir)) {
      fs.mkdirSync(minecraftDir, { recursive: true });
      // Create subfolders
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
        loader: null,
        loaderVersion: null,
        createdAt: new Date().toISOString(),
      };
      fs.writeFileSync(instanceJsonPath, JSON.stringify(instanceData, null, 2));
    }

    // 2. Download version
    const mcFolder = new MinecraftFolder(SHARED_DIR);

    // Get version meta from manifest
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

    // 3. Java Runtime Handling
    const runtimeDir = path.join(LAUNCHER_DIR, "runtime", String(majorVersion));
    let javaPath = await findJavaExecutable(runtimeDir);

    if (!javaPath) {
      try {
        console.log(`Downloading Java ${majorVersion}...`);
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

        javaPath = await findJavaExecutable(runtimeDir);
        if (javaPath) {
          instanceData.javaPath = javaPath;
          instanceData.javaMajorVersion = majorVersion;
          fs.writeFileSync(instanceJsonPath, JSON.stringify(instanceData, null, 2));
        }
      } catch (javaError) {
        console.warn("Failed to download Java runtime:", javaError);
      }
    } else {
      // Update instance.json with found javaPath if not present
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
          // Find the root task or relevant child task for progress
          // We broadcast progress for the main task
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

// Microsoft Auth Flow
let authServer;
const CLIENT_ID = "00000000402b5328"; // Public client ID for Minecraft
const REDIRECT_URI = "http://localhost:3000";

ipcMain.handle("microsoft-login", async () => {
  return new Promise((resolve, reject) => {
    if (authServer) authServer.close();

    const app = express();
    authServer = app.listen(3000, async () => {
      const authUrl = `https://login.live.com/oauth20_authorize.srf?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=XboxLive.signin%20offline_access`;
      shell.openExternal(authUrl);
    });

    app.get("/", async (req, res) => {
      const { code } = req.query;
      if (!code) {
        res.send("Authorization failed. No code provided.");
        reject(new Error("No code provided"));
        return;
      }

      res.send("Successfully authenticated! You can close this tab.");
      authServer.close();
      authServer = null;

      try {
        // 1. Get Microsoft Token
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

        // 2. Xbox Live Auth
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

        // 3. XSTS Auth
        const xstsRes = await axios.post("https://xsts.auth.xboxlive.com/xsts/authorize", {
          Properties: {
            SandboxId: "RETAIL",
            UserTokens: [xblToken],
          },
          RelyingParty: "rp://api.minecraftservices.com/",
          TokenType: "JWT",
        });
        const xstsToken = xstsRes.data.Token;

        // 4. Minecraft Auth
        const mcAuthRes = await axios.post(
          "https://api.minecraftservices.com/authentication/login_with_xbox",
          {
            identityToken: `XBL3.0 x=${userHash};${xstsToken}`,
          },
        );
        const mcAccessToken = mcAuthRes.data.access_token;

        // 5. Check Entitlements
        const entitlementsRes = await axios.get(
          "https://api.minecraftservices.com/entitlements/mcstore",
          {
            headers: { Authorization: `Bearer ${mcAccessToken}` },
          },
        );

        const hasGame = entitlementsRes.data.items.some((item) => item.name === "game_minecraft");
        if (!hasGame) {
          throw new Error("License Missing: You do not own Minecraft on this account.");
        }

        // 6. Get Profile
        const profileRes = await axios.get("https://api.minecraftservices.com/minecraft/profile", {
          headers: { Authorization: `Bearer ${mcAccessToken}` },
        });

        const userData = {
          nickname: profileRes.data.name,
          uuid: profileRes.data.id,
          accessToken: mcAccessToken,
          skin:
            profileRes.data.skins[0]?.url ||
            "https://textures.minecraft.net/texture/31aa375d8363711d9d43513a968846399435b6f0412e23e2a2550f2495b6c", // Default Steve skin if none
        };

        resolve(userData);
      } catch (err) {
        reject(err);
      }
    });
  });
});
