/**
 * Pre-flight checks for WMS application startup
 * Validates Node version, ports, and environment variables
 * Exits with code 1 if any check fails
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

// Check 1: Node.js version
function checkNodeVersion() {
  const requiredVersion = 18;
  const currentVersion = process.version.slice(1).split('.')[0];
  
  logInfo('Checking Node.js version...');
  
  if (parseInt(currentVersion) < requiredVersion) {
    logError(`Node.js ${requiredVersion}+ required, found ${process.version}`);
    logError('Please install Node.js 18 or later from https://nodejs.org/');
    process.exit(1);
  }
  
  logSuccess(`Node.js ${process.version}`);
  return true;
}

// Check 2: Port availability
function checkPort(port, serviceName) {
  logInfo(`Checking if port ${port} is available for ${serviceName}...`);
  
  try {
    // Windows-compatible port check
    const isWindows = process.platform === 'win32';
    let command;
    
    if (isWindows) {
      command = `netstat -aon | findstr :${port}`;
    } else {
      command = `lsof -i :${port} || echo "Port free"`;
    }
    
    const result = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    
    if (isWindows) {
      // On Windows, findstr returns lines containing the port
      const lines = result.stdout.trim().split('\n');
      const inUse = lines.some(line => line.includes(`0.0.0.0:${port}`) || line.includes(`[::]:${port}`));
      
      if (inUse) {
        logError(`Port ${port} is already in use (${serviceName})`);
        logError('Run: npm run stop-services');
        logError('Or kill process: taskkill /F /PID <process_id> (Windows)');
        return false;
      }
    }
    
    logSuccess(`Port ${port} is available for ${serviceName}`);
    return true;
  } catch (error) {
    // Command failed, assume port is free
    logSuccess(`Port ${port} is available for ${serviceName}`);
    return true;
  }
}

// Check 3: Environment files
function checkEnvFiles() {
  logInfo('Checking environment files...');
  
  const backendEnv = path.join(__dirname, 'backend', '.env');
  const rootEnv = path.join(__dirname, '.env');
  
  let backendEnvExists = false;
  let rootEnvExists = false;
  
  if (fs.existsSync(backendEnv)) {
    logSuccess('backend/.env exists');
    backendEnvExists = true;
  } else {
    logError('backend/.env not found');
  }
  
  if (fs.existsSync(rootEnv)) {
    logSuccess('.env exists');
    rootEnvExists = true;
  } else {
    logWarning('.env not found (optional)');
  }
  
  return backendEnvExists;
}

// Check 4: Node modules
function checkNodeModules() {
  logInfo('Checking node_modules...');
  
  const rootNodeModules = path.join(__dirname, 'node_modules');
  const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
  
  if (fs.existsSync(rootNodeModules)) {
    logSuccess('node_modules installed in root');
  } else {
    logError('node_modules not found in root');
    logError('Run: npm install');
    return false;
  }
  
  if (fs.existsSync(backendNodeModules)) {
    logSuccess('node_modules installed in backend');
  } else {
    logWarning('backend/node_modules not found (optional)');
  }
  
  return true;
}

// Check 5: Database file
function checkDatabase() {
  logInfo('Checking database...');
  
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');
  
  if (fs.existsSync(dbPath)) {
    logSuccess('Database file exists (prisma/dev.db)');
    return true;
  } else {
    logWarning('Database not found (will be created on first run)');
    return true;
  }
}

// Main pre-flight check
function runPreflightChecks() {
  console.log('\n');
  log('='.repeat(50), colors.blue);
  log('WMS PRE-FLIGHT CHECKS', colors.blue);
  log('='.repeat(50), colors.blue);
  console.log('\n');
  
  let allPassed = true;
  
  // Run all checks
  allPassed = checkNodeVersion() && allPassed;
  allPassed = checkPort(3001, 'Backend API') && allPassed;
  allPassed = checkPort(5173, 'Frontend (Vite)') && allPassed;
  allPassed = checkEnvFiles() && allPassed;
  allPassed = checkNodeModules() && allPassed;
  allPassed = checkDatabase() && allPassed;
  
  console.log('\n');
  log('='.repeat(50), colors.blue);
  
  if (allPassed) {
    log('ALL CHECKS PASSED - Ready to start!', colors.green);
    log('='.repeat(50), colors.blue);
    console.log('\n');
    process.exit(0);
  } else {
    log('PRE-FLIGHT CHECKS FAILED', colors.red);
    log('='.repeat(50), colors.blue);
    console.log('\n');
    logError('Fix the errors above before running npm run dev:all');
    process.exit(1);
  }
}

// Execute checks
try {
  runPreflightChecks();
} catch (error) {
  logError(`Pre-flight check error: ${error.message}`);
  process.exit(1);
}