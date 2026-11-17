// The only things the page can ask the app to do.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('atlasHost', {
  load: () => ipcRenderer.invoke('store:load'),
  save: (text) => ipcRenderer.invoke('store:save', text),
  saveSync: (text) => ipcRenderer.sendSync('store:saveSync', text),
  config: () => ipcRenderer.invoke('cfg:get'),
  setConfig: (patch) => ipcRenderer.invoke('cfg:set', patch),
  saveFile: (name, data) => ipcRenderer.invoke('file:save', name, data),
  openDataFolder: () => ipcRenderer.invoke('folder:open'),
  openPortal: (source) => ipcRenderer.invoke('portal:open', source),
  canvasExport: () => ipcRenderer.invoke('canvas:export'),
  pageReport: (source) => ipcRenderer.invoke('portal:report', source),
});
