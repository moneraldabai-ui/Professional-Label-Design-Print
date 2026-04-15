/**
 * Label Studio Pro - System Tray Launcher
 * Runs the Vite dev server in the background and provides a system tray icon.
 */
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const SysTray = require('systray2').default;

const PROJECT_DIR = __dirname;
const PORT = 3001;
const URL = `http://localhost:${PORT}`;
const ICO_PATH = path.join(PROJECT_DIR, 'public', 'icon.ico');
const PID_FILE = path.join(PROJECT_DIR, '.server.pid');

let serverProcess = null;
let systray = null;

// Read icon as base64
function getIconBase64() {
  try {
    return fs.readFileSync(ICO_PATH).toString('base64');
  } catch {
    // Fallback: 1x1 transparent ICO if icon file missing
    return 'AAABAAEAAQEAAAEAIAAwAAAAFgAAACgAAAABAAAAAgAAAAEAIAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8A';
  }
}

// Check if port is already in use (try IPv6 first, then IPv4)
function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => {
      // Try IPv4 fallback
      const socket4 = new net.Socket();
      socket4.setTimeout(1000);
      socket4.on('connect', () => { socket4.destroy(); resolve(true); });
      socket4.on('timeout', () => { socket4.destroy(); resolve(false); });
      socket4.on('error', () => resolve(false));
      socket4.connect(port, '127.0.0.1');
    });
    socket.connect(port, '::1');
  });
}

// Wait for server to become available
function waitForServer(timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > timeout) {
        return reject(new Error('Server start timeout'));
      }
      isPortInUse(PORT).then((up) => {
        if (up) resolve();
        else setTimeout(check, 500);
      });
    }
    check();
  });
}

// Open URL in default browser
function openBrowser() {
  exec(`start "" "${URL}"`, { cwd: PROJECT_DIR });
}

// Kill server process tree
function killServer() {
  return new Promise((resolve) => {
    if (serverProcess && !serverProcess.killed) {
      const pid = serverProcess.pid;
      // Use taskkill to kill the process tree (node + vite child processes)
      exec(`taskkill /pid ${pid} /t /f`, (err) => {
        serverProcess = null;
        cleanPidFile();
        resolve();
      });
    } else {
      // Try to clean up by PID file
      cleanByPidFile().then(resolve);
    }
  });
}

function writePidFile(pid) {
  try { fs.writeFileSync(PID_FILE, String(pid)); } catch {}
}

function cleanPidFile() {
  try { fs.unlinkSync(PID_FILE); } catch {}
}

function cleanByPidFile() {
  return new Promise((resolve) => {
    try {
      const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
      if (pid) {
        exec(`taskkill /pid ${pid} /t /f`, () => {
          cleanPidFile();
          resolve();
        });
        return;
      }
    } catch {}
    cleanPidFile();
    resolve();
  });
}

// Start the Vite dev server
function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
      cwd: PROJECT_DIR,
      stdio: 'ignore',
      windowsHide: true,
    });

    writePidFile(serverProcess.pid);

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err.message);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.error(`Server exited with code ${code}`);
      }
      serverProcess = null;
      cleanPidFile();
    });

    waitForServer()
      .then(resolve)
      .catch(reject);
  });
}

// Restart the dev server
async function restartServer() {
  await killServer();
  // Small delay to ensure port is freed
  await new Promise((r) => setTimeout(r, 1000));
  await startServer();
}

// Create and show the system tray
function createTray() {
  const icon = getIconBase64();

  systray = new SysTray({
    menu: {
      icon: icon,
      title: '',
      tooltip: 'Label Studio Pro',
      items: [
        {
          title: 'Label Studio Pro',
          tooltip: 'Label Studio Pro',
          enabled: false,
        },
        { title: '', tooltip: '', enabled: false }, // separator
        {
          title: 'Open App',
          tooltip: 'Open in browser',
          enabled: true,
        },
        {
          title: 'Restart Server',
          tooltip: 'Restart the dev server',
          enabled: true,
        },
        { title: '', tooltip: '', enabled: false }, // separator
        {
          title: 'Stop & Exit',
          tooltip: 'Stop server and exit',
          enabled: true,
        },
      ],
    },
    debug: false,
    copyDir: false,
  });

  systray.onClick((action) => {
    switch (action.seq_id) {
      case 2: // Open App
        openBrowser();
        break;
      case 3: // Restart Server
        console.log('Restarting server...');
        restartServer()
          .then(() => {
            console.log('Server restarted.');
            openBrowser();
          })
          .catch((err) => console.error('Restart failed:', err.message));
        break;
      case 5: // Stop & Exit
        shutdown();
        break;
    }
  });
}

// Clean shutdown
async function shutdown() {
  console.log('Shutting down...');
  await killServer();
  if (systray) {
    systray.kill(false);
  }
  process.exit(0);
}

// Handle process signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

// Main
async function main() {
  console.log('Label Studio Pro - Starting...');

  // Check if server is already running
  const alreadyRunning = await isPortInUse(PORT);

  if (alreadyRunning) {
    console.log(`Port ${PORT} already in use. Assuming server is running.`);
  } else {
    console.log('Starting Vite dev server...');
    try {
      await startServer();
      console.log('Server started on ' + URL);
    } catch (err) {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    }
  }

  // Create tray icon
  createTray();

  // Open browser after a short delay for tray to initialize
  setTimeout(openBrowser, 1500);

  console.log('Tray icon active. Right-click to see menu.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
