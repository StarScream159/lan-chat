const { app, BrowserWindow, ipcMain, screen, Menu, Tray, application } = require('electron');
const path = require('path');
const appSettings  = require('electron-settings');
const AutoLaunch = require('auto-launch');

const isMac = process.platform === 'darwin';
let menuTemplate;
let tray;
let mainWindow = null;
let isQuiting;
let lanChatAutoLauncher = new AutoLaunch({
  name: 'Lan Chat',
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

function setAppDefaults() {
  if (!appSettings.has('chat.Settings')) {
    var defaults = {host: '0.0.0.0', port: 27900, startWithWindows: false, minimizeToTray: true, startMinimized: false, showTray: true, clipBoardLinks: true, clipBoardNotifications: true};
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
      width: 930,
      height: 670,
      useContentSize: true
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
    minWidth: 440,
    minHeight: 600,
    background: '#E6EAEA',
    webPreferences: {
      nodeIntegration: true
    },
    icon: path.join(__dirname, 'img/icons/png/64x64.png'),
    titleBarStyle: 'hidden',
    frame: false
  };
  // Create the browser window.
  mainWindow = new BrowserWindow(windowOptions);

  // 
  mainWindowStateKeeper.track(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // maybe hide the window
  if (appSettings.get('chat.Settings').startMinimized) {
    mainWindow.hide();
  }

  mainWindow.on('minimize',function(event){
    event.preventDefault();
    if (appSettings.get('chat.Settings').minimizeToTray) {
      mainWindow.hide();
    }
  });
  mainWindow.on('close', function (event) {
    if(!isQuiting){
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
};

const setupTray = () => {
  tray = new Tray(path.join(__dirname, 'img/icons/png/32x32.png'));
  tray.setToolTip('LAN Chat');
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Show', click: function () {
        mainWindow.show();
      }
    },
    {type:'separator'},
    {
      label: 'Quit', click: function () {
        isQuiting = true;
        app.quit();
      }
    }
  ]));
  tray.on('double-click', function() {
    mainWindow.show();
  });
};

const destroyTray = () => {
  tray.destroy();
};

const getMenuEnabledStatus = (menuId) => {
  var chatSettings = appSettings.get('chat.Settings');
  var ret = true;
  
  switch(menuId) {
    case 'show-tray':
      if (chatSettings.minimizeToTray) {
        ret = false;
      }
      break;
    case 'start-minimized':
      if (!chatSettings.minimizeToTray) {
        ret = false;
      }
      break;
  }

  return ret;
};

const getMenuCheckedStatus = (menuId) => {
  var chatSettings = appSettings.get('chat.Settings');
  var ret;
  switch(menuId) {
    case 'start-up':
      ret = chatSettings.startWithWindows;
      break;
    case 'minimize-tray':
      ret = chatSettings.minimizeToTray;
      break;
    case 'show-tray':
      ret = chatSettings.showTray;
      break;
    case 'start-minimized':
      ret = chatSettings.startMinimized;
      break;
    case 'clipboard-enabled':
      ret = chatSettings.clipBoardLinks;
      break;
    case 'clipboard-notifications':
      ret = chatSettings.clipBoardNotifications;
      break;
  }
  return ret;
};

const setMenuDefault = () => {
  menuTemplate = [
    {
      label: 'Chat',
      submenu: [
        {
          label:'Reload Application', 
          role:'forceReload',
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          id: 'start-up',
          label:'Start with windows',
          type:'checkbox',
          checked: getMenuCheckedStatus('start-up'),
          click: (menuItem, browserWindow, event) => {
            var chatSettings = appSettings.get('chat.Settings');
            chatSettings.startWithWindows = menuItem.checked;
            appSettings.set('chat.Settings', chatSettings);
            menuItem.checked = !menuItem.checked;
            if (chatSettings.startWithWindows) {
              lanChatAutoLauncher.enable();
            }else{
              lanChatAutoLauncher.disable();
            }
          }
        },
        { type: 'separator' },
        {
          id: 'minimize-tray',
          label:'Minimize to tray',
          type:'checkbox',
          checked: getMenuCheckedStatus('minimize-tray'),
          click: (menuItem, browserWindow, event) => {
            var chatSettings = appSettings.get('chat.Settings');
            chatSettings.minimizeToTray = menuItem.checked;
            appSettings.set('chat.Settings', chatSettings);
            menuItem.checked = !menuItem.checked;
            if (chatSettings.minimizeToTray) {
              Menu.getApplicationMenu().getMenuItemById('start-minimized').enabled = true;
              Menu.getApplicationMenu().getMenuItemById('show-tray').enabled = false;
              Menu.getApplicationMenu().getMenuItemById('show-tray').checked = true;
              if (!chatSettings.showTray) {
                setupTray();
                chatSettings.showTray = true;
                appSettings.set('chat.Settings', chatSettings);
              }
            }else{
              Menu.getApplicationMenu().getMenuItemById('start-minimized').enabled = false;
              Menu.getApplicationMenu().getMenuItemById('start-minimized').checked = false;
              Menu.getApplicationMenu().getMenuItemById('show-tray').enabled = true;

              chatSettings.startMinimized = false;
              appSettings.set('chat.Settings', chatSettings);
            }
          }
        },
        {
          id: 'start-minimized',
          label:'Start minimized',
          type:'checkbox',
          checked: getMenuCheckedStatus('start-minimized'),
          enabled: getMenuEnabledStatus('start-minimized'),
          click: (menuItem, browserWindow, event) => {
            var chatSettings = appSettings.get('chat.Settings');
            chatSettings.startMinimized = menuItem.checked;
            appSettings.set('chat.Settings', chatSettings);
            menuItem.checked = !menuItem.checked;
          }
        },
        {
          id: 'show-tray',
          label:'Show tray icon',
          type:'checkbox',
          checked: getMenuCheckedStatus('show-tray'),
          enabled: getMenuEnabledStatus('show-tray'),
          click: (menuItem, browserWindow, event) => {
            var chatSettings = appSettings.get('chat.Settings');
            chatSettings.showTray = menuItem.checked;
            appSettings.set('chat.Settings', chatSettings);
            menuItem.checked = !menuItem.checked;

            if (chatSettings.showTray) {
              setupTray();
            }else{
              destroyTray();
            }
          }
        },
        {
          id: 'clipboard-enabled',
          label:'Auto copy links to clipboard',
          type:'checkbox',
          checked: getMenuCheckedStatus('clipboard-enabled'),
          click: (menuItem, browserWindow, event) => {
            var chatSettings = appSettings.get('chat.Settings');
            chatSettings.clipBoardLinks = menuItem.checked;
            appSettings.set('chat.Settings', chatSettings);
            menuItem.checked = !menuItem.checked;
          }
        },
        {
          id: 'clipboard-notifications',
          label:'Display notification on clipboard changes',
          type:'checkbox',
          checked: getMenuCheckedStatus('clipboard-notifications'),
          click: (menuItem, browserWindow, event) => {
            var chatSettings = appSettings.get('chat.Settings');
            chatSettings.clipBoardNotifications = menuItem.checked;
            appSettings.set('chat.Settings', chatSettings);
            menuItem.checked = !menuItem.checked;
          }
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Online Documentation',
          icon: path.join(__dirname, 'img/github.png'),
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://electronjs.org');
          }
        },
        {
          label: 'About',
          click() {
            mainWindow.webContents.send('open-modal', 'about-modal');
          }
        }
      ]
    }
  ];
};

const setApplicationMenu = () => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
};

const appInit = () => {
  app.setAppUserModelId('lan-chat');
  setAppDefaults();
  createMainWindow();
  setupTray();
  setMenuDefault();
  setApplicationMenu();
};

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

app.on('before-quit', function () {
  isQuiting = true;
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
