const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    ping: () => ipcRenderer.invoke('ping')
})

contextBridge.exposeInMainWorld('electronPrompt', {
    prompt: (request) => ipcRenderer.invoke('dialog:prompt', request)
})

contextBridge.exposeInMainWorld('fileWriter', {
    fs: (request) => ipcRenderer.invoke('file:fs', request)
})

