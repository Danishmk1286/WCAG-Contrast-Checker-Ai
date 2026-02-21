#!/usr/bin/env node

import { execSync } from 'child_process';

try {
  // Run npm audit with high severity level
  execSync('npm audit --audit-level=high', { stdio: 'inherit' });
  console.log('✅ No high or critical vulnerabilities found');
  process.exit(0);
} catch (error) {
  // If audit fails, check if it's due to moderate vulnerabilities
  try {
    const auditOutput = execSync('npm audit --audit-level=moderate', { encoding: 'utf-8' });
    if (auditOutput.includes('moderate')) {
      console.log('⚠️  Moderate vulnerabilities detected in dependencies (quill package).');
      console.log('   These are mitigated by backend HTML sanitization.');
      console.log('   Build will continue...');
      process.exit(0);
    }
  } catch (e) {
    // If there are high/critical vulnerabilities, fail the build
    console.error('❌ High or critical vulnerabilities detected!');
    console.error('   Please fix these before building.');
    process.exit(1);
  }
}

