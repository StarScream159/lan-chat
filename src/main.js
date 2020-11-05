const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const appSettings  = require('electron-settings');

let mainWindow = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

function setAppDefaults() {
  if (!appSettings.has('chat.Settings')) {
    var defaults = {host: '0.0.0.0', port: 27900, clipBoardLinks: true};
    appSettings.set('chat.Settings', defaults);
  }
  if (!appSettings.has('chat.Scanner')) {
    var defaults = {concurrency: 750, timeout: 500};
    appSettings.set('chat.Scanner', defaults);
  }
}

function windowStateKeeper(windowName) {
  let window, windowState;
  
  function setBounds() {
    // Restore from appSettings
    if (appSettings.has(`windowState.${windowName}`)) {
      windowState = appSettings.get(`windowState.${windowName}`);

      // we also need to check if the screen x and y
      // would end up on is available, and if not fix it+
      // app is ready at this point, we can use screen
      let positionIsValid = false;
      for (let display of screen.getAllDisplays()) {
        let lowestX = display.bounds.x;
        let highestX = lowestX + display.bounds.width;

        let lowestY = display.bounds.y;
        let highestY = lowestY + display.bounds.height;
        if (lowestX < windowState.x && windowState.x < highestX && lowestY < windowState.y && windowState.y < highestY) {
          positionIsValid = true;
        }
      }
      if (!positionIsValid) {
        // window is outside of bounds, set some defaults
        windowState.x = 10;
        windowState.y = 10;
      }

      return;
    }
    // Default
    windowState = {
      x: undefined,
      y: undefined,
      width: 1000,
      height: 800,
    };
  }
  function saveState() {
    if (!windowState.isMaximized) {
      windowState = window.getBounds();
    }
    windowState.isMaximized = window.isMaximized();
    appSettings.set(`windowState.${windowName}`, windowState);
  }
  function track(win) {
    window = win;
    ['resize', 'move', 'close'].forEach(event => {
      win.on(event, saveState);
    });
  }
  setBounds();
  return({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    isMaximized: windowState.isMaximized,
    track,
  });
}

const createMainWindow = () => {
  const mainWindowStateKeeper = windowStateKeeper('main');

  const windowOptions = {
    title: 'LAN Chat',
    x: mainWindowStateKeeper.x,
    y: mainWindowStateKeeper.y,
    width: mainWindowStateKeeper.width,
    height: mainWindowStateKeeper.height,
    webPreferences: {
      nodeIntegration: true
    }
  };
  // Create the browser window.
  mainWindow = new BrowserWindow(windowOptions);

  // 
  mainWindowStateKeeper.track(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // set the menu
  var menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label:'Settings',
          click() {
            console.log('open settings');
          }
        },
        {type:'separator'},
        {
          label:'Exit', 
          click() {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Online Documentation',
        },
        {
          label: 'About'
        }
      ]
    }
  ]);
  //Menu.setApplicationMenu(menu);
};

const appInit = () => {
  createMainWindow();
  setAppDefaults();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', appInit);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
