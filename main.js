const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const { startBots, stopBots } = require('./src/botController');
const fs = require('fs');

let mainWindow;
let cssWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'src', 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    setAppMenu();
}

function setAppMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Save Console to .log file',
                    click: () => {
                        dialog.showSaveDialog({
                            title: 'Save Console as Log File',
                            defaultPath: path.join(__dirname, 'console.log'),
                            filters: [
                                { name: 'Log Files', extensions: ['log'] },
                                { name: 'All Files', extensions: ['*'] }
                            ]
                        }).then(file => {
                            if (!file.canceled) {
                                mainWindow.webContents.send('save-log-file', file.filePath.toString());
                            }
                        }).catch(err => {
                            console.log(err);
                        });
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'QuickCSS',
                    click: () => {
                        openCssWindow();
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function openCssWindow() {
    if (cssWindow) {
        cssWindow.focus();
        return;
    }

    cssWindow = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            preload: path.join(__dirname, 'src', 'cssPreload.js'),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    cssWindow.loadFile(path.join(__dirname, 'src', 'quickcss.html'));

    cssWindow.on('closed', () => {
        cssWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('save-log-file', (event, filePath) => {
    const logElement = mainWindow.webContents.executeJavaScript('document.getElementById("log").innerText');
    logElement.then(logContent => {
        fs.writeFile(filePath, logContent, (err) => {
            if (err) {
                console.log("Error saving log file:", err);
            } else {
                console.log("Log file saved successfully.");
            }
        });
    });
});

ipcMain.on('apply-css', (event, css) => {
    mainWindow.webContents.insertCSS(css);
});

ipcMain.on('start-bots', (event, botConfig) => {
    try {
        startBots(botConfig, (message) => {
            mainWindow.webContents.send('log-message', message);
        });
    } catch (err) {
        mainWindow.webContents.send('log-message', `Error starting bots: ${err.message}`);
    }
});

ipcMain.on('stop-bots', () => {
    try {
        stopBots();
        mainWindow.webContents.send('log-message', 'All bots stopped.');
    } catch (err) {
        mainWindow.webContents.send('log-message', `Error stopping bots: ${err.message}`);
    }
});