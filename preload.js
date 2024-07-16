const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  controlWindow: (action) => ipcRenderer.send('control-window', action),
  onNewLogLine: (callback) => ipcRenderer.on('new-log-line', (event, ...args) => callback(...args)),
  saveConfig: (config) => ipcRenderer.send('save-config', config)
});
