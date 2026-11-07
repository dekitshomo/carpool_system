const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

console.log('\n===============================================================');
console.log('🚗 STARTING STUDENT CARPOOL SYSTEM (BACKEND + FRONTEND)...');
console.log('===============================================================\n');

const nodeExec = process.execPath;
const backendPath = path.resolve(__dirname, 'backend', 'src', 'server.js');
const frontendDir = path.resolve(__dirname, 'frontend');
const vitePath = path.resolve(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');
const backendPort = process.env.PORT || '5000';
const frontendPort = process.env.FRONTEND_PORT || '3000';

let backend = null;
let frontend = null;
let shuttingDown = false;
let ready = false;
let startupTimer;

function isBackendHealthy() {
  return isHttpReady(backendPort, '/api/health');
}

function isFrontendReady() {
  return isHttpReady(frontendPort, '/');
}

function isHttpReady(port, requestPath) {
  return new Promise((resolve) => {
    const request = http.get(
      { hostname: 'localhost', port, path: requestPath, timeout: 1500 },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      }
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.on('error', () => resolve(false));
  });
}

function shutdown(exitCode, message) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(startupTimer);
  process.exitCode = exitCode;

  if (message) console.error(message);

  for (const child of [backend, frontend]) {
    if (child && child.exitCode === null && !child.killed) child.kill();
  }
}

function announceReady() {
  if (ready || shuttingDown) return;
  ready = true;
  clearTimeout(startupTimer);

  console.log('\n===============================================================');
  console.log('🎉 SYSTEM READY & RUNNING!');
  console.log(`🌐 Web Application:   http://localhost:${frontendPort}`);
  console.log(`🔌 Backend API:       http://localhost:${backendPort}`);
  console.log(`👉 Open http://localhost:${frontendPort} in your browser to use the app!`);
  if (backend || frontend) {
    console.log('👉 Press Ctrl+C in this terminal to stop services started by this command.');
  } else {
    console.log('✅ Both services were already running; no duplicate servers were started.');
  }
  console.log('===============================================================\n');
}

async function handleBackendExit(code, signal) {
  if (shuttingDown) return;

  if (await isBackendHealthy()) {
    backend = null;
    console.warn(`\n⚠️ Backend process exited, but a healthy backend is already available on port ${backendPort}; reusing it.`);
    return;
  }

  const reason = signal ? `signal ${signal}` : `exit code ${code}`;
  shutdown(
    code === 0 ? 1 : (code || 1),
    `\n❌ Backend stopped unexpectedly (${reason}). Backend port: ${backendPort}.`
  );
}

async function start() {
  const backendAlreadyRunning = await isBackendHealthy();
  const frontendAlreadyRunning = await isFrontendReady();

  if (backendAlreadyRunning) {
    console.log(`✅ Reusing healthy backend at http://localhost:${backendPort}`);
  } else {
    backend = spawn(nodeExec, [backendPath], {
      stdio: 'inherit',
      env: { ...process.env, PORT: backendPort }
    });
    backend.on('error', (err) => shutdown(1, `❌ Could not start backend: ${err.message}`));
    backend.on('exit', handleBackendExit);
  }

  if (frontendAlreadyRunning) {
    console.log(`✅ Reusing frontend at http://localhost:${frontendPort}`);
  } else {
    frontend = spawn(nodeExec, [vitePath, '--port', frontendPort, '--strictPort'], {
      cwd: frontendDir,
      stdio: 'inherit'
    });
    frontend.on('error', (err) => shutdown(1, `❌ Could not start frontend: ${err.message}`));
    frontend.on('exit', (code, signal) => {
      if (shuttingDown) return;
      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      shutdown(code === 0 ? 1 : (code || 1), `❌ Frontend stopped unexpectedly (${reason}).`);
    });
  }

  const deadline = Date.now() + 15000;
  const waitUntilReady = async () => {
    if (shuttingDown) return;

    if (await isBackendHealthy() && await isFrontendReady()) {
      announceReady();
      return;
    }

    if (Date.now() >= deadline) {
      shutdown(1, `❌ Backend did not become healthy on port ${backendPort} within 15 seconds.`);
      return;
    }

    setTimeout(waitUntilReady, 300);
  };

  startupTimer = setTimeout(() => {
    shutdown(1, `❌ Backend did not become healthy on port ${backendPort} within 15 seconds.`);
  }, 15000);
  waitUntilReady();
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Student Carpool servers...');
  shutdown(0);
});
process.on('SIGTERM', () => shutdown(0));

start().catch((err) => shutdown(1, `❌ Could not start Student Carpool: ${err.message}`));
