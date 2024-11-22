const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startBots: (botConfig) => ipcRenderer.send('start-bots', botConfig),
    stopBots: () => ipcRenderer.send('stop-bots'),
    onLogMessage: (callback) => ipcRenderer.on('log-message', (_, message) => callback(message)),
    onSaveLogFile: (callback) => ipcRenderer.on('save-log-file', (_, filePath) => callback(filePath)),
    saveLogFile: (filePath, content) => {
        ipcRenderer.invoke('save-log-file', { filePath, content });
    }
});