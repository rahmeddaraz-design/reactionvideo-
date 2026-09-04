const { app, BrowserWindow, session, shell } = require('electron');
const path = require('path');

// Disable hardware acceleration if running on low-spec VM, but default enabled for GPU canvas & video
// app.disableHardwareAcceleration();

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#020617', // slate-950
    title: 'Ahmed Reaction Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  // Automatically approve camera and microphone permissions inside the desktop executable
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'camera', 'microphone', 'display-capture', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
      return;
    }
    callback(false);
  });

  // Automatically grant device permissions (for multi-camera and audio source enumeration)
  if (session.defaultSession.setDevicePermissionHandler) {
    session.defaultSession.setDevicePermissionHandler((details) => {
      if (details.deviceType === 'camera' || details.deviceType === 'microphone') {
        return true;
      }
      return false;
    });
  }

  // Handle external links (e.g. documentation, Node.js links) in the user's default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Load the built Vite distribution file or local dev server
  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
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
