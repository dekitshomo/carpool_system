const { spawn } = require('node:child_process');
const path = require('node:path');

console.log('\n===============================================================');
console.log('🚗 STARTING STUDENT CARPOOL SYSTEM (BACKEND + FRONTEND)...');
console.log('===============================================================\n');

const nodeExec = process.execPath;
const backendPath = path.resolve(__dirname, 'backend', 'src', 'server.js');
const frontendDir = path.resolve(__dirname, 'frontend');
const vitePath = path.resolve(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

// 1. Start Express Backend (port 5000)
const backend = spawn(nodeExec, [backendPath], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '5000' }
});

// 2. Start Vite Frontend (port 3000) using direct node execution
const frontend = spawn(nodeExec, [vitePath], {
  cwd: frontendDir,
  stdio: 'inherit'
});

// Clean shutdown handler for Ctrl+C
function shutdown() {
  console.log('\n🛑 Shutting down Student Carpool servers...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

backend.on('error', (err) => {
  console.error('Backend process error:', err.message);
});

frontend.on('error', (err) => {
  console.error('Frontend process error:', err.message);
});

setTimeout(() => {
  console.log('\n===============================================================');
  console.log('🎉 SYSTEM READY & RUNNING!');
  console.log('🌐 Web Application:   http://localhost:3000');
  console.log('🔌 Backend API:       http://localhost:5000');
  console.log('👉 Open http://localhost:3000 in your browser to use the app!');
  console.log('👉 Press Ctrl+C in this terminal to stop both servers.');
  console.log('===============================================================\n');
}, 2500);
