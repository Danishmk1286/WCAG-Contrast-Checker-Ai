#!/usr/bin/env node

/**
 * Backend Configuration Test Script
 * 
 * This script tests if the backend is properly configured and can run.
 * Use this to diagnose issues on cPanel hosting.
 * 
 * Usage: node test-backend.js
 */

import { existsSync, readFileSync, accessSync, constants } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n' + '='.repeat(60));
console.log('🧪 Backend Configuration Test');
console.log('='.repeat(60));

let errors = [];
let warnings = [];
let success = [];

// Test 1: Node.js Version
console.log('\n📊 Node.js Version Check:');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
console.log(`   Version: ${nodeVersion}`);
if (majorVersion >= 18) {
  success.push('Node.js version is 18+ (recommended)');
  console.log('   ✅ Node.js version is compatible');
} else if (majorVersion >= 16) {
  warnings.push('Node.js version is 16+ (may work but 18+ recommended)');
  console.log('   ⚠️  Node.js version is 16+ (18+ recommended)');
} else {
  errors.push('Node.js version is too old (16+ required)');
  console.log('   ❌ Node.js version is too old (16+ required)');
}

// Test 2: Package.json
console.log('\n📦 Package.json Check:');
const packageJsonPath = join(__dirname, 'package.json');
if (existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    console.log(`   ✅ package.json found`);
    console.log(`   Name: ${packageJson.name}`);
    console.log(`   Version: ${packageJson.version}`);
    console.log(`   Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
    success.push('package.json exists and is valid');
  } catch (error) {
    errors.push(`package.json is invalid: ${error.message}`);
    console.log(`   ❌ package.json is invalid: ${error.message}`);
  }
} else {
  errors.push('package.json not found');
  console.log('   ❌ package.json not found');
}

// Test 3: Dependencies (node_modules)
console.log('\n📚 Dependencies Check:');
const nodeModulesPath = join(__dirname, 'node_modules');
if (existsSync(nodeModulesPath)) {
  const requiredDeps = ['express', 'better-sqlite3', 'jsonwebtoken', 'bcryptjs'];
  let missingDeps = [];
  
  requiredDeps.forEach(dep => {
    const depPath = join(nodeModulesPath, dep);
    if (!existsSync(depPath)) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length === 0) {
    success.push('All required dependencies are installed');
    console.log('   ✅ All required dependencies are installed');
  } else {
    errors.push(`Missing dependencies: ${missingDeps.join(', ')}`);
    console.log(`   ❌ Missing dependencies: ${missingDeps.join(', ')}`);
    console.log('   💡 Run: npm install --production');
  }
} else {
  errors.push('node_modules directory not found');
  console.log('   ❌ node_modules directory not found');
  console.log('   💡 Run: npm install --production');
}

// Test 4: Environment File
console.log('\n⚙️  Environment Configuration:');
const projectRoot = dirname(__dirname);
const privateEnvPath = resolve(projectRoot, 'private/.env');
const localEnvPath = join(__dirname, '.env');
const envPath = existsSync(privateEnvPath) ? privateEnvPath : localEnvPath;

if (existsSync(envPath)) {
  success.push('.env file exists');
  console.log(`   ✅ .env file found: ${envPath}`);
  
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const hasJWT = envContent.includes('JWT_SECRET');
    const hasPort = envContent.includes('PORT');
    
    if (hasJWT && hasPort) {
      success.push('.env file contains required variables');
      console.log('   ✅ .env contains JWT_SECRET and PORT');
    } else {
      warnings.push('.env file may be missing some variables');
      console.log('   ⚠️  .env may be missing some variables');
    }
  } catch (error) {
    warnings.push(`Could not read .env: ${error.message}`);
    console.log(`   ⚠️  Could not read .env: ${error.message}`);
  }
} else {
  warnings.push('.env file not found (using defaults)');
  console.log('   ⚠️  .env file not found (will use defaults)');
  console.log('   💡 Create .env file with: PORT, JWT_SECRET, etc.');
}

// Test 5: Database Directory
console.log('\n💾 Database Check:');
const dbPath = existsSync(resolve(projectRoot, 'private'))
  ? resolve(projectRoot, 'private/cms.db')
  : join(__dirname, 'cms.db');

console.log(`   Database Path: ${dbPath}`);
if (existsSync(dbPath)) {
  try {
    accessSync(dbPath, constants.R_OK | constants.W_OK);
    success.push('Database file exists and is accessible');
    console.log('   ✅ Database file exists and is accessible');
  } catch (error) {
    errors.push(`Database file not accessible: ${error.message}`);
    console.log(`   ❌ Database file not accessible: ${error.message}`);
  }
} else {
  warnings.push('Database file does not exist (will be created on first run)');
  console.log('   ⚠️  Database file does not exist (will be created on first run)');
}

// Test 6: Uploads Directory
console.log('\n📁 Uploads Directory Check:');
const uploadsDir = existsSync(resolve(projectRoot, 'private'))
  ? resolve(projectRoot, 'private/uploads')
  : join(__dirname, 'uploads');

console.log(`   Uploads Path: ${uploadsDir}`);
if (existsSync(uploadsDir)) {
  try {
    accessSync(uploadsDir, constants.W_OK);
    success.push('Uploads directory exists and is writable');
    console.log('   ✅ Uploads directory exists and is writable');
  } catch (error) {
    errors.push(`Uploads directory not writable: ${error.message}`);
    console.log(`   ❌ Uploads directory not writable: ${error.message}`);
    console.log('   💡 Set permissions: chmod 755 uploads');
  }
} else {
  warnings.push('Uploads directory does not exist (will be created on first run)');
  console.log('   ⚠️  Uploads directory does not exist (will be created on first run)');
}

// Test 7: Server File
console.log('\n🚀 Server File Check:');
const serverPath = join(__dirname, 'server.js');
if (existsSync(serverPath)) {
  success.push('server.js exists');
  console.log('   ✅ server.js found');
} else {
  errors.push('server.js not found');
  console.log('   ❌ server.js not found');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`\n✅ Success: ${success.length}`);
success.forEach(msg => console.log(`   ✅ ${msg}`));

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings: ${warnings.length}`);
  warnings.forEach(msg => console.log(`   ⚠️  ${msg}`));
}

if (errors.length > 0) {
  console.log(`\n❌ Errors: ${errors.length}`);
  errors.forEach(msg => console.log(`   ❌ ${msg}`));
  console.log('\n💡 Fix the errors above before starting the server.');
  process.exit(1);
} else {
  console.log('\n✅ All critical checks passed!');
  console.log('🚀 You can start the server with: npm start');
  process.exit(0);
}


