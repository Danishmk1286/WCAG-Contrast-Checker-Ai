#!/usr/bin/env node
/**
 * Cron job script for periodic SEO and accessibility scanning
 * 
 * This script should be run via cPanel cron jobs:
 * 0 2 * * * /usr/bin/node /path/to/server/cron-scanner.js
 * 
 * Runs daily at 2 AM to scan the site for SEO and accessibility issues
 */

import { scanSite, getSitemapUrls, BASE_URL } from './scanner.js';
import { initDatabase, contrastChecks } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
initDatabase();

// Log file path
const logsDir = path.resolve(__dirname, '..', 'private', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logFile = path.join(logsDir, 'scanner-cron.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(logFile, logMessage);
}

async function runScan() {
  log('Starting scheduled SEO and accessibility scan...');
  
  try {
    // Get pages to scan
    const pages = await getSitemapUrls();
    log(`Found ${pages.length} pages to scan`);

    // Scan pages (limit to 50 for cron job performance)
    const scanResults = await scanSite(pages.slice(0, 50));
    
    let successCount = 0;
    let errorCount = 0;
    let seoIssues = 0;
    let accessibilityIssues = 0;

    scanResults.forEach(result => {
      if (result.error || result.status !== 200) {
        errorCount++;
      } else {
        successCount++;
        if (result.seo && result.seo.issues) {
          seoIssues += result.seo.issues.length;
        }
        if (result.accessibility && result.accessibility.errors) {
          accessibilityIssues += result.accessibility.errors.length;
        }
      }
    });

    log(`Scan completed: ${successCount} successful, ${errorCount} errors`);
    log(`Found ${seoIssues} SEO issues and ${accessibilityIssues} accessibility issues`);
    log('Scan finished successfully');
  } catch (error) {
    log(`Scan failed with error: ${error.message}`);
    log(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Run the scan
runScan().then(() => {
  process.exit(0);
}).catch((error) => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});

