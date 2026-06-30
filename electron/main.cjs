const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const express = require("express");
const axios = require("axios");

let mainWindow;

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
      preload: path.join(__dirname, "preload.js"),
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
