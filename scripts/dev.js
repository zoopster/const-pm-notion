#!/usr/bin/env node

/**
 * Development script with enhanced logging and hot reload
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Set development environment
process.env.NODE_ENV = 'development';
process.env.LOG_LEVEL = 'debug';

console.log('🚀 Starting Construction PM in development mode...');
console.log('📁 Working directory:', process.cwd());
console.log('🔧 Environment:', process.env.NODE_ENV);

// Start the application with --watch flag
const child = spawn('node', ['--watch', 'index.js'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('close', (code) => {
  console.log(`\n👋 Application exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});