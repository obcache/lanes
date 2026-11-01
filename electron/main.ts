import {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
  dialog,
  shell,
  session,
} from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import {
  SettingsSchema,
  type Settings,
  type StoreName,
} from "../src/shared/model";
import { JsonStore } from "./store";
import { allowMidiPermission } from "./midi-permission";
protocol.registerSchemesAsPrivileged([
  {
    scheme: "lanes",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);
let window: BrowserWindow,
  store: JsonStore,
  token = "",
  tokenServer = "";
function sender(event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent) {
  if (
    event.senderFrame !== window.webContents.mainFrame ||
    !event.senderFrame.url.startsWith("lanes://app/")
  )
    throw Error("Untrusted IPC sender");
}
function handle(name: string, fn: (...args: any[]) => unknown) {
  ipcMain.handle(name, (event, ...args) => {
    sender(event);
    return fn(...args);
  });
}
async function settings() {
  const raw = await store.read("settings");
  return SettingsSchema.parse(raw);
}
async function request(
  base: string,
  route: string,
  method: string,
  body?: unknown,
) {
  const response = await fetch(`${base.replace(/\/$/, "")}${route}`, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(30000),
    headers: {
      "Content-Type": "application/json",
      ...(token && tokenServer === base
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok)
    throw Error(String(data.error || `Server returned ${response.status}`));
  return data;
}
async function login(base: string) {
  const verifier = randomBytes(32).toString("base64url"),
    challenge = createHash("sha256").update(verifier).digest("base64url"),
    state = randomBytes(24).toString("hex");
  return new Promise<void>((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      if (
        url.pathname !== "/callback" ||
        url.searchParams.get("state") !== state
      ) {
        res.writeHead(400);
        res.end("Invalid sign-in callback.");
        return;
      }
      clearTimeout(timer);
      try {
        const data = await request(base, "/auth/exchange", "POST", {
          code: url.searchParams.get("code"),
          verifier,
        });
        token = String(data.token);
        tokenServer = base;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Signed in to LANES. You can close this tab.");
        resolve();
      } catch (e) {
        res.writeHead(400);
        res.end("Sign-in failed. Please return to LANES and try again.");
        reject(e);
      } finally {
        server.close();
      }
    });
    const timer = setTimeout(() => {
      server.close();
      reject(Error("Sign-in timed out. Try again."));
    }, 180000);
    server.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return;
      const params = new URLSearchParams({
        callback: `http://127.0.0.1:${address.port}/callback`,
        state,
        challenge,
      });
      void shell.openExternal(`${base}/auth/start?${params}`).catch((e) => {
        clearTimeout(timer);
        server.close();
        reject(e);
      });
    });
  });
}
app.whenReady().then(async () => {
  store = new JsonStore(app.getPath("userData"));
  let midiAccessAllowed =
    (await store.read("settings"))?.midiAccessAllowed ?? true;
  const media = path.join(store.root, "media");
  await fs.mkdir(media, { recursive: true });
  const renderer = app.isPackaged
    ? path.join(app.getAppPath(), "renderer")
    : path.join(__dirname, "../../dist/renderer");
  protocol.handle("lanes", async (req) => {
    try {
      const url = new URL(req.url);
      if (url.host === "media") {
        const id = url.pathname.slice(1);
        if (!/^[a-f0-9]{64}$/.test(id))
          return new Response("Invalid media", { status: 400 });
        return net.fetch(pathToFileURL(path.join(media, id)).href, {
          headers: req.headers,
        });
      }
      if (url.host !== "app") return new Response("", { status: 404 });
      const pathname = decodeURIComponent(url.pathname),
        file = path.resolve(
          renderer,
          `.${pathname === "/" ? "/index.html" : pathname}`,
        );
      if (!file.startsWith(`${path.resolve(renderer)}${path.sep}`))
        return new Response("", { status: 403 });
      const response = await net.fetch(pathToFileURL(file).href);
      const headers = new Headers(response.headers);
      headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; media-src 'self' lanes: blob:; connect-src 'self' lanes:; worker-src 'self'; object-src 'none'; base-uri 'none'",
      );
      return new Response(response.body, { status: response.status, headers });
    } catch {
      return new Response("File not found", { status: 404 });
    }
  });
  session.defaultSession.setPermissionRequestHandler(
    (contents, permission, callback, details) =>
      callback(
        allowMidiPermission(
          permission,
          midiAccessAllowed,
          contents === window?.webContents,
          details.requestingUrl,
          details.isMainFrame,
        ),
      ),
  );
  session.defaultSession.setPermissionCheckHandler(
    (contents, permission, requestingOrigin, details) =>
      allowMidiPermission(
        permission,
        midiAccessAllowed,
        contents === window?.webContents,
        details.requestingUrl ?? requestingOrigin,
        details.isMainFrame,
      ),
  );
  window = new BrowserWindow({
    width: 1440,
    height: 950,
    minWidth: 900,
    minHeight: 650,
    frame: false,
    backgroundColor: "#0c0d12",
    icon: path.join(renderer, "icon.png"),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  handle("store:read", (name: StoreName) => store.read(name));
  handle("store:write", async (name: StoreName, value: unknown) => {
    await store.write(name, value);
    if (name === "settings")
      midiAccessAllowed = SettingsSchema.parse(value).midiAccessAllowed;
  });
  handle("audio:import", async (id: unknown, bytes: unknown) => {
    if (
      typeof id !== "string" ||
      !/^[a-f0-9]{64}$/.test(id) ||
      !(bytes instanceof ArrayBuffer) ||
      bytes.byteLength > 100 * 1024 * 1024
    )
      throw Error("Invalid audio import");
    const data = Buffer.from(bytes);
    if (createHash("sha256").update(data).digest("hex") !== id)
      throw Error("Audio checksum mismatch");
    await fs.writeFile(path.join(media, id), data);
  });
  handle("audio:url", (id: unknown) => {
    if (typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id))
      throw Error("Invalid media ID");
    return `lanes://media/${id}`;
  });
  handle(
    "api:request",
    async (route: unknown, method: unknown, body?: unknown) => {
      if (
        typeof route !== "string" ||
        !/^\/(profile|leaderboards|charts|runs|auth\/(login|logout))(\?[^#]*)?$/.test(
          route,
        ) ||
        typeof method !== "string" ||
        !["GET", "PUT", "POST"].includes(method)
      )
        throw Error("Unsupported API operation");
      const config = await settings();
      if (!config.apiUrl) throw Error("Set the server URL in Settings.");
      if (route === "/auth/login") {
        await login(config.apiUrl);
        return { ok: true };
      }
      const result = await request(config.apiUrl, route, method, body);
      if (route === "/auth/logout") {
        token = "";
        tokenServer = "";
      }
      return result;
    },
  );
  ipcMain.on("window:action", (event, action: unknown) => {
    sender(event);
    if (action === "minimize") window.minimize();
    else if (action === "maximize")
      window.isMaximized() ? window.unmaximize() : window.maximize();
    else if (action === "close") window.close();
  });
  handle("backup:export", async (value: unknown) => {
    if (typeof value !== "string" || value.length > 30 * 1024 * 1024)
      throw Error("Invalid JSON export");
    JSON.parse(value);
    const result = await dialog.showSaveDialog(window, {
      defaultPath: "lanes-backup-v1.json",
      filters: [{ name: "JSON backup", extensions: ["json"] }],
    });
    if (result.filePath) await fs.writeFile(result.filePath, value, "utf8");
  });
  handle("backup:import", async () => {
    const result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
      filters: [{ name: "JSON backup", extensions: ["json"] }],
    });
    if (result.canceled) return null;
    const file = result.filePaths[0],
      stat = await fs.stat(file);
    if (stat.size > 30 * 1024 * 1024) throw Error("Backup exceeds 30 MB");
    return fs.readFile(file, "utf8");
  });
  window.once("ready-to-show", () => window.show());
  await window.loadURL("lanes://app/index.html");
});
app.on("window-all-closed", () => app.quit());
