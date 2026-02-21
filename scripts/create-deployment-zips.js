#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Use temp directory for staging (will be deleted after zipping)
const tempDir = join(projectRoot, '.deployment-temp');
const frontendDir = join(tempDir, 'frontend');
const backendDir = join(tempDir, 'backend');

console.log('📦 Creating deployment zip files...\n');

// Clean temp directory if it exists
if (existsSync(tempDir)) {
  console.log('🧹 Cleaning temp directory...');
  rmSync(tempDir, { recursive: true, force: true });
}

// Create temp directories
mkdirSync(frontendDir, { recursive: true });
mkdirSync(backendDir, { recursive: true });

try {
  // Copy frontend files (from docs/)
  console.log('📁 Copying frontend files...');
  const docsDir = join(projectRoot, 'docs');
  const publicHtaccess = join(projectRoot, 'public_html', '.htaccess');
  const isWindows = process.platform === 'win32';
  
  if (existsSync(docsDir)) {
    // Use robocopy on Windows, cp on Unix
    if (isWindows) {
      try {
        execSync(`robocopy "${docsDir}" "${frontendDir}" /E /XD node_modules .git /XF *.log /NFL /NDL /NJH /NJS`, { stdio: 'inherit', shell: true });
      } catch (error) {
        // Robocopy returns 0-7 for success, ignore exit code
        if (error.status > 7) {
          throw error;
        }
      }
    } else {
      execSync(`cp -r "${docsDir}"/* "${frontendDir}"/`, { stdio: 'inherit' });
    }
    
    // Copy .htaccess
    if (existsSync(publicHtaccess)) {
      if (isWindows) {
        execSync(`copy /Y "${publicHtaccess}" "${frontendDir}\\.htaccess"`, { stdio: 'inherit', shell: true });
      } else {
        execSync(`cp "${publicHtaccess}" "${frontendDir}/.htaccess"`, { stdio: 'inherit' });
      }
    }
    console.log('✅ Frontend files copied\n');
  } else {
    console.warn('⚠️  docs/ directory not found. Run npm run build first.\n');
  }

  // Copy backend files (from server/)
  console.log('📁 Copying backend files...');
  const serverDir = join(projectRoot, 'server');
  
  if (existsSync(serverDir)) {
    if (isWindows) {
      try {
        execSync(`robocopy "${serverDir}" "${backendDir}" /E /XD node_modules uploads .git /XF *.db *.log /NFL /NDL /NJH /NJS`, { stdio: 'inherit', shell: true });
      } catch (error) {
        // Robocopy returns 0-7 for success, ignore exit code
        if (error.status > 7) {
          throw error;
        }
      }
    } else {
      execSync(`cp -r "${serverDir}"/* "${backendDir}"/`, { stdio: 'inherit' });
    }
    console.log('✅ Backend files copied\n');
  } else {
    console.warn('⚠️  server/ directory not found.\n');
  }

  // Create zip files
  console.log('🗜️  Creating zip files...');
  
  // Frontend zip
  const frontendZip = join(projectRoot, 'Frontend.zip');
  if (existsSync(frontendDir)) {
    if (isWindows) {
      // Remove existing zip
      try {
        execSync(`del /F /Q "${frontendZip}"`, { stdio: 'ignore', shell: true });
      } catch {}
      // Create zip using PowerShell
      const frontendPath = frontendDir.replace(/\\/g, '/');
      const frontendZipPath = frontendZip.replace(/\\/g, '/');
      execSync(`powershell -Command "Compress-Archive -Path '${frontendPath}\\*' -DestinationPath '${frontendZipPath}' -Force"`, { stdio: 'inherit', shell: true });
    } else {
      execSync(`cd "${frontendDir}" && zip -r "${frontendZip}" .`, { stdio: 'inherit' });
    }
    console.log('✅ Frontend.zip created');
  }

  // Backend zip
  const backendZip = join(projectRoot, 'Backend.zip');
  if (existsSync(backendDir)) {
    if (isWindows) {
      // Remove existing zip
      try {
        execSync(`del /F /Q "${backendZip}"`, { stdio: 'ignore', shell: true });
      } catch {}
      // Create zip using PowerShell
      const backendPath = backendDir.replace(/\\/g, '/');
      const backendZipPath = backendZip.replace(/\\/g, '/');
      execSync(`powershell -Command "Compress-Archive -Path '${backendPath}\\*' -DestinationPath '${backendZipPath}' -Force"`, { stdio: 'inherit', shell: true });
    } else {
      execSync(`cd "${backendDir}" && zip -r "${backendZip}" .`, { stdio: 'inherit' });
    }
    console.log('✅ Backend.zip created');
  }

  // Clean up temp directory
  console.log('\n🧹 Cleaning up temp files...');
  rmSync(tempDir, { recursive: true, force: true });

  console.log('\n✅ Deployment zip files created successfully!');
  console.log(`   📦 Frontend.zip`);
  console.log(`   📦 Backend.zip`);

} catch (error) {
  console.error('❌ Error creating deployment zips:', error.message);
  process.exit(1);
}

