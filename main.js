/**
 * @author Chidambaram P G
 * @email chidambaram@rexav.in
 * @create date 2020-05-31 10:48:48
 * @modify date 2020-05-31 10:48:48
 * @desc [description]
 */

// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')
const { powerMonitor } = require('electron')
const { ipcMain } = require('electron')

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    useContentSize: true,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    nodeIntegration:true,
    resizable:false,
    frame:false,
    // transparent: true
  })

  // mainWindow.setIgnoreMouseEvents(true)
  mainWindow.setMenuBarVisibility(false)

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  ipcMain.on('LOGIN_STATUS', (event, arg) => {
    console.log('emit status received: '+arg) 
  })

  ipcMain.on('MINIMIZE_TO_TRAY', (event, arg) => {
    mainWindow.minimize();
  })

  ipcMain.on('AUTO_BREAK_EVENT', (event, arg) => {
    console.log('auto break detected')
    mainWindow.show();
  })

  ipcMain.on('NEW_MEETING_ADDED', (event, arg) => {
    console.log('new meeting detected')
    mainWindow.show();
  })

  ipcMain.on('MEETING_POPUP', (event,arg) => {
    mainWindow.show();
  })
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  // -------------- IMPORTANT: DO NOT DELETE --------------
  setInterval( () => {
    // console.log(powerMonitor.getSystemIdleTime())
    mainWindow.webContents.send('SYSTEM_IDLE_TIME', {'time': powerMonitor.getSystemIdleTime()})
  },1000)
  // -------------- IMPORTANT: DO NOT DELETE --------------

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
