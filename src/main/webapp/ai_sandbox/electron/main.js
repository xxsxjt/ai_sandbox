const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let ollamaProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });

  // 加载 index.html
  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  // 拦截外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 开发模式打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function checkOllamaRunning() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get('http://localhost:11434', () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startOllamaIfNeeded() {
  const isRunning = await checkOllamaRunning();
  if (!isRunning) {
    console.log('Starting Ollama service...');

    // 查找 ollama 可执行文件
    const possiblePaths = [
      'C:\\Users\\' + process.env.USERNAME + '\\scoop\\shims\\ollama.exe',
      'C:\\Program Files\\Ollama\\ollama.exe',
      'C:\\Program Files (x86)\\Ollama\\ollama.exe',
    ];

    let ollamaPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        ollamaPath = p;
        break;
      }
    }

    if (ollamaPath) {
      // 在后台启动 Ollama 服务
      ollamaProcess = spawn(ollamaPath, ['serve'], {
        detached: true,
        stdio: 'ignore',
        shell: false
      });

      ollamaProcess.unref();
      console.log('Ollama started');
    } else {
      console.log('Ollama not found in common locations');
    }
  } else {
    console.log('Ollama is already running');
  }
}

app.whenReady().then(async () => {
  // 启动 Ollama（如果需要）
  await startOllamaIfNeeded();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // 关闭 Ollama 进程
  if (ollamaProcess) {
    ollamaProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
