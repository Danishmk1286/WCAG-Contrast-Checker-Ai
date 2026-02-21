/**
 * Diagnostic script to identify dev server issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 Diagnosing Dev Server Issues...\n');
console.log('='.repeat(60));

// Check 1: index.html exists
console.log('\n1. Checking index.html...');
const indexHtmlPath = path.join(projectRoot, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  console.log('   ✅ index.html exists');
  const indexContent = fs.readFileSync(indexHtmlPath, 'utf-8');
  if (indexContent.includes('<div id="root">')) {
    console.log('   ✅ Root div found');
  } else {
    console.log('   ❌ Root div NOT found!');
  }
  if (indexContent.includes('/src/main.tsx')) {
    console.log('   ✅ main.tsx script tag found');
  } else {
    console.log('   ❌ main.tsx script tag NOT found!');
  }
} else {
  console.log('   ❌ index.html NOT FOUND!');
}

// Check 2: main.tsx exists
console.log('\n2. Checking src/main.tsx...');
const mainTsxPath = path.join(projectRoot, 'src', 'main.tsx');
if (fs.existsSync(mainTsxPath)) {
  console.log('   ✅ main.tsx exists');
} else {
  console.log('   ❌ main.tsx NOT FOUND!');
}

// Check 3: App.tsx exists
console.log('\n3. Checking src/App.tsx...');
const appTsxPath = path.join(projectRoot, 'src', 'App.tsx');
if (fs.existsSync(appTsxPath)) {
  console.log('   ✅ App.tsx exists');
} else {
  console.log('   ❌ App.tsx NOT FOUND!');
}

// Check 4: package.json
console.log('\n4. Checking package.json...');
const packageJsonPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('   ✅ package.json exists');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  if (pkg.scripts && pkg.scripts.dev) {
    console.log(`   ✅ dev script found: ${pkg.scripts.dev}`);
  } else {
    console.log('   ❌ dev script NOT found!');
  }
} else {
  console.log('   ❌ package.json NOT FOUND!');
}

// Check 5: vite.config.ts
console.log('\n5. Checking vite.config.ts...');
const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  console.log('   ✅ vite.config.ts exists');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
  if (viteConfig.includes('port:')) {
    const portMatch = viteConfig.match(/port:\s*(\d+)/);
    if (portMatch) {
      console.log(`   ✅ Port configured: ${portMatch[1]}`);
    }
  }
} else {
  console.log('   ❌ vite.config.ts NOT FOUND!');
}

// Check 6: node_modules
console.log('\n6. Checking dependencies...');
const nodeModulesPath = path.join(projectRoot, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules exists');
  const reactPath = path.join(nodeModulesPath, 'react');
  if (fs.existsSync(reactPath)) {
    console.log('   ✅ React installed');
  } else {
    console.log('   ❌ React NOT installed! Run: npm install');
  }
} else {
  console.log('   ❌ node_modules NOT FOUND! Run: npm install');
}

// Check 7: Environment variables
console.log('\n7. Checking environment variables...');
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (envContent.includes('VITE_API_BASE')) {
    console.log('   ✅ VITE_API_BASE configured');
  } else {
    console.log('   ⚠️  VITE_API_BASE not set (will use defaults)');
  }
} else {
  console.log('   ⚠️  .env file not found (will use defaults)');
}

// Check 8: Port availability (basic check)
console.log('\n8. Port configuration...');
console.log('   ℹ️  Default Vite port: 5173');
console.log('   ℹ️  Configured port: 8080 (check vite.config.ts)');
console.log('   ⚠️  If port is in use, change it in vite.config.ts');

console.log('\n' + '='.repeat(60));
console.log('\n✅ Diagnosis complete!');
console.log('\nNext steps:');
console.log('1. If any ❌ errors found, fix them');
console.log('2. Run: npm install (if node_modules missing)');
console.log('3. Run: npm run dev');
console.log('4. Check browser console for errors');

