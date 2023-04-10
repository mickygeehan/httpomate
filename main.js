//TODO tidy up
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const electronPrompt = require("electron-prompt")
const fs = require('fs');
require('electron-reloader')(module, {ignore: ['./src/main/test']})

async function handlePrompt(request, req) {
    return electronPrompt({
        title: 'Prompt example',
        label: 'URL:'    })
        .then((r) => {
            if(r === null) {
                console.log('user cancelled');
            } else {
                console.log('result', r);
                return r;
            }
        })
        .catch(console.error);
    // return 'hi there'
}

// dunno where this name comes from
async function writeFile(name, request) {
    fs.writeFile(request.name, request.data, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            sandbox: false,
        }
    })
    // win.webContents.openDevTools()
    ipcMain.handle('ping', () => 'pong')
    ipcMain.handle('dialog:prompt', handlePrompt)
    ipcMain.handle('file:fs', writeFile)
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

