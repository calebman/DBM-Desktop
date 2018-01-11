import { app, BrowserWindow } from 'electron'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const shell = require('electron').shell

ipc.on('save-dialog', function (event,option) {
    dialog.showSaveDialog(option, function (filename) {
        event.sender.send('saved-file', filename)
    })
})

ipc.on('open-dialog', function (event,option) {
    dialog.showOpenDialog(option,function (files) {
        event.sender.send('open-dialog', files)
    })
})

ipc.on('open-file', function (event,filePath) {
    shell.openItem(filePath);
})

ipc.on('get-app-path', function (event) {
    event.returnValue = app.getAppPath();
})

import logic from '../logic/index';
ipc.on('app-logic',async function (event,logicName,param) {
    let result = await logic.doLogic(logicName,param);
    event.returnValue = result;
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
