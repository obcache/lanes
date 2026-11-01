import { contextBridge, ipcRenderer } from "electron";
import type { DesktopBridge } from "../src/shared/model";
const bridge: DesktopBridge = {
  read: (name) => ipcRenderer.invoke("store:read", name),
  write: (name, value) => ipcRenderer.invoke("store:write", name, value),
  importAudio: (id, bytes) => ipcRenderer.invoke("audio:import", id, bytes),
  audioUrl: (id) => ipcRenderer.invoke("audio:url", id),
  api: (path, method, body) =>
    ipcRenderer.invoke("api:request", path, method, body),
  window: (action) => ipcRenderer.send("window:action", action),
  exportData: (value) => ipcRenderer.invoke("backup:export", value),
  importData: () => ipcRenderer.invoke("backup:import"),
};
contextBridge.exposeInMainWorld("lanes", bridge);
