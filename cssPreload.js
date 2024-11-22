const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    applyCSS: (css) => ipcRenderer.send('apply-css', css)
});