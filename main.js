const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const readline = require('readline');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  globalShortcut.register('CommandOrControl+H', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  const filePath = path.join(os.homedir(), 'AppData', 'Roaming', '.minecraft', 'logs', 'latest.log');

  let lastSize = 0;

  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    lastSize = stats.size;
  });

  const watcher = chokidar.watch(filePath, {
    persistent: true,
    usePolling: true,
    interval: 100,
  });

  const processNewLines = (start, end) => {
    const readStream = fs.createReadStream(filePath, {
      start: start,
      end: end,
    });

    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      mainWindow.webContents.send('new-log-line', line);
    });
  };

  watcher.on('change', (path) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        console.error(err);
        return;
      }

      const currentSize = stats.size;

      if (currentSize > lastSize) {
        processNewLines(lastSize, currentSize - 1);
        lastSize = currentSize;
      }
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('control-window', (event, action) => {
  if (action === 'minimize') {
    mainWindow.minimize();
  } else if (action === 'close') {
    app.quit();
  }
});
