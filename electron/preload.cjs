const { contextBridge } = require('electron');

// Expose safe desktop environment flags and helper APIs to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron
});
