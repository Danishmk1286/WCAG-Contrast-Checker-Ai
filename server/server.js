// CRITICAL: Load environment variables FIRST before any other imports
import dotenv from 'dotenv';

// Load .env file
dotenv.config();
dotenv.config({ path: process.cwd() + "/.env" });

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import sanitizeHtml from 'sanitize-html';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import cookieParser from 'cookie-parser';
import { body, param, validationResult } from 'express-validator';
import { randomUUID } from 'crypto';
import { initDatabase, blogPosts, users, securityUsers, emailLogs, analytics, passwordHistory, auditLogs, contrastChecks, closeDatabase } from './database.js';
import db from './database.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { scanSite, scanPage, getSitemapUrls, BASE_URL } from './scanner.js';
import { unlockAccount, getAccountStatus, listLockedAccounts, unlockAllAccounts } from './unlock-api.js';
import { performStartupSync, regenerateAllStaticContent, exportBlogsToFile } from './blog-sync.js';
// NOTE: exportBlogsToFile is a no-op (file writes removed per zero file output policy)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine project root: if we're in a 'server' subdirectory, go up one level; otherwise use current directory
const isInServerSubdir = path.basename(__dirname) === 'server';
const projectRoot = isInServerSubdir ? path.resolve(__dirname, '..') : __dirname;

// Additional .env paths already loaded at top of file
// This section is kept for logging purposes only
const privateEnvPath = path.resolve(projectRoot, 'private/.env');
const localEnvPath = path.join(__dirname, '.env');
const envPath = fs.existsSync(privateEnvPath) ? privateEnvPath : localEnvPath;

if (fs.existsSync(envPath)) {
  console.log(`✅ Additional .env file found: ${envPath}`);
} else {
  console.log('ℹ️  No additional .env files found (using system environment variables)');
}

const app = express();
// cPanel compatibility: Use PORT from environment or default to 3001
const PORT = process.env.PORT || process.env.NODE_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '1800000', 10); // 30 minutes
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const REQUIRE_EMAIL_2FA = process.env.REQUIRE_EMAIL_2FA === 'true';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_SECURE = (process.env.SMTP_SECURE || 'true') === 'true';
const SMTP_FROM_RAW = process.env.SMTP_FROM || SMTP_USER || 'no-reply@thecolorcontrastchecker.com';

// Extract just the email address from SMTP_FROM, handling "Name <email@example.com>" format
const SMTP_FROM_MATCH = SMTP_FROM_RAW.match(/<([^>]+)>$/);
const SMTP_FROM = SMTP_FROM_MATCH ? SMTP_FROM_MATCH[1] : SMTP_FROM_RAW;

// For debugging TLS issues: allows ignoring TLS certificate errors
const SMTP_IGNORE_TLS = process.env.SMTP_IGNORE_TLS === 'true';

// Force secure to true if port is 465, as 465 is implicitly SMTPS
const effectiveSmtpSecure = SMTP_PORT === 465 ? true : SMTP_SECURE;

// Google Analytics and Search Console configuration
const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || process.env.GA4_MEASUREMENT_ID || '';
const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID || '';
// Resolve GA service account key path (handle both absolute and relative paths)
let GA_SERVICE_ACCOUNT_KEY_PATH = process.env.GA_SERVICE_ACCOUNT_KEY_PATH || '';
if (GA_SERVICE_ACCOUNT_KEY_PATH && !path.isAbsolute(GA_SERVICE_ACCOUNT_KEY_PATH)) {
  // If relative path, resolve from project root
  GA_SERVICE_ACCOUNT_KEY_PATH = path.resolve(projectRoot, GA_SERVICE_ACCOUNT_KEY_PATH);
}
// Fallback to common locations if not set
if (!GA_SERVICE_ACCOUNT_KEY_PATH || !fs.existsSync(GA_SERVICE_ACCOUNT_KEY_PATH)) {
  const fallbackPaths = [
    path.resolve(__dirname, 'secure/ga-key.json'),
    path.resolve(projectRoot, 'private/ga4-service-account.json'),
    path.resolve(projectRoot, 'server/secure/ga-key.json'),
  ];
  for (const fallbackPath of fallbackPaths) {
    if (fs.existsSync(fallbackPath)) {
      GA_SERVICE_ACCOUNT_KEY_PATH = fallbackPath;
      console.log(`📁 Using GA key from fallback: ${fallbackPath}`);
      break;
    }
  }
}
const GSC_CLIENT_ID = process.env.GSC_CLIENT_ID || '';
const GSC_CLIENT_SECRET = process.env.GSC_CLIENT_SECRET || '';
const GSC_REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN || '';
// BASE_URL is imported from scanner.js

// Google Analytics Data API client initialization
let analyticsClient = null;
let BetaAnalyticsDataClient = null;

// Initialize GA Data API client (async, will be available after import)
(async () => {
  if (GA_SERVICE_ACCOUNT_KEY_PATH && GA_PROPERTY_ID) {
    // Verify file exists
    if (!fs.existsSync(GA_SERVICE_ACCOUNT_KEY_PATH)) {
      console.error('[GA] Error fetching dashboard data from GA4 Data API: ENOENT: no such file or directory, open', GA_SERVICE_ACCOUNT_KEY_PATH);
      console.warn('   GA key file not found at:', GA_SERVICE_ACCOUNT_KEY_PATH);
      console.warn('   Using fallback: SQLite');
      return;
    }
    
    try {
      const gaModule = await import("@google-analytics/data");
      BetaAnalyticsDataClient = gaModule.BetaAnalyticsDataClient;
      analyticsClient = new BetaAnalyticsDataClient({
        keyFile: GA_SERVICE_ACCOUNT_KEY_PATH
      });
      console.log('✅ Google Analytics Data API client initialized');
      console.log('   GA PROPERTY:', GA_PROPERTY_ID);
      console.log('   GA KEY PATH:', GA_SERVICE_ACCOUNT_KEY_PATH);
    } catch (error) {
      console.error('❌ Failed to initialize GA Data API client:', error.message);
      if (error.code === 'ENOENT') {
        console.error('   File not found:', GA_SERVICE_ACCOUNT_KEY_PATH);
      }
      console.error('   Using fallback: SQLite');
    }
  } else {
    console.warn('⚠️  GA Data API not configured. Service account key missing.');
    console.warn('   GA_PROPERTY_ID:', GA_PROPERTY_ID || 'NOT SET');
    console.warn('   GA_SERVICE_ACCOUNT_KEY_PATH:', GA_SERVICE_ACCOUNT_KEY_PATH || 'NOT SET');
    console.warn('   Using fallback: SQLite');
  }
})();

// ============================================
// STATIC BLOG REGENERATION HELPER
// ============================================
import { spawn } from 'child_process';

/**
 * Regenerate static blog content (JSON cache + HTML pages)
 * This runs asynchronously in the background after blog CRUD operations.
 * Ensures blogs are accessible even when the server is temporarily unavailable.
 */
function regenerateStaticBlogContent() {
  const startTime = Date.now();
  console.log('🔄 [Static] Triggering static blog content regeneration...');
  
  // Run both scripts in sequence using npm
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  
  const child = spawn(npmCmd, ['run', 'sync-blogs'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    shell: isWindows
  });
  
  let stdout = '';
  let stderr = '';
  
  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });
  
  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });
  
  child.on('close', (code) => {
    const duration = Date.now() - startTime;
    if (code === 0) {
      console.log(`✅ [Static] Blog content regenerated successfully (${duration}ms)`);
      // Log summary from stdout
      if (stdout.includes('posts cached') || stdout.includes('blog posts generated')) {
        console.log('   Static cache and HTML pages updated');
      }
    } else {
      console.error(`❌ [Static] Blog regeneration failed (exit code ${code}, ${duration}ms)`);
      if (stderr) {
        console.error('   Error:', stderr.trim().split('\n')[0]);
      }
    }
  });
  
  child.on('error', (error) => {
    console.error('❌ [Static] Failed to spawn regeneration process:', error.message);
  });
}

// ============================================
// STARTUP LOGGING & DIAGNOSTICS
// ============================================
console.log('\n' + '='.repeat(60));
console.log('🚀 CMS Backend Server Starting...');
console.log('='.repeat(60));

// Log Node.js and system information
console.log('\n📊 System Information:');
console.log(`   Node.js Version: ${process.version}`);
console.log(`   Platform: ${process.platform} (${process.arch})`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log(`   Server Directory: ${__dirname}`);
console.log(`   Project Root: ${projectRoot}`);

// Log environment configuration
console.log('\n⚙️  Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set (defaults to development)'}`);
console.log(`   PORT: ${PORT}`);
console.log(`   JWT_SECRET: ${JWT_SECRET === 'your-secret-key-change-in-production' ? '⚠️  DEFAULT (CHANGE IN PRODUCTION!)' : '✅ Set'}`);
console.log(`   BCRYPT_ROUNDS: ${BCRYPT_ROUNDS}`);
console.log(`   SESSION_TIMEOUT_MS: ${SESSION_TIMEOUT_MS}ms (${SESSION_TIMEOUT_MS / 60000} minutes)`);
console.log(`   TRUST_PROXY: ${TRUST_PROXY}`);
console.log(`   REQUIRE_EMAIL_2FA: ${REQUIRE_EMAIL_2FA}`);
console.log(`   SMTP_HOST: ${SMTP_HOST || '⚠️ Not Set'}`);
console.log(`   SMTP_PORT: ${SMTP_PORT}`);
console.log(`   SMTP_USER: ${SMTP_USER || '⚠️ Not Set'}`);
console.log(`   SMTP_FROM: ${SMTP_FROM} (Raw: ${SMTP_FROM_RAW})`);
console.log(`   SMTP_SECURE: ${SMTP_SECURE} (effective: ${effectiveSmtpSecure})`);
console.log(`   SMTP_IGNORE_TLS: ${SMTP_IGNORE_TLS}`);
console.log(`   GA_MEASUREMENT_ID: ${GA_MEASUREMENT_ID ? '✅ Set' : '⚠️ Not Set'}`);
console.log(`   GA_PROPERTY_ID: ${GA_PROPERTY_ID ? '✅ Set' : '⚠️ Not Set'}`);
console.log(`   GA_SERVICE_ACCOUNT_KEY_PATH: ${GA_SERVICE_ACCOUNT_KEY_PATH ? '✅ Set' : '⚠️ Not Set'}`);
console.log(`   GA Data API Client: ${analyticsClient ? '✅ Initialized' : '❌ Not Available (using SQLite fallback)'}`);
console.log(`   GSC_CLIENT_ID: ${GSC_CLIENT_ID ? '✅ Set' : '⚠️ Not Set'}`);
console.log(`   BASE_URL: ${BASE_URL}`);

// Check file system
console.log('\n📁 File System Checks:');
const dbPath = fs.existsSync(path.resolve(projectRoot, 'private'))
  ? path.resolve(projectRoot, 'private/cms.db')
  : path.join(__dirname, 'cms.db');
console.log(`   Database Path: ${dbPath}`);
console.log(`   Database Exists: ${fs.existsSync(dbPath) ? '✅ Yes' : '⚠️  No (will be created)'}`);

const uploadsDirPath = fs.existsSync(path.resolve(projectRoot, 'private'))
  ? path.resolve(projectRoot, 'private/uploads')
  : path.join(__dirname, 'uploads');
console.log(`   Uploads Directory: ${uploadsDirPath}`);
console.log(`   Uploads Directory Exists: ${fs.existsSync(uploadsDirPath) ? '✅ Yes' : '⚠️  No (will be created)'}`);
try {
  if (fs.existsSync(uploadsDirPath)) {
    fs.accessSync(uploadsDirPath, fs.constants.W_OK);
    console.log(`   Uploads Directory Writable: ✅ Yes`);
  } else {
    console.log(`   Uploads Directory Writable: N/A (will be created)`);
  }
} catch {
  console.log(`   Uploads Directory Writable: ❌ No`);
}

// Check dependencies
console.log('\n📦 Dependency Checks:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log(`   Package Name: ${packageJson.name}`);
  console.log(`   Package Version: ${packageJson.version}`);
  console.log(`   Dependencies Count: ${Object.keys(packageJson.dependencies || {}).length}`);
} catch (error) {
  console.log(`   ⚠️  Could not read package.json: ${error.message}`);
}

// Initialize database
console.log('\n💾 Database Initialization:');
try {
  initDatabase();
  console.log('   ✅ Database initialized successfully');
  
  // Perform blog synchronization on startup
  // This imports blogs from blog_export.json into database (one-time migration, no file generation)
  console.log('\n📚 Blog System Sync:');
  try {
    performStartupSync();
  } catch (syncError) {
    console.error('   ⚠️ Blog sync warning:', syncError.message);
    // Don't fail startup for sync errors
  }
} catch (error) {
  console.error(`   ❌ Database initialization failed: ${error.message}`);
  console.error(`   Stack: ${error.stack}`);
}

// Email transport (optional – falls back to console log if not configured)
let mailTransport = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  try {
    mailTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: effectiveSmtpSecure,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        // Do not fail on invalid certs, useful for self-signed or development environments
        rejectUnauthorized: !SMTP_IGNORE_TLS,
      },
    });
    console.log('\n📧 Email transport: ✅ Configured');
  } catch (error) {
    console.warn('\n📧 Email transport configuration failed:', error.message);
  }
} else {
  console.log('\n📧 Email transport: ⚠️ Not configured (codes will be logged to console)');
}

const sendEmail = async (to, subject, text) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 📧 Email send attempt:`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   SMTP Configured: ${mailTransport ? 'Yes' : 'No'}`);

  const smtpConfigured = !!mailTransport;

  if (!mailTransport) {
    console.log('   ⚠️  SMTP not configured - email will be logged only:');
    console.log(`   Email Content:\n${text}`);
    console.log(`   [${timestamp}] 📧 Email simulation completed (no actual email sent)`);

    // Log to database
    emailLogs.logEmail(to, subject, 'simulated', 'SMTP not configured', null, false);

    // Log to file
    writeEmailLog({
      timestamp,
      recipient: to,
      subject,
      status: 'simulated',
      error: 'SMTP not configured',
      smtpConfigured: false
    });

    return;
  }

  console.log(`   SMTP Host: ${SMTP_HOST}`);
  console.log(`   SMTP Port: ${SMTP_PORT}`);
  console.log(`   SMTP From: ${SMTP_FROM}`);

  try {
    const info = await mailTransport.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
    });

    const messageId = info.messageId || null;
    console.log(`   [${timestamp}] ✅ Email sent successfully`);
    console.log(`   Message ID: ${messageId || 'N/A'}`);

    // Log successful email to database
    emailLogs.logEmail(to, subject, 'sent', null, messageId, true);

    // Log to file
    writeEmailLog({
      timestamp,
      recipient: to,
      subject,
      status: 'sent',
      messageId: messageId || null,
      smtpConfigured: true
    });
  } catch (error) {
    const errorMessage = error.message || String(error);
    console.error(`   [${timestamp}] ❌ Email send failed:`, errorMessage);
    console.error(`   Error details:`, error);

    // Log failed email to database
    emailLogs.logEmail(to, subject, 'failed', errorMessage, null, true);

    // Log to file
    writeEmailLog({
      timestamp,
      recipient: to,
      subject,
      status: 'failed',
      error: errorMessage,
      smtpConfigured: true
    });

    throw error; // Re-throw so caller can handle it
  }
};

// Trust proxy setting
// Enable trust proxy if explicitly set OR if in production (cPanel/nginx behind proxy)
// This fixes express-rate-limit X-Forwarded-For header warnings
if (TRUST_PROXY || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  console.log('✅ Trust proxy enabled (required for rate limiting behind proxy)');
} else {
  console.log('ℹ️  Trust proxy disabled (development mode)');
}

// Security Middleware
const isDev = process.env.NODE_ENV !== 'production';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind requires inline styles
      scriptSrc: isDev
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:5173"] // Vite HMR in dev
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com"], // Needed for React + Google Analytics (only loaded after consent)
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: isDev
        ? ["'self'", "ws://localhost:5173"] // Vite HMR websocket
        : ["'self'", "https://www.google-analytics.com", "https://www.googletagmanager.com"], // Google Analytics (only loaded after consent)
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow external resources
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Additional secure headers
app.use((_req, res, next) => {
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// SEO: HTTPS enforcement
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && 
      !req.secure && 
      req.get('x-forwarded-proto') !== 'https' &&
      req.hostname.includes('thecolorcontrastchecker.com') &&
      !req.hostname.includes('api.')) {
    return res.redirect(301, `https://www.${req.hostname}${req.originalUrl}`);
  }
  next();
});

// SEO: Canonical domain enforcement (www redirect)
// Redirect non-www to www for consistency
app.use((req, res, next) => {
  const host = req.get('host') || '';
  const protocol = req.protocol || 'https';
  
  // Only redirect in production and if not already www
  if (process.env.NODE_ENV === 'production' && 
      !host.startsWith('www.') && 
      host.includes('thecolorcontrastchecker.com') &&
      !host.includes('api.')) {
    const wwwUrl = `${protocol}://www.${host}${req.originalUrl}`;
    return res.redirect(301, wwwUrl);
  }
  next();
});

// SEO: Trailing slash normalization
// Remove trailing slashes from all routes except root
app.use((req, res, next) => {
  const url = req.url;
  // Don't redirect root, API routes, or files with extensions
  if (url !== '/' && 
      url.length > 1 && 
      url.endsWith('/') && 
      !url.startsWith('/api/') &&
      !url.includes('.')) {
    const redirectUrl = url.slice(0, -1);
    return res.redirect(301, redirectUrl);
  }
  next();
});

// CORS Configuration
// Allow requests from frontend domain and localhost (even in production for testing)
const productionOrigins = [
  'https://www.thecolorcontrastchecker.com',
  'https://thecolorcontrastchecker.com',
  'https://api.thecolorcontrastchecker.com'
];

const localhostOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:8080'
];

// Combine all allowed origins
const allowedOrigins = [...productionOrigins, ...localhostOrigins];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Always allow localhost for development/testing
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        // In production, strictly enforce allowed origins for security
        console.warn(`⚠️  CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true, // Required for cookie-based authentication
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 204,
  preflightContinue: false
};

app.use(cors(corsOptions));
// Ensure preflight requests are handled for all routes
app.options('*', cors(corsOptions));

// Rate Limiting - Different limits for different routes

// Very lenient rate limit for public read-only endpoints (blog viewing, etc.)
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute for public endpoints
  message: 'Too many requests, please try again shortly.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limit (for authenticated admin operations) - Very lenient
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes (very lenient)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Progressive rate limiting for login - adds delay after 10 failed attempts (very lenient)
const loginSpeedBump = slowDown({
  windowMs: 5 * 60 * 1000, // 5 minutes
  delayAfter: 10, // Start delaying after 10 requests (very lenient)
  delayMs: () => 500, // Add 0.5 second delay per request after threshold
  validate: { delayMs: false } // Disable validation warning
});

// 20 wrong passwords → 15 min ban (very lenient for legitimate users)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit login attempts to 20 per windowMs (very lenient)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(423).json({ error: 'Too many login attempts – please wait 15 minutes.' });
  },
  skipSuccessfulRequests: true
});

const fileEditLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit file edits to 30 per minute (increased from 10)
  message: 'Too many file operations, please slow down.'
});

// Apply rate limiting - ORDER MATTERS! More specific routes first
// Public blog routes get lenient rate limiting
app.use('/api/blog', publicLimiter);
app.use('/api/analytics/session', publicLimiter);
app.use('/api/analytics/event', publicLimiter);
app.use('/api/analytics/blog-view', publicLimiter);
app.use('/api/analytics/blog-read-time', publicLimiter);
// Login has its own strict limiter - MUST come before general limiter
app.use('/api/auth/login', loginSpeedBump, loginLimiter);
// File operations limited
app.use('/api/admin/files', fileEditLimiter);

// General limiter for all other API routes - EXCLUDES routes with specific limiters
// Create a custom middleware that skips routes that already have limiters
const generalApiLimiter = (req, res, next) => {
  // Skip general limiter for routes that have their own specific limiters
  const excludedPaths = [
    '/api/blog',
    '/api/analytics/session',
    '/api/analytics/event',
    '/api/analytics/blog-view',
    '/api/analytics/blog-read-time',
    '/api/auth/login',
    '/api/admin/files'
  ];
  
  // Check if this path starts with any excluded path
  const isExcluded = excludedPaths.some(path => req.path.startsWith(path));
  
  if (isExcluded) {
    // Skip general limiter - route has its own limiter
    return next();
  }
  
  // Apply general limiter to all other API routes
  return limiter(req, res, next);
};

app.use('/api/', generalApiLimiter);

// Cookie parser
app.use(cookieParser());

// Compression middleware - should be before static files and routes
// Optimized compression settings for better performance
app.use(compression({
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Don't compress already compressed files (images, fonts, etc.)
    if (req.path.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|woff|woff2|ttf|eot|otf|zip|gz|br)$/i)) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression ratio and CPU usage (0-9, default 6)
  threshold: 1024, // Only compress responses larger than 1KB
  chunkSize: 16 * 1024, // 16KB chunks for better streaming
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (for debugging) - placed after body parsers
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log(`[${timestamp}] Body:`, JSON.stringify(req.body, null, 2));
    }
  }
  next();
});

// Secure uploads directory - use private directory if available
const privateUploadsDir = path.resolve(projectRoot, 'private/uploads');
const uploadsDir = fs.existsSync(path.resolve(projectRoot, 'private'))
  ? privateUploadsDir
  : path.join(__dirname, 'uploads');

// Email logs directory - create logs folder in same location as database
const logsDir = fs.existsSync(path.resolve(projectRoot, 'private'))
  ? path.resolve(projectRoot, 'private/logs')
  : path.join(__dirname, 'logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  if (process.platform !== 'win32') {
    fs.chmodSync(logsDir, 0o755);
  }
}

// Email log file path
const emailLogFile = path.join(logsDir, 'email.log');

// Function to write email log to file
const writeEmailLog = (logEntry) => {
  try {
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(emailLogFile, logLine, 'utf8');
  } catch (error) {
    console.error('Failed to write email log to file:', error);
  }
};

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  // Set secure permissions (700 = owner read/write/execute only)
  if (process.platform !== 'win32') {
    fs.chmodSync(uploadsDir, 0o700);
  }
}

// Static files
app.use('/uploads', express.static(uploadsDir));

// Configure multer for secure file uploads (images, videos, audio)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [
      // Images
      '.jpg', '.jpeg', '.png', '.webp', '.gif',
      // Videos
      '.mp4', '.webm', '.ogg',
      // Audio
      '.mp3', '.wav', '.ogg', '.m4a'
    ];

    if (!allowedExts.includes(ext)) {
      return cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowedExts.join(', ')}`));
    }

    // Use UUID for secure filename
    const filename = `${randomUUID()}${ext}`;
    cb(null, filename);
  }
});

// Enhanced upload with support for images, videos, and audio (no size limit)
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      // Images
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      // Videos
      'video/mp4', 'video/webm', 'video/ogg',
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [
      '.jpg', '.jpeg', '.png', '.webp', '.gif',
      '.mp4', '.webm', '.ogg',
      '.mp3', '.wav', '.m4a'
    ];

    if (allowedMime.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedExts.join(', ')}`));
    }
  }
});

// Authentication middleware
// Check if SESSION_SECRET/JWT_SECRET is available (hard fail rule)
const hasValidSessionSecret = () => {
  return !!(process.env.SESSION_SECRET || process.env.JWT_SECRET);
};

const authenticateToken = (req, res, next) => {
  // HARD FAIL: Block authentication if SESSION_SECRET is missing
  if (!hasValidSessionSecret()) {
    return res.status(500).json({
      error: 'Missing required environment configuration',
      message: 'Authentication service is unavailable'
    });
  }

  // Read token from HttpOnly cookie (cookie-based authentication)
  const token = req.cookies?.cms_session;

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Calculate read time based on content word count
const calculateReadTime = (content) => {
  if (!content) return '1 min read';
  // Strip HTML tags and count words
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
  return `${minutes} min read`;
};

// Sanitize HTML content for blog posts
const sanitizeContent = (html) => {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's', 'strike',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'div', 'span',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'class'],
      'div': ['class'],
      'span': ['class'],
      'p': ['class'],
      'h1': ['class'],
      'h2': ['class'],
      'h3': ['class'],
      'h4': ['class'],
      'h5': ['class'],
      'h6': ['class'],
      'code': ['class'],
      'pre': ['class']
    },
    allowedStyles: {
      '*': {
        'color': [/^#[0-9A-Fa-f]{6}$/, /^rgb\(/, /^rgba\(/],
        'background-color': [/^#[0-9A-Fa-f]{6}$/, /^rgb\(/, /^rgba\(/],
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/]
      }
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    }
  });
};

// Input validation middleware
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be between 1 and 50 characters')
    .escape(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  // Code field removed - email verification disabled
];

const validatePost = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .escape(),
  body('slug')
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Excerpt must be less than 1,000 characters')
    .escape(),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description must be less than 500 characters'),
  body('content')
    .trim()
    .isLength({ max: 500000 })
    .withMessage('Content must be less than 500,000 characters. If your content is too large, please upload images instead of pasting them directly.')
    .customSanitizer((v) => sanitizeContent(v || '')),
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters')
    .escape(),
  body('authorLinkedin')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Author LinkedIn URL must be less than 500 characters')
    .custom((value) => {
      if (value && value.length > 0 && !value.match(/^https?:\/\/(www\.)?linkedin\.com\//i)) {
        throw new Error('Author LinkedIn must be a valid LinkedIn URL');
      }
      return true;
    }),
  body('authorInstagram')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Author Instagram URL must be less than 500 characters')
    .custom((value) => {
      if (value && value.length > 0 && !value.match(/^https?:\/\/(www\.)?instagram\.com\//i)) {
        throw new Error('Author Instagram must be a valid Instagram URL');
      }
      return true;
    }),
  body('authorTwitter')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Author Twitter/X URL must be less than 500 characters')
    .custom((value) => {
      if (value && value.length > 0 && !value.match(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i)) {
        throw new Error('Author Twitter must be a valid Twitter/X URL');
      }
      return true;
    }),
  body('authorWebsite')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Author Website URL must be less than 500 characters')
    .custom((value) => {
      if (value && value.length > 0 && !value.match(/^https?:\/\//i)) {
        throw new Error('Author Website must be a valid URL starting with http:// or https://');
      }
      return true;
    }),
  body('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('readTime')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Read time must be less than 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('featuredImage')
    .optional(),
  body('featuredImage.url')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Featured image URL must be less than 1000 characters'),
  body('featuredImage.alt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Featured image alt text must be less than 500 characters'),
  body('featuredImage.credit')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Featured image credit must be less than 200 characters'),
];

const validatePostId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Post ID must be a positive integer'),
];

const validateSlug = [
  param('slug')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid slug format'),
];

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

// Forgot-password validators
const validateForgotPassword = [
  body('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username is required for password reset')
    .escape(),
];

const validateResetPassword = [
  body('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username is required')
    .escape(),
  body('token')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];

// ============================================
// AUTH ROUTES
// ============================================

// Email verification endpoint removed - login now uses username/password only

// Auth routes
app.post('/api/auth/login', validateLogin, (req, res) => {
  // HARD FAIL: Block login if SESSION_SECRET is missing
  if (!hasValidSessionSecret()) {
    return res.status(500).json({
      error: 'Missing required environment configuration',
      message: 'Authentication service is unavailable'
    });
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const { username, password } = req.body;

    // Additional sanitization
    const sanitizedUsername = username.trim().toLowerCase();

    const user = users.findByUsername(sanitizedUsername);
    if (!user) {
      // Don't reveal if user exists (security best practice)
      console.log(`Login attempt failed for username: ${sanitizedUsername}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = users.verifyPassword(password, user.password);
    if (!isValid) {
      console.log(`Login attempt failed: Invalid password for user '${sanitizedUsername}'`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Email verification is disabled - login with username/password only
    // (Email verification code check removed)

    // Successful login - reset attempts and clear any existing verification code
    users.resetLoginAttempts(user.id);
    securityUsers.clearVerificationCode(user.id);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d'
    });

    // Set secure HttpOnly cookie for cross-subdomain authentication
    // Use domain only in production, omit for localhost
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS)
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Lax for localhost
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    // Only set domain in production (for cross-subdomain)
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.domain = '.thecolorcontrastchecker.com';
    }
    
    res.cookie('cms_session', token, cookieOptions);

    console.log(`Successful login for user: ${sanitizedUsername}`);

    // Log login event
    const userRole = user.role || 'admin';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    auditLogs.log(
      user.id,
      sanitizedUsername,
      'login',
      null,
      null,
      JSON.stringify({ username: sanitizedUsername, role: userRole }),
      ipAddress,
      userAgent
    );

    // Return success without token (cookie-only authentication)
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  try {
    // Generate new token with same user info
    const newToken = jwt.sign(
      { id: req.user.id, username: req.user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update HttpOnly cookie
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.domain = '.thecolorcontrastchecker.com';
    }
    
    res.cookie('cms_session', newToken, cookieOptions);

    res.json({ success: true });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password - request reset link/code
app.post('/api/auth/forgot-password', validateForgotPassword, handleValidationErrors, (req, res) => {
  try {
    const { username } = req.body;
    const sanitizedUsername = String(username).trim().toLowerCase();
    const user = users.findByUsername(sanitizedUsername);

    // Do not reveal whether user exists
    if (!user || !user.email) {
      return res.json({
        message: 'If an account exists for this username, a password reset email has been sent.',
      });
    }

    const token = randomUUID();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    securityUsers.setResetToken(user.id, token, expiresAt);

    const resetInstructions = [
      'You (or someone) requested a password reset for the CMS admin.',
      '',
      `Reset token: ${token}`,
      '',
      'In the admin login screen, open "Forgot password", paste this token, and choose a new password.',
      'This token will expire in 1 hour.',
    ].join('\n');

    sendEmail(
      user.email,
      'CMS Password Reset Instructions',
      resetInstructions
    ).catch((err) => {
      console.error('Error sending reset email:', err);
    });

    res.json({
      message: 'If an account exists for this username, a password reset email has been sent.',
    });
  } catch (error) {
    console.error('forgot-password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', validateResetPassword, handleValidationErrors, (req, res) => {
  try {
    const { username, token, newPassword } = req.body;
    const sanitizedUsername = String(username).trim().toLowerCase();
    const user = users.findByUsername(sanitizedUsername);

    if (!user || !user.reset_token || !user.reset_token_expires) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const nowMs = Date.now();
    if (
      nowMs > user.reset_token_expires ||
      String(token).trim() !== String(user.reset_token).trim()
    ) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashed = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
    securityUsers.updatePassword(user.id, hashed);
    securityUsers.clearResetToken(user.id);

    res.json({ message: 'Password has been updated successfully' });
  } catch (error) {
    console.error('reset-password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint - verify server is online (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Auth check endpoint - verify if user is authenticated
app.get('/api/auth/check', (req, res) => {
  try {
    const token = req.cookies?.cms_session;
    
    if (!token) {
      return res.status(200).json({ authenticated: false }); // Return 200, not 401, to indicate server is up
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(200).json({ authenticated: false }); // Return 200, not 401
      }
      
      res.json({
        authenticated: true,
        user: {
          id: user.id,
          username: user.username
        }
      });
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(200).json({ authenticated: false }); // Return 200 to indicate server is up
  }
});

// Logout endpoint (allows logout even with expired/invalid token)
app.post('/api/auth/logout', (req, res) => {
  try {
    // Try to get user info from token if available (for logging)
    let userId = null;
    let username = 'unknown';
    
    const token = req.cookies?.cms_session;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
        username = decoded.username || 'unknown';
      } catch (err) {
        // Token is invalid/expired - that's OK, we still want to clear the cookie
        console.log('Logout: Token invalid/expired, clearing cookie anyway');
      }
    }

    // Always clear HttpOnly cookie (even if token is invalid)
    const clearCookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
    };
    
    if (process.env.NODE_ENV === 'production') {
      clearCookieOptions.domain = '.thecolorcontrastchecker.com';
    }
    
    res.clearCookie('cms_session', clearCookieOptions);

    // Log logout event if we have user info
    if (userId) {
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      auditLogs.log(
        userId,
        username,
        'logout',
        null,
        null,
        JSON.stringify({ username }),
        ipAddress,
        userAgent
      );
      console.log(`User ${username} logged out`);
    } else {
      console.log('Logout: Session cleared (no valid token)');
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookie even on error
    const clearCookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
    };
    
    if (process.env.NODE_ENV === 'production') {
      clearCookieOptions.domain = '.thecolorcontrastchecker.com';
    }
    
    res.clearCookie('cms_session', clearCookieOptions);
    res.json({ message: 'Session cleared' });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = users.findByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = users.verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
    securityUsers.updatePassword(user.id, hashedPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change username endpoint
app.post('/api/auth/change-username', authenticateToken, async (req, res) => {
  try {
    const { newUsername, password } = req.body;

    if (!newUsername || !password) {
      return res.status(400).json({ error: 'New username and password are required' });
    }

    const sanitizedNewUsername = newUsername.trim().toLowerCase();

    if (sanitizedNewUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (!/^[a-z0-9_]+$/.test(sanitizedNewUsername)) {
      return res.status(400).json({ error: 'Username can only contain lowercase letters, numbers, and underscores' });
    }

    const user = users.findByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = users.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    const existingUser = users.findByUsername(sanitizedNewUsername);
    if (existingUser && existingUser.id !== user.id) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    users.updateUsername(user.id, sanitizedNewUsername);

    const newToken = jwt.sign({ id: user.id, username: sanitizedNewUsername }, JWT_SECRET, {
      expiresIn: '7d'
    });

    // Set cookie options based on environment
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    // Only set domain in production (for cross-subdomain)
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.domain = '.thecolorcontrastchecker.com';
    }

    res.cookie('cms_session', newToken, cookieOptions);

    res.json({
      message: 'Username changed successfully',
      user: { id: user.id, username: sanitizedNewUsername }
    });
  } catch (error) {
    console.error('Change username error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public blog routes
app.get('/api/blog/posts', (req, res) => {
  try {
    // SEO: Set proper headers for blog listing
    res.set('X-Robots-Tag', 'index, follow');
    // Shorter cache for fresh content (1 minute) - allows new posts to appear faster
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    const posts = blogPosts.getPublished();
    
    // Generate ETag based on actual data (post count and latest post date)
    const latestPostDate = posts.length > 0 ? new Date(posts[0].date).getTime() : 0;
    const etag = `"blog-posts-${posts.length}-${latestPostDate}"`;
    res.set('ETag', etag);
    
    // Check if client has cached version
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === etag) {
      return res.status(304).end(); // Not Modified
    }
    
    // Optimize data formatting - include all necessary fields including featured images
    const formatted = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      author: post.author || 'Admin',
      date: post.date,
      readTime: post.read_time || '5 min read',
      tags: post.tags ? post.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      featuredImage: {
        url: post.featured_image_url || '',
        alt: post.featured_image_alt || post.title
      }
    }));

    // Log in development only
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 /api/blog/posts - Returning ${formatted.length} published posts`);
    }

    res.json(formatted);
  } catch (error) {
    console.error('❌ Error in /api/blog/posts:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/blog/posts/:slug', validateSlug, handleValidationErrors, (req, res) => {
  try {
    const post = blogPosts.getBySlug(req.params.slug);
    if (!post) {
      // SEO: 404 responses should have noindex header
      res.set('X-Robots-Tag', 'noindex, nofollow');
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.published) {
      // SEO: Unpublished posts should have noindex header
      res.set('X-Robots-Tag', 'noindex, nofollow');
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // SEO: Set proper headers for published blog posts
    res.set('X-Robots-Tag', 'index, follow');
    // Extended cache for better performance (5 minutes with stale-while-revalidate)
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.set('ETag', `"blog-post-${post.id}-${post.date}"`);

    // Track blog view (async, don't block response)
    const sessionId = req.headers['x-session-id'] || null;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const referrer = req.get('referer') || '';

    // Log view asynchronously
    setImmediate(() => {
      try {
        analytics.logBlogView(post.id, post.slug, sessionId, ipAddress, referrer);
      } catch (error) {
        console.error('Error logging blog view:', error);
      }
    });

    // Calculate real read time if not set or if it's a placeholder (optimized)
    let readTime = post.read_time;
    if (!readTime || readTime === '1 min read' || readTime.includes('min read')) {
      // Optimized: Only calculate if needed, use faster method
      const text = post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const minutes = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
      readTime = `${minutes} min read`;
    }

    // Optimize response - only include necessary data
    res.json({
      id: post.id,
      title: post.title,
      slug: post.slug,
      metaDescription: post.meta_description || '',
      author: post.author || 'Admin',
      authorLinkedin: post.author_linkedin || '',
      authorInstagram: post.author_instagram || '',
      authorTwitter: post.author_twitter || '',
      authorWebsite: post.author_website || '',
      date: post.date,
      readTime: readTime,
      tags: post.tags ? post.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      featuredImage: {
        url: post.featured_image_url || '',
        alt: post.featured_image_alt || post.title,
        credit: post.featured_image_credit || ''
      },
      content: post.content
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected admin routes
// Verify authentication status endpoint (used by frontend to check if user is logged in)
app.get('/api/admin/verify', authenticateToken, (req, res) => {
  // If authenticateToken middleware passes, user is authenticated
  // Return user info without sensitive data
  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      username: req.user.username
    }
  });
});

app.get('/api/admin/posts', authenticateToken, (req, res) => {
  try {
    const posts = blogPosts.getAll();
    const formatted = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      metaDescription: post.meta_description,
      author: post.author,
      authorLinkedin: post.author_linkedin,
      authorInstagram: post.author_instagram,
      authorTwitter: post.author_twitter,
      authorWebsite: post.author_website,
      date: post.date,
      readTime: post.read_time,
      tags: post.tags ? post.tags.split(',').map(t => t.trim()) : [],
      featuredImage: {
        url: post.featured_image_url,
        alt: post.featured_image_alt,
        credit: post.featured_image_credit
      },
      content: post.content,
      published: post.published === 1,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/posts/:id', authenticateToken, (req, res) => {
  try {
    const post = blogPosts.getById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // SEO: Set proper headers for blog post responses
    res.set('X-Robots-Tag', 'index, follow');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    res.json({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      metaDescription: post.meta_description,
      author: post.author,
      authorLinkedin: post.author_linkedin,
      authorInstagram: post.author_instagram,
      authorTwitter: post.author_twitter,
      authorWebsite: post.author_website,
      date: post.date,
      readTime: post.read_time,
      tags: post.tags ? post.tags.split(',').map(t => t.trim()) : [],
      featuredImage: {
        url: post.featured_image_url,
        alt: post.featured_image_alt,
        credit: post.featured_image_credit
      },
      content: post.content,
      published: post.published === 1,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/posts', authenticateToken, validatePost, handleValidationErrors, (req, res) => {
  try {
    const startTime = Date.now();
    console.log('📝 Creating new post:', req.body.title);
    console.log('   Published status:', req.body.published);

    // Auto-calculate read time if not provided or if it's a placeholder
    const postData = { ...req.body };
    if (!postData.readTime || postData.readTime === '1 min read') {
      postData.readTime = calculateReadTime(postData.content);
      console.log('   Auto-calculated read time:', postData.readTime);
    }

    // Create post (optimized - single database operation)
    const result = blogPosts.create(postData);
    const postId = result.lastInsertRowid;
    
    // Fetch the created post to return full data (only if needed for response)
    const createdPost = blogPosts.getById(postId);

    const duration = Date.now() - startTime;
    console.log(`✅ Post created successfully with ID: ${postId} (${duration}ms)`);
    console.log('   Stored published status:', createdPost.published);

    // Return response immediately - don't block on any other operations
    res.status(201).json({
      id: postId,
      message: 'Post created successfully',
      published: createdPost.published === 1,
      slug: createdPost.slug
    });
    
    // Trigger async static regeneration (non-blocking)
    setImmediate(() => regenerateStaticBlogContent());
  } catch (error) {
    console.error('❌ Error creating post:', error);
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A post with this slug already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/posts/:id', authenticateToken, validatePostId, validatePost, handleValidationErrors, (req, res) => {
  try {
    const startTime = Date.now();
    console.log(`📝 Updating post ${req.params.id}:`, req.body.title);
    console.log('   Published status:', req.body.published);

    // Auto-calculate read time based on content
    const postData = { ...req.body };
    if (postData.content) {
      postData.readTime = calculateReadTime(postData.content);
      console.log('   Auto-calculated read time:', postData.readTime);
    }

    const result = blogPosts.update(req.params.id, postData);
    if (result.changes === 0) {
      // SEO: 404 responses should have noindex header
      res.set('X-Robots-Tag', 'noindex, nofollow');
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Fetch the updated post to return full data (optimized - single query)
    const updatedPost = blogPosts.getById(req.params.id);

    const duration = Date.now() - startTime;
    console.log(`✅ Post updated successfully (${duration}ms)`);
    console.log('   Stored published status:', updatedPost.published);

    res.json({
      message: 'Post updated successfully',
      published: updatedPost.published === 1,
      slug: updatedPost.slug
    });
    
    // Trigger async static regeneration (non-blocking)
    setImmediate(() => regenerateStaticBlogContent());
  } catch (error) {
    console.error('❌ Error updating post:', error);
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A post with this slug already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/posts/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  
  console.log('🛠 [API] DELETE /api/admin/posts/:id called, id =', id);
  
  try {
    // Verify post exists first
    const post = blogPosts.getById(id);
    if (!post) {
      console.log(`❌ [API] Post not found: ID ${id}`);
      res.set('X-Robots-Tag', 'noindex, nofollow');
      return res.status(404).json({ 
        error: 'Post not found',
        postId: id
      });
    }
    
    // Delete the post using the new blogPosts.delete function
    // This function handles all foreign key cleanup internally
    const result = blogPosts.delete(id);
    
    
    console.log(`✅ [API] Post deleted successfully, id = ${id}, rows affected = ${result.changes ?? 1}`);
    
    res.status(200).json({
      message: 'Post deleted successfully',
      deletedId: id,
      deletedSlug: post.slug,
      rowsAffected: result.changes ?? 1
    });
    
    // Trigger async static regeneration (non-blocking)
    setImmediate(() => regenerateStaticBlogContent());
  } catch (error) {
    console.error('❌ [API] Delete failed in blogPosts.delete:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Failed to delete post',
      postId: id
    });
  }
});

// Delete all blog posts endpoint (for fresh start)
app.delete('/api/admin/posts', authenticateToken, (req, res) => {
  const startTime = Date.now();
  const userId = req.user?.id || req.user?.username || 'unknown';
  
  console.log('\n' + '='.repeat(80));
  console.log(`🗑️  [API] DELETE /api/admin/posts (DELETE ALL)`);
  console.log('='.repeat(80));
  console.log(`📥 [API] Request received:`);
  console.log(`   Method: DELETE`);
  console.log(`   URL: /api/admin/posts`);
  console.log(`   User: ${userId}`);
  console.log(`   IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Get count before deletion
    const allPosts = blogPosts.getAll();
    const countBefore = allPosts.length;
    console.log(`\n📊 [API] Current blog posts count: ${countBefore}`);

    // Delete all posts
    console.log(`\n🗑️  [API] Calling database deleteAll function...`);
    const result = blogPosts.deleteAll();
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ [API] All posts deleted successfully`);
    console.log(`   Posts deleted: ${result.changes}`);
    console.log(`   Duration: ${duration}ms`);
    
    
    const response = { 
      message: 'All blog posts deleted successfully',
      postsDeleted: result.changes,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    console.log(`\n📤 [API] Sending success response:`);
    console.log(`   Status: 200 OK`);
    console.log(`   Response: ${JSON.stringify(response, null, 2)}`);
    console.log('='.repeat(80) + '\n');
    
    res.json(response);
    
    // Trigger async static regeneration (non-blocking)
    setImmediate(() => regenerateStaticBlogContent());
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ [API] Error deleting all posts:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`   Duration: ${duration}ms`);
    console.error('='.repeat(80) + '\n');
    
    const errorResponse = {
      error: error.message || 'Internal server error',
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    };
    
    res.status(500).json(errorResponse);
  }
});

// Media upload route (images, videos, audio)
app.post('/api/admin/upload', authenticateToken, upload.single('image'), (req, res) => {
  console.log('📤 Media upload request received');

  if (!req.file) {
    console.error('❌ No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('✅ File uploaded successfully:', req.file.filename);
  console.log('   Size:', req.file.size);
  console.log('   Mimetype:', req.file.mimetype);
  console.log('   Original name:', req.file.originalname);

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// Media Library endpoint - Get all uploaded media files
app.get('/api/admin/media', authenticateToken, (req, res) => {
  try {
    const { type, search, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    if (!fs.existsSync(uploadsDir)) {
      return res.json({ files: [], total: 0, page: pageNum, limit: limitNum });
    }

    const files = fs.readdirSync(uploadsDir)
      .map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        
        // Classify file type
        let fileType = 'other';
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
          fileType = 'image';
        } else if (['.mp4', '.webm', '.ogg'].includes(ext)) {
          fileType = 'video';
        } else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
          fileType = 'audio';
        }

        return {
          id: filename,
          filename,
          url: `/uploads/${filename}`,
          type: fileType,
          size: stats.size,
          uploadedAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          extension: ext
        };
      })
      .filter(file => {
        // Filter by type if specified
        if (type && file.type !== type) return false;
        // Filter by search term if specified
        if (search && !file.filename.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    const total = files.length;
    const paginatedFiles = files.slice(offset, offset + limitNum);

    res.json({
      files: paginatedFiles,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete media file
app.delete('/api/admin/media/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    console.log(`✅ Deleted media file: ${filename}`);
    
    res.json({ message: 'File deleted successfully', filename });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email logs route (admin only)
app.get('/api/admin/email-logs', authenticateToken, (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const recipient = req.query.recipient;
    const failedOnly = req.query.failed === 'true';

    let logs;
    if (recipient) {
      logs = emailLogs.getByRecipient(recipient, limit);
    } else if (failedOnly) {
      logs = emailLogs.getFailed(limit);
    } else {
      logs = emailLogs.getAll(limit);
    }

    res.json({
      logs,
      count: logs.length,
      filters: {
        limit,
        recipient: recipient || null,
        failedOnly
      }
    });
  } catch (error) {
    console.error('Error retrieving email logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Track session start
app.post('/api/analytics/session', (req, res) => {
  try {
    const sessionId = randomUUID();
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    const referrer = req.get('referer') || req.body.referrer || '';

    analytics.createSession(sessionId, ipAddress, userAgent, referrer);

    res.json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Track usage events (public, but rate limited)
// PRODUCTION-SAFE: This endpoint must NEVER fail requests due to logging errors
app.post('/api/analytics/event', (req, res) => {
  try {
    const { sessionId, eventType, eventData } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    // Update session activity only if sessionId is provided (non-blocking)
    if (sessionId) {
      try {
        analytics.updateSessionActivity(sessionId);
      } catch (sessionError) {
        // Session update failure should not block the request
        console.warn('⚠️  Could not update session activity (non-blocking):', {
          sessionId,
          error: sessionError.message
        });
      }
    }

    // Log the event (non-blocking - returns null on error, never throws)
    const logResult = analytics.logUsageEvent(sessionId || null, eventType, eventData);
    
    // Always return success even if logging failed (logging is non-critical)
    // The logUsageEvent function handles all errors internally
    res.json({ 
      success: true,
      logged: logResult !== null // Optional: indicate if logging succeeded
    });
  } catch (error) {
    // This catch block should rarely execute since logUsageEvent doesn't throw
    // But we keep it as a safety net
    console.error('❌ Unexpected error in /api/analytics/event:', {
      error: error.message,
      stack: error.stack,
      note: 'Returning success to prevent blocking client requests'
    });
    
    // Return success anyway - analytics failures should not break the app
    res.json({ 
      success: true,
      logged: false,
      note: 'Analytics logging failed but request succeeded'
    });
  }
});

// Analytics: Track blog view
app.post('/api/analytics/blog-view', (req, res) => {
  try {
    const { postId, postSlug, sessionId } = req.body;

    if (!postId || !postSlug) {
      return res.status(400).json({ error: 'postId and postSlug are required' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const referrer = req.get('referer') || '';

    const result = analytics.logBlogView(postId, postSlug, sessionId, ipAddress, referrer);

    res.json({ viewId: result?.lastInsertRowid, success: true });
  } catch (error) {
    console.error('Error logging blog view:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Update blog read time
app.post('/api/analytics/blog-read-time', (req, res) => {
  try {
    const { viewId, readDurationSeconds, scrollDepth } = req.body;

    if (!viewId) {
      return res.status(400).json({ error: 'viewId is required' });
    }

    analytics.updateBlogReadTime(viewId, readDurationSeconds || 0, scrollDepth || 0);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating blog read time:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Log contrast check (public endpoint for tracking tool usage)
app.post('/api/analytics/contrast-check', (req, res) => {
  try {
    const { sessionId, foregroundColor, backgroundColor, contrastRatio, results } = req.body;

    if (!foregroundColor || !backgroundColor) {
      return res.status(400).json({ error: 'foregroundColor and backgroundColor are required' });
    }

    // Validate color format (hex)
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (!hexPattern.test(foregroundColor) || !hexPattern.test(backgroundColor)) {
      return res.status(400).json({ error: 'Colors must be in hex format (#RRGGBB)' });
    }

    // Log the contrast check
    const aaNormalPass = results?.aaNormal ? 1 : 0;
    const aaLargePass = results?.aaLarge ? 1 : 0;
    const aaaNormalPass = results?.aaaNormal ? 1 : 0;
    const aaaLargePass = results?.aaaLarge ? 1 : 0;

    contrastChecks.log(
      sessionId || null,
      foregroundColor,
      backgroundColor,
      parseFloat(contrastRatio) || 0,
      aaNormalPass,
      aaLargePass,
      aaaNormalPass,
      aaaLargePass
    );

    // Also log as usage event for general tracking
    if (sessionId) {
      analytics.logUsageEvent(sessionId, 'contrast_check', {
        foreground: foregroundColor,
        background: backgroundColor,
        ratio: contrastRatio,
        passAA: aaNormalPass === 1,
        passAAA: aaaNormalPass === 1
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging contrast check:', error);
    // Don't fail the request - analytics is non-critical
    res.json({ success: true, logged: false });
  }
});

// Admin Analytics: Dashboard stats
app.get('/api/admin/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period, 10);
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Try to fetch from Google Analytics Data API first
    let gaData = null;
    if (analyticsClient && GA_PROPERTY_ID) {
      gaData = await fetchGADashboardData(days);
    }

    if (gaData && gaData.summary) {
      // Use GA4 data
      console.log('[Dashboard] Using GA4 Data API');
      res.json({
        activeSessions: gaData.summary.activeUsers || 0,
        period: {
          startDate,
          endDate,
          days
        },
        summary: {
          activeUsers: gaData.summary.activeUsers || 0,
          sessions: gaData.summary.sessions || 0,
          screenPageViews: gaData.summary.screenPageViews || 0,
          averageSessionDuration: gaData.summary.averageSessionDuration || 0,
          eventCount: gaData.summary.eventCount || 0
        },
        stats: gaData.stats || [],
        timeframes: gaData.timeframes || {
          today: { activeUsers: 0, sessions: 0 },
          thisWeek: { activeUsers: 0, sessions: 0 },
          thisMonth: { activeUsers: 0, sessions: 0 }
        },
        dataSource: 'GA4'
      });
    } else {
      // Fallback to SQLite
      console.log('[Dashboard] Using fallback: SQLite');
      
      // Get active sessions (last 5 minutes)
      const activeSessions = analytics.getActiveSessions(5);

      // Get usage summary
      const usageSummary = analytics.getUsageSummary(startDate, endDate);

      // Get usage stats by date
      const usageStats = analytics.getUsageStats(startDate, endDate);

      // Get today, this week, this month stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisWeek = new Date(today);
      thisWeek.setDate(today.getDate() - today.getDay()); // Start of week
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const todayStats = analytics.getUsageSummary(today.toISOString(), endDate);
      const weekStats = analytics.getUsageSummary(thisWeek.toISOString(), endDate);
      const monthStats = analytics.getUsageSummary(thisMonth.toISOString(), endDate);

      res.json({
        activeSessions: activeSessions.count,
        period: {
          startDate,
          endDate,
          days
        },
        summary: usageSummary,
        stats: usageStats,
        timeframes: {
          today: todayStats,
          thisWeek: weekStats,
          thisMonth: monthStats
        },
        dataSource: 'SQLite'
      });
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Analytics: Usage stats with date range
app.get('/api/admin/analytics/usage', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const stats = analytics.getUsageStats(startDate, endDate);
    const summary = analytics.getUsageSummary(startDate, endDate);

    res.json({
      stats,
      summary,
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Analytics: Blog performance
app.get('/api/admin/analytics/blog-performance', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate, sortBy = 'views' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const performance = analytics.getBlogPerformance(startDate, endDate, sortBy);

    res.json({
      performance,
      period: { startDate, endDate, sortBy }
    });
  } catch (error) {
    console.error('Error getting blog performance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Analytics: Export CSV
app.get('/api/admin/analytics/export', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const stats = analytics.getUsageStats(startDate, endDate);
    const summary = analytics.getUsageSummary(startDate, endDate);

    // Generate CSV
    let csv = 'Date,Total Sessions,Unique Users,Contrast Checks,AI Suggestions\n';

    // Group by date
    const byDate = {};
    stats.forEach(stat => {
      if (!byDate[stat.date]) {
        byDate[stat.date] = {
          date: stat.date,
          sessions: 0,
          contrastChecks: 0,
          aiSuggestions: 0
        };
      }

      if (stat.event_type === 'contrast_check') {
        byDate[stat.date].contrastChecks = stat.count;
      } else if (stat.event_type === 'ai_suggestion') {
        byDate[stat.date].aiSuggestions = stat.count;
      }
    });

    // Get unique sessions per date
    const sessions = analytics.getSessionsByDateRange(startDate, endDate);

    sessions.forEach(s => {
      if (byDate[s.date]) {
        byDate[s.date].sessions = s.unique_sessions;
      }
    });

    Object.values(byDate).forEach(row => {
      csv += `${row.date},${row.sessions},${row.sessions},${row.contrastChecks},${row.aiSuggestions}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${startDate}-to-${endDate}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// projectRoot is already defined above, no need to redefine

// Allowed directories for file editing (relative to project root)
const ALLOWED_DIRECTORIES = [
  'src',
  'public',
  'docs',
  'server'
];

// Allowed file extensions for editing
const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html',
  '.md', '.txt', '.yml', '.yaml', '.env', '.config.js', '.config.ts'
];

// Blocked files/directories for security
const BLOCKED_PATTERNS = [
  'node_modules',
  '.git',
  'package-lock.json',
  'bun.lockb',
  '.env.local',
  '.env.production'
];

// Helper function to check if path is safe
const isPathSafe = (filePath) => {
  const normalizedPath = path.normalize(filePath);
  const fullPath = path.resolve(projectRoot, normalizedPath);
  const relativePath = path.relative(projectRoot, fullPath);

  // Prevent directory traversal
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return false;
  }

  // Check if path contains blocked patterns
  if (BLOCKED_PATTERNS.some(pattern => relativePath.includes(pattern))) {
    return false;
  }

  // Check if file is in project root (no directory separator means root file)
  if (!relativePath.includes(path.sep)) {
    return ALLOWED_DIRECTORIES.includes('.');
  }

  // Check if path is in allowed directory
  const firstDir = relativePath.split(path.sep)[0];
  return ALLOWED_DIRECTORIES.includes(firstDir);
};

// Helper function to check if file extension is allowed
const isExtensionAllowed = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) || ext === '';
};

// File editor routes
app.get('/api/admin/files', authenticateToken, (req, res) => {
  try {
    const dirPath = req.query.path || '';

    // If root, show only allowed directories
    if (!dirPath) {
      const rootItems = ALLOWED_DIRECTORIES.map(dirName => {
        const dirPath = path.join(projectRoot, dirName);
        if (fs.existsSync(dirPath)) {
          const stats = fs.statSync(dirPath);
          return {
            name: dirName,
            path: dirName,
            type: 'directory',
            size: null,
            modified: stats.mtime.toISOString()
          };
        }
        return null;
      }).filter(Boolean);

      return res.json({
        path: '',
        items: rootItems.sort((a, b) => a.name.localeCompare(b.name))
      });
    }

    // For subdirectories, validate and list
    if (!isPathSafe(dirPath)) {
      return res.status(403).json({ error: 'Access denied to this path' });
    }

    const safePath = path.join(projectRoot, dirPath);

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'Path not found' });
    }

    const stats = fs.statSync(safePath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    const items = fs.readdirSync(safePath).map(item => {
      const itemPath = path.join(safePath, item);
      const relativePath = path.relative(projectRoot, itemPath);
      const stats = fs.statSync(itemPath);

      return {
        name: item,
        path: relativePath.replace(/\\/g, '/'),
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.isFile() ? stats.size : null,
        modified: stats.mtime.toISOString()
      };
    }).filter(item => {
      // Filter out blocked items
      return !BLOCKED_PATTERNS.some(pattern => item.path.includes(pattern));
    });

    res.json({
      path: dirPath,
      items: items.sort((a, b) => {
        // Directories first, then files, both alphabetically
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/files/read', authenticateToken, (req, res) => {
  try {
    const filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (!isPathSafe(filePath)) {
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    if (!isExtensionAllowed(filePath)) {
      return res.status(403).json({ error: 'File type not allowed for editing' });
    }

    const fullPath = path.resolve(projectRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }

    // Check file size (max 1MB)
    if (stats.size > 1024 * 1024) {
      return res.status(400).json({ error: 'File is too large to edit (max 1MB)' });
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    res.json({
      path: filePath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/files/write', authenticateToken, (req, res) => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (!isPathSafe(filePath)) {
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    if (!isExtensionAllowed(filePath)) {
      return res.status(403).json({ error: 'File type not allowed for editing' });
    }

    const fullPath = path.resolve(projectRoot, filePath);

    // Ensure parent directory exists
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, content, 'utf8');

    const stats = fs.statSync(fullPath);

    res.json({
      message: 'File saved successfully',
      path: filePath,
      size: stats.size,
      modified: stats.mtime.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security.txt endpoint (RFC 9116)
app.get('/.well-known/security.txt', (req, res) => {
  res.type('text/plain');
  res.send(`Contact: mailto:security@thecolorcontrastchecker.com
Expires: 2026-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://www.thecolorcontrastchecker.com/.well-known/security.txt
Policy: https://www.thecolorcontrastchecker.com/privacy-policy
Hiring: https://www.thecolorcontrastchecker.com/about
`);
});

// Rate limiting for sensitive admin operations
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: 'Too many password change attempts, please try again later.'
});

const profileUpdateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 attempts per window
  message: 'Too many profile update attempts, please try again later.'
});

// Admin Profile Management
app.patch('/api/admin/profile', authenticateToken, profileUpdateLimiter, [
  body('username').optional().trim().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9_]+$/),
  body('email').optional().isEmail().normalizeEmail(),
  body('displayName').optional().trim().isLength({ max: 100 })
], handleValidationErrors, (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, displayName } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const currentUser = users.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    let usernameChanged = false;

    if (username && username !== currentUser.username) {
      const sanitizedUsername = username.trim().toLowerCase();
      // Check for duplicate
      const existing = users.findByUsername(sanitizedUsername);
      if (existing && existing.id !== userId) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updates.username = sanitizedUsername;
      usernameChanged = true;
    }

    if (email !== undefined) {
      updates.email = email;
    }

    if (displayName !== undefined) {
      updates.display_name = displayName;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Update user using users helper
    if (updates.username) {
      users.updateUsername(userId, updates.username);
    }
    if (updates.email !== undefined) {
      users.updateEmail(userId, updates.email);
    }
    if (updates.display_name !== undefined) {
      users.updateDisplayName(userId, updates.display_name);
    }

    // Log audit event
    auditLogs.log(
      userId,
      currentUser.username,
      usernameChanged ? 'username_edited' : 'profile_updated',
      'user',
      userId,
      JSON.stringify(updates),
      ipAddress,
      userAgent
    );

    // If username changed, invalidate all sessions (force re-login)
    if (usernameChanged) {
      // Generate new token with new username
      const newToken = jwt.sign(
        { id: userId, username: updates.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };
      
      if (process.env.NODE_ENV === 'production') {
        cookieOptions.domain = '.thecolorcontrastchecker.com';
      }

      res.cookie('cms_session', newToken, cookieOptions);

      res.json({
        message: 'Profile updated successfully.',
        requiresReauth: true
      });
    } else {
      res.json({ message: 'Profile updated successfully' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Password Change
app.post('/api/admin/change-password', authenticateToken, passwordChangeLimiter, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 12 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 12 characters and include uppercase, lowercase, number, and symbol'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], handleValidationErrors, (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const user = users.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    if (!users.verifyPassword(currentPassword, user.password)) {
      auditLogs.log(userId, user.username, 'password_change_failed', 'user', userId, 'Invalid current password', ipAddress, userAgent);
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check password history (last 5)
    const recentPasswords = passwordHistory.getRecent(userId, 5);
    for (const oldPassword of recentPasswords) {
      if (bcrypt.compareSync(newPassword, oldPassword.password_hash)) {
        return res.status(400).json({ error: 'Password cannot be reused. Please choose a different password.' });
      }
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);

    // Update password
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);

    // Add to password history
    passwordHistory.add(userId, hashedPassword);

    // Log audit event
    auditLogs.log(userId, user.username, 'password_changed', 'user', userId, null, ipAddress, userAgent);

    // Generate new token (invalidate old sessions)
    const newToken = jwt.sign(
      { id: userId, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.domain = '.thecolorcontrastchecker.com';
    }

    res.cookie('cms_session', newToken, cookieOptions);

    res.json({
      message: 'Password changed successfully. All other sessions have been invalidated.'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout all devices
app.post('/api/admin/logout-all', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const user = users.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log audit event
    auditLogs.log(userId, user.username, 'all_sessions_revoked', 'user', userId, null, ipAddress, userAgent);

    // Clear HttpOnly cookie
    const clearCookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
    };
    
    if (process.env.NODE_ENV === 'production') {
      clearCookieOptions.domain = '.thecolorcontrastchecker.com';
    }
    
    res.clearCookie('cms_session', clearCookieOptions);

    res.json({ message: 'All sessions logged out successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = users.findById(req.user.id);
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Get audit logs
app.get('/api/admin/audit-log', authenticateToken, (req, res) => {
  try {
    const filters = {
      userId: req.query.userId ? parseInt(req.query.userId) : null,
      username: req.query.username || null,
      action: req.query.action || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null) {
        delete filters[key];
      }
    });

    const logs = auditLogs.get(filters);
    res.json(logs);
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// TEMPORARY: Debug endpoint (REMOVE AFTER VALIDATION)
// ============================================
// This endpoint checks environment variable existence without exposing values
// PROTECTED: Admin-only access during testing
// DELETE THIS ENDPOINT AFTER VERIFICATION IS COMPLETE
// Get GA4 Measurement ID endpoint (public, no auth needed)
// HARD FAIL: Returns HTTP 500 if GA_MEASUREMENT_ID is missing or invalid
app.get('/api/config/ga-measurement-id', (req, res) => {
  if (!GA_MEASUREMENT_ID) {
    return res.status(500).json({
      error: 'Missing required environment configuration',
      message: 'Google Analytics Measurement ID is not set'
    });
  }
  
  // Validate Measurement ID format (GA4 format: G-XXXXXXXXXX where X is alphanumeric)
  const gaIdPattern = /^G-[A-Z0-9]{10}$/;
  if (!gaIdPattern.test(GA_MEASUREMENT_ID)) {
    console.warn('[GA Config] Invalid Measurement ID format:', GA_MEASUREMENT_ID);
    console.warn('[GA Config] Expected format: G-XXXXXXXXXX (e.g., G-1234567890)');
    // Still return it, but log a warning - let the client handle the validation
  }
  
  res.json({ measurementId: GA_MEASUREMENT_ID });
});

// Google Analytics Data API helper functions
async function fetchGATrafficData(startDate, endDate) {
  // Wait for client initialization if still loading
  if (!BetaAnalyticsDataClient && GA_SERVICE_ACCOUNT_KEY_PATH && GA_PROPERTY_ID) {
    try {
      const gaModule = await import("@google-analytics/data");
      BetaAnalyticsDataClient = gaModule.BetaAnalyticsDataClient;
      if (!analyticsClient) {
        analyticsClient = new BetaAnalyticsDataClient({
          keyFile: GA_SERVICE_ACCOUNT_KEY_PATH
        });
      }
    } catch (error) {
      console.error('[GA] Failed to load GA module:', error.message);
    }
  }

  if (!analyticsClient || !GA_PROPERTY_ID) {
    console.log('[GA] Using fallback: SQLite (GA client not available)');
    return null;
  }

  try {
    const startDateStr = startDate.split('T')[0];
    const endDateStr = endDate.split('T')[0];
    
    console.log('[GA] Fetching traffic data from GA4 Data API');
    console.log('[GA] Date range:', startDateStr, 'to', endDateStr);
    
    // Get overall metrics
    const [overallResponse] = await analyticsClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: startDateStr, endDate: endDateStr }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' }
      ]
    });

    console.log('[GA] GA RESPONSE ROW COUNT:', overallResponse.rows?.length || 0);
    
    if (!overallResponse.rows || overallResponse.rows.length === 0) {
      console.warn('[GA] No data returned from GA API');
      return null;
    }

    // Get daily breakdown for graph
    const [dailyResponse] = await analyticsClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: startDateStr, endDate: endDateStr }
      ],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' }
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }]
    });

    // Get traffic sources
    const [sourcesResponse] = await analyticsClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: startDateStr, endDate: endDateStr }
      ],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
    });

    // Get top pages
    const [pagesResponse] = await analyticsClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: startDateStr, endDate: endDateStr }
      ],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10
    });

    // Parse overall metrics
    const row = overallResponse.rows[0];
    const metrics = {
      activeUsers: parseInt(row.metricValues[0].value) || 0,
      sessions: parseInt(row.metricValues[1].value) || 0,
      screenPageViews: parseInt(row.metricValues[2].value) || 0,
      averageSessionDuration: parseFloat(row.metricValues[3].value) || 0
    };

    // Parse daily data for graph - ensure proper date format
    const graphRaw = (dailyResponse.rows || []).map(row => ({
      date: row.dimensionValues[0].value, // Format: YYYYMMDD
      visits: parseInt(row.metricValues[0].value) || 0,
      sessions: parseInt(row.metricValues[1].value) || 0
    }));

    // Convert GA date format (YYYYMMDD) to YYYY-MM-DD and fill missing dates
    const graphMap = new Map();
    graphRaw.forEach(item => {
      // Convert YYYYMMDD to YYYY-MM-DD
      const dateStr = item.date.length === 8 
        ? `${item.date.substring(0, 4)}-${item.date.substring(4, 6)}-${item.date.substring(6, 8)}`
        : item.date;
      graphMap.set(dateStr, {
        date: dateStr,
        visits: item.visits,
        sessions: item.sessions
      });
    });

    // Fill in missing dates for last 30 days
    const graph = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 29);
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (graphMap.has(dateStr)) {
        graph.push(graphMap.get(dateStr));
      } else {
        graph.push({
          date: dateStr,
          visits: 0,
          sessions: 0
        });
      }
    }

    // Parse traffic sources
    const sources = (sourcesResponse.rows || []).map(row => {
      const source = row.dimensionValues[0].value || 'Direct';
      // Map GA source to our categories
      let category = 'Referral';
      if (!source || source === '(direct)') category = 'Direct';
      else if (source.includes('google') || source.includes('bing') || source.includes('yahoo')) category = 'Organic';
      else if (source.includes('facebook') || source.includes('twitter') || source.includes('linkedin') || source.includes('instagram')) category = 'Social';
      
      return {
        source: category,
        count: parseInt(row.metricValues[0].value) || 0
      };
    });

    // Group sources by category
    const groupedSources = sources.reduce((acc, item) => {
      const existing = acc.find(s => s.source === item.source);
      if (existing) {
        existing.count += item.count;
      } else {
        acc.push(item);
      }
      return acc;
    }, []);

    // Parse top pages
    const topPages = (pagesResponse.rows || []).map(row => ({
      url: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value) || 0,
      unique_views: parseInt(row.metricValues[1].value) || 0
    }));

    console.log('[GA] Successfully fetched data from GA4');
    console.log('[GA] Active Users:', metrics.activeUsers);
    console.log('[GA] Sessions:', metrics.sessions);
    console.log('[GA] Graph data points:', graph.length);
    console.log('[GA] Traffic sources:', groupedSources.length);

    // Ensure graph has at least some data points
    console.log('[GA] Graph data points before fill:', graph.length);
    if (graph.length === 0) {
      // If no data, create empty graph with last 30 days
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        graph.push({
          date: date.toISOString().split('T')[0],
          visits: 0,
          sessions: 0
        });
      }
    }
    console.log('[GA] Graph data points after fill:', graph.length);
    console.log('[GA] Graph sample (first 3):', graph.slice(0, 3));

    return {
      metrics,
      graph,
      sources: groupedSources,
      topPages
    };
  } catch (error) {
    console.error('[GA] Error fetching data from GA4 Data API:', error.message);
    console.log('[GA] Using fallback: SQLite');
    return null;
  }
}

async function fetchGADashboardData(periodDays) {
  // Wait for client initialization if still loading
  if (!BetaAnalyticsDataClient && GA_SERVICE_ACCOUNT_KEY_PATH && GA_PROPERTY_ID) {
    try {
      const gaModule = await import("@google-analytics/data");
      BetaAnalyticsDataClient = gaModule.BetaAnalyticsDataClient;
      if (!analyticsClient) {
        analyticsClient = new BetaAnalyticsDataClient({
          keyFile: GA_SERVICE_ACCOUNT_KEY_PATH
        });
      }
    } catch (error) {
      console.error('[GA] Failed to load GA module:', error.message);
    }
  }

  if (!analyticsClient || !GA_PROPERTY_ID) {
    console.log('[GA] Using fallback: SQLite (GA client not available)');
    return null;
  }

  try {
    const endDate = new Date();
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('[GA] Fetching dashboard data from GA4 Data API');
    console.log('[GA] Period:', periodDays, 'days');
    console.log('[GA] Date range:', startDateStr, 'to', endDateStr);

    // Get main period metrics
    const [periodResponse] = await analyticsClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: startDateStr, endDate: endDateStr }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'eventCount' }
      ]
    });

    // Get today's metrics
    const todayStr = endDate.toISOString().split('T')[0];
    const [todayResponse] = await analyticsClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: todayStr, endDate: todayStr }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' }
      ]
    });

    // Get this week's metrics
    const weekStart = new Date(endDate);
    weekStart.setDate(endDate.getDate() - endDate.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const [weekResponse] = await analyticsClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: weekStartStr, endDate: endDateStr }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' }
      ]
    });

    // Get this month's metrics
    const monthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const [monthResponse] = await analyticsClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: monthStartStr, endDate: endDateStr }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' }
      ]
    });

    // Get daily stats for the period
    const [dailyResponse] = await analyticsClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: startDateStr, endDate: endDateStr }
      ],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' }
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }]
    });

    // Parse responses
    const parseRow = (row) => ({
      activeUsers: parseInt(row.metricValues[0]?.value) || 0,
      sessions: parseInt(row.metricValues[1]?.value) || 0,
      screenPageViews: parseInt(row.metricValues[2]?.value) || 0,
      averageSessionDuration: parseFloat(row.metricValues[3]?.value) || 0,
      eventCount: parseInt(row.metricValues[4]?.value) || 0
    });

    const periodData = periodResponse.rows?.[0] ? parseRow(periodResponse.rows[0]) : null;
    const todayData = todayResponse.rows?.[0] ? {
      activeUsers: parseInt(todayResponse.rows[0].metricValues[0]?.value) || 0,
      sessions: parseInt(todayResponse.rows[0].metricValues[1]?.value) || 0
    } : { activeUsers: 0, sessions: 0 };
    const weekData = weekResponse.rows?.[0] ? {
      activeUsers: parseInt(weekResponse.rows[0].metricValues[0]?.value) || 0,
      sessions: parseInt(weekResponse.rows[0].metricValues[1]?.value) || 0
    } : { activeUsers: 0, sessions: 0 };
    const monthData = monthResponse.rows?.[0] ? {
      activeUsers: parseInt(monthResponse.rows[0].metricValues[0]?.value) || 0,
      sessions: parseInt(monthResponse.rows[0].metricValues[1]?.value) || 0
    } : { activeUsers: 0, sessions: 0 };

    const stats = (dailyResponse.rows || []).map(row => ({
      date: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0]?.value) || 0,
      activeUsers: parseInt(row.metricValues[1]?.value) || 0
    }));

    console.log('[GA] GA RESPONSE ROW COUNT:', periodResponse.rows?.length || 0);
    console.log('[GA] Successfully fetched dashboard data from GA4');

    return {
      summary: periodData ? {
        activeUsers: periodData.activeUsers,
        sessions: periodData.sessions,
        screenPageViews: periodData.screenPageViews,
        averageSessionDuration: Math.round(periodData.averageSessionDuration),
        eventCount: periodData.eventCount
      } : null,
      stats,
      timeframes: {
        today: todayData,
        thisWeek: weekData,
        thisMonth: monthData
      }
    };
  } catch (error) {
    console.error('[GA] Error fetching dashboard data from GA4 Data API:', error.message);
    console.log('[GA] Using fallback: SQLite');
    return null;
  }
}

// Google Search Console API helper
async function fetchSearchConsoleData(startDate, endDate) {
  if (!GSC_CLIENT_ID || !GSC_CLIENT_SECRET || !GSC_REFRESH_TOKEN) {
    return null; // API not configured
  }

  try {
    // Get access token using refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GSC_CLIENT_ID,
        client_secret: GSC_CLIENT_SECRET,
        refresh_token: GSC_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('GSC token refresh failed:', await tokenResponse.text());
      return null;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch search analytics
    // GSC API v3 endpoint format
    const hostname = new URL(BASE_URL).hostname;
    const siteUrl = hostname.startsWith('www.') ? hostname.replace('www.', '') : hostname;
    const gscSiteUrl = `sc-domain:${siteUrl}`;
    
    // Format dates as YYYY-MM-DD strings for GSC API
    const startDateStr = typeof startDate === 'string' ? startDate.split('T')[0] : new Date(startDate).toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string' ? endDate.split('T')[0] : new Date(endDate).toISOString().split('T')[0];
    
    console.log('[GSC] Fetching data for site:', gscSiteUrl);
    console.log('[GSC] Date range:', startDateStr, 'to', endDateStr);
    
    const analyticsResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSiteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDateStr,
          endDate: endDateStr,
          dimensions: ['page', 'query'],
          rowLimit: 100,
        }),
      }
    );

    if (!analyticsResponse.ok) {
      console.error('GSC analytics fetch failed:', await analyticsResponse.text());
      return null;
    }

    return await analyticsResponse.json();
  } catch (error) {
    console.error('GSC API error:', error);
    return null;
  }
}

// Real-time traffic stats endpoint
app.get('/api/stats/traffic', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);
    const lastMonthStart = new Date(now);
    lastMonthStart.setDate(now.getDate() - 60);
    const lastMonthEnd = new Date(now);
    lastMonthEnd.setDate(now.getDate() - 30);

    // Try to fetch from Google Analytics Data API first
    let gaData = null;
    if (analyticsClient && GA_PROPERTY_ID) {
      gaData = await fetchGATrafficData(monthStart.toISOString(), now.toISOString());
    }

    if (gaData && gaData.metrics) {
      // Use GA4 data
      console.log('[Traffic] Using GA4 Data API');
      
      // Get today's data separately
      const todayStr = todayStart.toISOString().split('T')[0];
      const nowStr = now.toISOString().split('T')[0];
      const [todayResponse] = await analyticsClient.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: todayStr, endDate: nowStr }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }]
      });
      const todayData = todayResponse.rows?.[0] ? {
        activeUsers: parseInt(todayResponse.rows[0].metricValues[0]?.value) || 0,
        sessions: parseInt(todayResponse.rows[0].metricValues[1]?.value) || 0
      } : { activeUsers: 0, sessions: 0 };

      // Get week data
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const [weekResponse] = await analyticsClient.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: weekStartStr, endDate: nowStr }],
        metrics: [{ name: 'sessions' }]
      });
      const weekData = weekResponse.rows?.[0] ? {
        sessions: parseInt(weekResponse.rows[0].metricValues[0]?.value) || 0
      } : { sessions: 0 };

      // Get last month for comparison
      const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
      const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];
      const [lastMonthResponse] = await analyticsClient.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: lastMonthStartStr, endDate: lastMonthEndStr }],
        metrics: [{ name: 'sessions' }]
      });
      const lastMonthSessions = lastMonthResponse.rows?.[0] 
        ? parseInt(lastMonthResponse.rows[0].metricValues[0]?.value) || 0 
        : 0;

      const monthChange = lastMonthSessions > 0
        ? ((gaData.metrics.sessions - lastMonthSessions) / lastMonthSessions * 100).toFixed(1)
        : 0;

      res.json({
        summary: {
          visitorsToday: todayData.activeUsers || 0,
          visitsWeek: weekData.sessions || 0,
          visitsMonth: gaData.metrics.sessions || 0,
          monthChange: parseFloat(monthChange),
          activeUsers: gaData.metrics.activeUsers || 0,
          sessionsLast30Min: gaData.metrics.activeUsers || 0, // Approximate
          avgSessionDuration: Math.round(gaData.metrics.averageSessionDuration || 0)
        },
        graph: gaData.graph || [],
        sources: gaData.sources || [],
        topPages: gaData.topPages || [],
        gscEnabled: false,
        dataSource: 'GA4'
      });
    } else {
      // Fallback to SQLite
      console.log('[Traffic] Using fallback: SQLite');

      // Visitors today
      const visitorsToday = db.prepare(`
        SELECT COUNT(DISTINCT session_id) as count
        FROM user_sessions
        WHERE started_at >= ?
      `).get(todayStart.toISOString());

      // Visits this week
      const visitsWeek = db.prepare(`
        SELECT COUNT(DISTINCT session_id) as count
        FROM user_sessions
        WHERE started_at >= ?
      `).get(weekStart.toISOString());

      // Visits this month
      const visitsMonth = db.prepare(`
        SELECT COUNT(DISTINCT session_id) as count
        FROM user_sessions
        WHERE started_at >= ?
      `).get(monthStart.toISOString());

      // Last month for comparison
      const visitsLastMonth = db.prepare(`
        SELECT COUNT(DISTINCT session_id) as count
        FROM user_sessions
        WHERE started_at >= ? AND started_at < ?
      `).get(lastMonthStart.toISOString(), lastMonthEnd.toISOString());

      // Active users (sessions in last 30 minutes)
      const activeUsers = db.prepare(`
        SELECT COUNT(DISTINCT session_id) as count
        FROM user_sessions
        WHERE last_activity >= datetime('now', '-30 minutes')
      `).get();

      // Average session duration
      const avgDuration = db.prepare(`
        SELECT AVG(duration_seconds) as avg
        FROM user_sessions
        WHERE duration_seconds IS NOT NULL
        AND started_at >= ?
      `).get(monthStart.toISOString());

      // Calculate percentage change
      const monthChange = visitsLastMonth?.count > 0
        ? ((visitsMonth?.count - visitsLastMonth?.count) / visitsLastMonth.count * 100).toFixed(1)
        : 0;

      // Traffic graph data (last 30 days) - ensure all dates are included
      const trafficGraphRaw = db.prepare(`
        SELECT 
          DATE(started_at) as date,
          COUNT(DISTINCT session_id) as visits,
          COUNT(*) as sessions
        FROM user_sessions
        WHERE started_at >= datetime('now', '-30 days')
        GROUP BY DATE(started_at)
        ORDER BY date ASC
      `).all();

      // Fill in missing dates with zeros to ensure 30 data points
      const graphMap = new Map();
      trafficGraphRaw.forEach(item => {
        // Ensure date is in YYYY-MM-DD format
        let dateStr = item.date;
        if (dateStr && !dateStr.includes('-')) {
          // If date is in YYYYMMDD format, convert it
          if (dateStr.length === 8) {
            dateStr = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
          }
        }
        graphMap.set(dateStr, {
          date: dateStr,
          visits: Number(item.visits) || 0,
          sessions: Number(item.sessions) || 0
        });
      });

      // Generate array for last 30 days, filling missing dates with zeros
      const trafficGraph = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        if (graphMap.has(dateStr)) {
          trafficGraph.push(graphMap.get(dateStr));
        } else {
          trafficGraph.push({
            date: dateStr,
            visits: 0,
            sessions: 0
          });
        }
      }
      
      console.log('[Traffic] SQLite graph data points:', trafficGraph.length);
      console.log('[Traffic] Graph sample (first 3):', trafficGraph.slice(0, 3));

      // Traffic sources
      const trafficSources = db.prepare(`
        SELECT 
          CASE
            WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
            WHEN referrer LIKE '%google%' OR referrer LIKE '%bing%' OR referrer LIKE '%yahoo%' THEN 'Organic'
            WHEN referrer LIKE '%facebook%' OR referrer LIKE '%twitter%' OR referrer LIKE '%linkedin%' OR referrer LIKE '%instagram%' THEN 'Social'
            ELSE 'Referral'
          END as source,
          COUNT(DISTINCT session_id) as count
        FROM user_sessions
        WHERE started_at >= ?
        GROUP BY source
      `).all(monthStart.toISOString());

      // Top pages
      const topPages = db.prepare(`
        SELECT 
          post_slug as url,
          COUNT(*) as views,
          COUNT(DISTINCT session_id) as unique_views,
          AVG(CASE WHEN scroll_depth > 0.5 THEN 1 ELSE 0 END) * 100 as bounce_rate,
          COUNT(*) * 1.0 / (SELECT COUNT(*) FROM blog_views WHERE viewed_at >= ?) * 100 as seo_score
        FROM blog_views
        WHERE viewed_at >= ?
        GROUP BY post_slug
        ORDER BY views DESC
        LIMIT 10
      `).all(monthStart.toISOString(), monthStart.toISOString());

      // Try to enhance with Google Search Console data if available
      let gscData = null;
      if (!GSC_CLIENT_ID || !GSC_CLIENT_SECRET || !GSC_REFRESH_TOKEN) {
        console.warn('[ENV] Google Search Console credentials are not fully configured');
      }
      if (GSC_CLIENT_ID && GSC_CLIENT_SECRET && GSC_REFRESH_TOKEN) {
        const gscStartDate = monthStart.toISOString().split('T')[0];
        const gscEndDate = now.toISOString().split('T')[0];
        gscData = await fetchSearchConsoleData(gscStartDate, gscEndDate);
      }

      // Enhance top pages with GSC data if available
      const enhancedTopPages = topPages.map(page => {
        if (gscData && gscData.rows) {
          const gscPage = gscData.rows.find((row) =>
            row.keys && row.keys[0] && row.keys[0].includes(page.url)
          );
          if (gscPage) {
            return {
              ...page,
              impressions: gscPage.impressions || 0,
              clicks: gscPage.clicks || 0,
              ctr: gscPage.ctr || 0,
              position: gscPage.position || 0,
            };
          }
        }
        return page;
      });

      res.json({
        summary: {
          visitorsToday: visitorsToday?.count || 0,
          visitsWeek: visitsWeek?.count || 0,
          visitsMonth: visitsMonth?.count || 0,
          monthChange: parseFloat(monthChange),
          activeUsers: activeUsers?.count || 0,
          sessionsLast30Min: activeUsers?.count || 0,
          avgSessionDuration: Math.round(avgDuration?.avg || 0)
        },
        graph: trafficGraph,
        sources: trafficSources,
        topPages: enhancedTopPages,
        gscEnabled: !!gscData,
        dataSource: 'SQLite'
      });
    }
  } catch (error) {
    console.error('Traffic stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SEO stats endpoint
app.get('/api/stats/seo', authenticateToken, async (req, res) => {
  try {
    // Get indexed pages count from Google Search Console if available
    let indexedPagesCount = 0;
    let gscIndexedData = null;

    if (GSC_CLIENT_ID && GSC_CLIENT_SECRET && GSC_REFRESH_TOKEN) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GSC_CLIENT_ID,
            client_secret: GSC_CLIENT_SECRET,
            refresh_token: GSC_REFRESH_TOKEN,
            grant_type: 'refresh_token',
          }),
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const siteUrl = `sc-domain:${new URL(BASE_URL).hostname}`;

          // Get sitemap submission status
          const sitemapResponse = await fetch(
            `https://searchconsole.googleapis.com/v1/urlSearchAnalytics/searchAnalytics?siteUrl=${encodeURIComponent(siteUrl)}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                dimensions: ['page'],
                rowLimit: 1,
              }),
            }
          );

          if (sitemapResponse.ok) {
            gscIndexedData = await sitemapResponse.json();
            // Estimate indexed pages from unique pages in results
            // Note: This is an approximation - GSC doesn't provide exact count via API
          }
        }
      } catch (error) {
        console.error('GSC API error in SEO endpoint:', error);
      }
    }

    // Scan pages from sitemap
    const pages = await getSitemapUrls();
    const scanResults = await scanSite(pages.slice(0, 20)); // Scan up to 20 pages

    let indexedPages = 0;
    let seoErrors = 0;
    let schemaErrors = 0;
    const issues = {
      missingMetaTags: [],
      duplicateTitles: [],
      brokenLinks: [],
      invalidStructuredData: [],
      indexabilityErrors: []
    };

    const titles = new Map();
    const defaultTitle = 'AI Color Contrast Checker | WCAG 2.1 and 2.2 Tool';
    const defaultTitleUrls = [];

    scanResults.forEach(result => {
      if (!result.error && result.status === 200) {
        indexedPages++;

        if (result.seo) {
          // Check for missing meta tags
          if (!result.seo.hasTitle) {
            issues.missingMetaTags.push({ url: result.url, issue: 'Missing title tag' });
            seoErrors++;
          }
          if (!result.seo.hasMetaDescription) {
            issues.missingMetaTags.push({ url: result.url, issue: 'Missing meta description' });
            seoErrors++;
          }

          // Check for duplicate titles
          // Note: For React SPAs, titles are set client-side via react-helmet.
          // The scanner reads static HTML which shows the default title from index.html.
          // Only flag as duplicate if multiple pages have the same NON-DEFAULT title.
          // The default title is expected for all pages until the production site is rebuilt.
          if (result.seo.title) {
            const title = result.seo.title.trim();
            
            // Normalize title for comparison (remove extra spaces, normalize case)
            const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ').trim();
            const normalizedDefaultTitle = defaultTitle.toLowerCase().replace(/\s+/g, ' ').trim();
            
            // Track default title separately (expected for React SPA until deployment)
            // Don't count it as a duplicate - it's a known limitation of static HTML scanning
            if (normalizedTitle === normalizedDefaultTitle || title === defaultTitle) {
              defaultTitleUrls.push(result.url);
              console.log(`[SEO] Default title detected for ${result.url}: "${title}"`);
              // Skip duplicate checking for default title - it's expected
            } else {
              // Check for actual duplicates of non-default titles
              if (titles.has(title)) {
                const existingUrl = titles.get(title);
                console.log(`[SEO] Duplicate title found: "${title}" on ${result.url} (already exists on ${existingUrl})`);
                issues.duplicateTitles.push({ url: result.url, title: title });
                seoErrors++;
              } else {
                titles.set(title, result.url);
                console.log(`[SEO] Unique title: "${title}" on ${result.url}`);
              }
            }
          }

          // Check structured data
          if (result.seo.issues) {
            result.seo.issues.forEach(issue => {
              if (issue.type === 'invalid_structured_data') {
                issues.invalidStructuredData.push({ url: result.url, error: issue.message });
                schemaErrors++;
              }
            });
          }
        }
      } else if (result.error || result.status !== 200) {
        issues.indexabilityErrors.push({ url: result.url, error: result.error || `HTTP ${result.status}` });
        seoErrors++;
      }
    });

    // Use GSC indexed count if available, otherwise use scanned pages count
    const finalIndexedPages = gscIndexedData ? (gscIndexedData.rowCount || indexedPages) : indexedPages;

    // Check for broken links (simplified - check internal links)
    const allLinks = new Set();
    scanResults.forEach(result => {
      if (result.seo && result.seo.links) {
        result.seo.links.forEach(link => {
          if (link.startsWith('/') || link.startsWith(BASE_URL)) {
            allLinks.add(link);
          }
        });
      }
    });

    // Filter out default title duplicates from the issues array before calculating score
    // The duplicateTitles array should only contain actual duplicates, not default titles
    const filteredIssues = {
      ...issues,
      duplicateTitles: issues.duplicateTitles.filter(item => {
        const title = item.title?.trim() || '';
        const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ').trim();
        const normalizedDefaultTitle = defaultTitle.toLowerCase().replace(/\s+/g, ' ').trim();
        // Exclude default title from duplicate list
        return normalizedTitle !== normalizedDefaultTitle && title !== defaultTitle;
      })
    };

    // Calculate SEO Score (0-100)
    // Base score starts at 100, deduct points for errors
    let seoScore = 100;
    const totalIssues = seoErrors + schemaErrors + issues.brokenLinks.length;
    const pagesScanned = scanResults.length;
    const totalPages = finalIndexedPages || pagesScanned;
    
    if (totalPages > 0) {
      // Deduct points based on error rate (up to 50 points)
      const errorRate = totalIssues / totalPages;
      seoScore = Math.max(0, 100 - (errorRate * 50));
      
      // Deduct up to 20 points for duplicate titles (2 points each, max 20)
      // Only count non-default title duplicates (already filtered)
      const duplicatePenalty = Math.min(filteredIssues.duplicateTitles.length * 2, 20);
      seoScore = Math.max(0, seoScore - duplicatePenalty);
      
      // Deduct up to 10 points for missing meta tags
      const missingMetaPenalty = Math.min(issues.missingMetaTags.length * 1, 10);
      seoScore = Math.max(0, seoScore - missingMetaPenalty);
    } else {
      seoScore = 0; // No pages scanned
    }
    
    // Ensure seoScore is always a valid number
    const finalSeoScore = Math.max(0, Math.min(100, Math.round(seoScore || 0)));

    const response = {
      indexedPages: Number(finalIndexedPages) || 0,
      pagesScanned: Number(scanResults.length) || 0,
      seoErrors: Number(seoErrors) || 0,
      schemaErrors: Number(schemaErrors) || 0,
      brokenLinks: Number(issues.brokenLinks.length) || 0,
      seoScore: finalSeoScore,
      issues: filteredIssues || {
        missingMetaTags: [],
        duplicateTitles: [],
        brokenLinks: [],
        invalidStructuredData: [],
        indexabilityErrors: []
      },
      defaultTitlePages: defaultTitleUrls.length > 1 ? defaultTitleUrls.length : 0,
      gscEnabled: !!(GSC_CLIENT_ID && GSC_CLIENT_SECRET && GSC_REFRESH_TOKEN)
    };

    // Debug logging
    console.log('[SEO] Title analysis:', {
      totalPagesScanned: scanResults.length,
      defaultTitlePages: defaultTitleUrls.length,
      defaultTitleUrls: defaultTitleUrls,
      uniqueNonDefaultTitles: titles.size,
      duplicateTitlesBeforeFilter: issues.duplicateTitles.length,
      duplicateTitlesAfterFilter: filteredIssues.duplicateTitles.length,
      duplicateTitles: filteredIssues.duplicateTitles
    });
    console.log('[SEO] Calculated values:', {
      seoScore: finalSeoScore,
      seoErrors,
      schemaErrors,
      duplicateTitles: filteredIssues.duplicateTitles.length,
      // Note: defaultTitleUrls contains pages with default title (expected for React SPA)
      // These are not included in duplicateTitles count
      defaultTitlePages: defaultTitleUrls.length > 1 ? defaultTitleUrls.length : 0,
      missingMetaTags: issues.missingMetaTags.length,
      totalPages,
      totalIssues
    });
    console.log('[SEO] Response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('SEO stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      indexedPages: 0,
      pagesScanned: 0,
      seoErrors: 0,
      schemaErrors: 0,
      brokenLinks: 0,
      seoScore: 0,
      issues: {
        missingMetaTags: [],
        duplicateTitles: [],
        brokenLinks: [],
        invalidStructuredData: [],
        indexabilityErrors: []
      },
      gscEnabled: false
    });
  }
});

// Accessibility stats endpoint
app.get('/api/stats/accessibility', authenticateToken, async (req, res) => {
  try {
    const pages = await getSitemapUrls();
    const scanResults = await scanSite(pages.slice(0, 10));

    let totalAA = 0;
    let totalAAAPass = 0;
    let totalAAAFail = 0;
    let totalAAFail = 0;
    const errors = {
      contrastFailures: [],
      missingLabels: [],
      ariaIssues: [],
      headingOrderViolations: []
    };
    const failingPages = [];

    scanResults.forEach(result => {
      if (!result.error && result.accessibility) {
        const acc = result.accessibility;
        // Use stats object from checkAccessibility function
        const stats = acc.stats || acc;
        totalAA += (stats.aaPass || 0) + (stats.aaFail || 0);
        totalAAAPass += stats.aaaPass || 0;
        totalAAAFail += stats.aaaFail || 0;
        totalAAFail += stats.aaFail || 0;

        if (acc.errors && acc.errors.length > 0) {
          failingPages.push({ url: result.url, errorCount: acc.errors.length });

          acc.errors.forEach(error => {
            if (error.type === 'missing_alt') {
              errors.contrastFailures.push({ url: result.url, message: error.message });
            } else if (error.type === 'missing_label') {
              errors.missingLabels.push({ url: result.url, message: error.message });
            } else if (error.type && error.type.includes('aria')) {
              errors.ariaIssues.push({ url: result.url, message: error.message });
            } else if (error.type === 'heading_hierarchy') {
              errors.headingOrderViolations.push({ url: result.url, message: error.message });
            }
          });
        }
      }
    });

    const totalPages = scanResults.filter(r => !r.error && r.accessibility).length;
    const aaPass = Math.max(0, totalAA - totalAAFail);
    const aaaPass = Math.max(0, totalAAAPass);
    const aaPassRate = totalAA > 0 ? ((aaPass / totalAA) * 100).toFixed(1) : (totalPages > 0 ? '100.0' : '0');
    const aaaPassRate = (totalAAAPass + totalAAAFail) > 0
      ? ((aaaPass / (totalAAAPass + totalAAAFail)) * 100).toFixed(1)
      : (totalPages > 0 ? '100.0' : '0');

    // Ensure all values are numbers, not undefined - use explicit defaults
    const response = {
      totalPages: totalPages ? Number(totalPages) : 0,
      aaPass: aaPass ? Number(aaPass) : 0,
      aaaPass: aaaPass ? Number(aaaPass) : 0,
      aaPassRate: aaPassRate ? Number(parseFloat(aaPassRate)) : 0,
      aaaPassRate: aaaPassRate ? Number(parseFloat(aaaPassRate)) : 0,
      pagesFailing: failingPages ? Number(failingPages.length) : 0,
      errors: errors || {
        contrastFailures: [],
        missingLabels: [],
        ariaIssues: [],
        headingOrderViolations: []
      }
    };

    // Debug logging
    console.log('[Accessibility] Calculated values:', {
      totalPages: response.totalPages,
      totalAA,
      totalAAFail,
      aaPass: response.aaPass,
      totalAAAPass,
      aaaPass: response.aaaPass,
      aaPassRate: response.aaPassRate,
      aaaPassRate: response.aaaPassRate,
      pagesFailing: response.pagesFailing,
      scanResultsCount: scanResults.length,
      validResultsCount: totalPages
    });
    console.log('[Accessibility] Response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Accessibility stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      totalPages: 0,
      aaPass: 0,
      aaaPass: 0,
      aaPassRate: 0,
      aaaPassRate: 0,
      pagesFailing: 0,
      errors: {
        contrastFailures: [],
        missingLabels: [],
        ariaIssues: [],
        headingOrderViolations: []
      }
    });
  }
});

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

// ML Model Health Check endpoint
app.get('/api/admin/ml-status', authenticateToken, (req, res) => {
  try {
    const modelPath = path.resolve(projectRoot, 'public/pretrained-color-model');
    const modelJsonPath = path.join(modelPath, 'model.json');
    const modelBinPath = path.join(modelPath, 'group1-shard1of1.bin');
    
    const modelExists = fs.existsSync(modelJsonPath);
    const weightsExist = fs.existsSync(modelBinPath);
    const loaded = modelExists && weightsExist;
    
    let modelInfo = {
      loaded,
      modelName: 'pretrained-color-model',
      version: '1.0.0',
      loadTimestamp: null,
      memoryFootprint: null,
      errors: []
    };
    
    if (modelExists) {
      try {
        const stats = fs.statSync(modelJsonPath);
        modelInfo.loadTimestamp = stats.mtime.toISOString();
        modelInfo.memoryFootprint = stats.size + (weightsExist ? fs.statSync(modelBinPath).size : 0);
      } catch (error) {
        modelInfo.errors.push(`Failed to read model stats: ${error.message}`);
      }
    } else {
      modelInfo.errors.push('Model JSON file not found');
    }
    
    if (!weightsExist && modelExists) {
      modelInfo.errors.push('Model weights file not found');
    }
    
    res.json(modelInfo);
  } catch (error) {
    console.error('ML status check error:', error);
    res.status(500).json({
      loaded: false,
      modelName: 'pretrained-color-model',
      version: 'unknown',
      errors: [error.message]
    });
  }
});

// System health endpoint
app.get('/api/stats/system', authenticateToken, (req, res) => {
  try {
    // Get server uptime using Node.js runtime API
    const uptime = process.uptime();

    // Get memory usage using Node.js runtime API
    const memUsage = process.memoryUsage();

    // Get app version from package.json
    const packagePath = path.resolve(projectRoot, 'package.json');
    let buildVersion = '1.0.0';
    let lastDeployment = new Date().toISOString();

    try {
      if (fs.existsSync(packagePath)) {
        // Get version from package.json
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        buildVersion = packageJson.version || '1.0.0';

        // Get last deployment timestamp from package.json modification time
        const packageStats = fs.statSync(packagePath);
        lastDeployment = packageStats.mtime.toISOString();
      }
    } catch (packageError) {
      console.error('Error reading package.json:', packageError);
      // Continue with defaults if package.json read fails
    }

    // Check if source maps are enabled - check vite config
    let sourceMapsEnabled = false;
    try {
      const viteConfigPath = path.resolve(projectRoot, 'vite.config.ts');
      if (fs.existsSync(viteConfigPath)) {
        const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
        // Check for various source map configurations
        sourceMapsEnabled = viteConfig.includes('sourcemap: true') ||
          viteConfig.includes('sourcemap: "inline"') ||
          viteConfig.includes("sourcemap: 'inline'") ||
          viteConfig.includes('sourcemap: "inline-source-map"') ||
          viteConfig.includes("sourcemap: 'inline-source-map'");
      }
    } catch (viteConfigError) {
      console.error('Error reading vite.config.ts:', viteConfigError);
      // Default to false if config read fails
    }

    // Calculate error rate from logs (simplified)
    let errorCount = 0;
    try {
      const errorLogPath = path.join(logsDir, 'error.log');
      if (fs.existsSync(errorLogPath)) {
        const errorLog = fs.readFileSync(errorLogPath, 'utf8');
        const errorLines = errorLog.split('\n').filter(line => line.includes('ERROR'));
        errorCount = errorLines.length;
      }
    } catch (logError) {
      console.error('Error reading error log:', logError);
      // Continue with 0 if log read fails
    }

    // Return real system data
    res.json({
      uptime: Math.floor(uptime),
      uptimeFormatted: formatUptime(uptime),
      errorRate: errorCount,
      version: buildVersion,
      lastDeployment,
      sourceMapsEnabled,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // Resident Set Size
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        used: Math.round(memUsage.heapUsed / 1024 / 1024) // Legacy field for frontend compatibility
      },
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ error: 'system stats unavailable' });
  }
});

// Dynamic sitemap generator
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://www.thecolorcontrastchecker.com';
    const posts = blogPosts.getPublished();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    
    <!-- Core Tool Page (Highest Priority) -->
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    
    <!-- Blog Index (High Priority, Frequently Updated) -->
    <url>
        <loc>${baseUrl}/blog</loc>
        <lastmod>${posts.length > 0 ? new Date(posts[0].date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Resources Page (High Priority Content Hub) -->
    <url>
        <loc>${baseUrl}/resources</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Secondary Informational Pages -->
    <url>
        <loc>${baseUrl}/about</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/privacy-policy</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>${baseUrl}/terms-of-service</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.5</priority>
    </url>

    <!-- Blog Posts (Dynamic) -->`;

    posts.forEach(post => {
      let lastmod = new Date().toISOString().split('T')[0];
      if (post.updated_at) {
        lastmod = new Date(post.updated_at).toISOString().split('T')[0];
      } else if (post.date) {
        lastmod = new Date(post.date).toISOString().split('T')[0];
      }

      sitemap += `
    <url>
        <loc>${baseUrl}/blog/${encodeURIComponent(post.slug)}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>`;

      if (post.featured_image_url) {
        const imageUrl = post.featured_image_url.startsWith('http')
          ? post.featured_image_url
          : baseUrl + post.featured_image_url;
        sitemap += `
        <image:image>
            <image:loc>${imageUrl}</image:loc>
            <image:title>${post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>
            <image:caption>${(post.excerpt || post.title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:caption>
        </image:image>`;
      }

      sitemap += `
    </url>`;
    });

    sitemap += `
</urlset>`;

    // SEO: Set proper headers for sitemap
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.set('X-Robots-Tag', 'noindex'); // Don't index the sitemap itself
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// ============================================
// HEALTH CHECK & DIAGNOSTIC ENDPOINTS
// ============================================

// ============================================
// ACCOUNT UNLOCK ENDPOINTS
// ============================================

// Unlock a specific account (admin only)
app.post('/api/admin/unlock-account', authenticateToken, (req, res) => {
  try {
    const { username, userId } = req.body;
    const identifier = userId || username;
    
    if (!identifier) {
      return res.status(400).json({ error: 'Username or userId required' });
    }

    const result = unlockAccount(identifier);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    // Log the action
    auditLogs.log(
      req.user.id,
      req.user.username,
      'account_unlock',
      'user',
      null,
      JSON.stringify({ unlocked: result.username, wasLocked: result.wasLocked }),
      req.ip,
      req.get('user-agent')
    );

    res.json(result);
  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get account lock status
app.get('/api/admin/account-status/:identifier', authenticateToken, (req, res) => {
  try {
    const result = getAccountStatus(req.params.identifier);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Account status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all locked accounts
app.get('/api/admin/locked-accounts', authenticateToken, (req, res) => {
  try {
    const result = listLockedAccounts();
    res.json(result);
  } catch (error) {
    console.error('List locked accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unlock all accounts (super admin only)
app.post('/api/admin/unlock-all-accounts', authenticateToken, (req, res) => {
  try {
    // Check if user is super_admin
    const user = users.findByUsername(req.user.username);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const result = unlockAllAccounts();

    // Log the action
    auditLogs.log(
      req.user.id,
      req.user.username,
      'bulk_account_unlock',
      'user',
      null,
      JSON.stringify({ unlockedCount: result.unlockedCount }),
      req.ip,
      req.get('user-agent')
    );

    res.json(result);
  } catch (error) {
    console.error('Unlock all accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate blog cache (admin utility) - removed static generation
app.post('/api/admin/regenerate-blog-cache', authenticateToken, (req, res) => {
  try {
    res.json({ 
      message: 'Blog cache regeneration not needed - using API only'
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Full blog sync (import from export file - no static generation)
app.post('/api/admin/sync-blogs', authenticateToken, (req, res) => {
  try {
    console.log('📚 Admin triggered blog sync...');
    const syncResult = performStartupSync();
    res.json({ 
      message: 'Blog sync completed (API-only, no file generation)', 
      ...syncResult
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export blogs - REMOVED (zero file output policy)
app.post('/api/admin/export-blogs', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Blog export removed - zero file output policy. Use database backup tools for backups.',
    exported: 0
  });
});

// Diagnostic endpoint - removed static HTML path check
app.get('/api/debug/html-path', (req, res) => {
  res.json({
    message: 'Static HTML generation removed - using API only',
    staticGeneration: false
  });
});

// Health check endpoint removed - using the one defined earlier at line 1064

// Comprehensive diagnostic endpoint
app.get('/api/diagnostics', (req, res) => {
  try {
    const diagnostics = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
        },
        workingDirectory: process.cwd(),
        serverDirectory: __dirname,
        projectRoot: projectRoot
      },
      configuration: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        port: PORT,
        jwtSecretSet: JWT_SECRET !== 'your-secret-key-change-in-production',
        bcryptRounds: BCRYPT_ROUNDS,
        sessionTimeout: SESSION_TIMEOUT_MS,
        trustProxy: TRUST_PROXY
      },
      filesystem: {
        database: {
          path: dbPath,
          exists: fs.existsSync(dbPath),
          readable: fs.existsSync(dbPath) ? (() => {
            try {
              fs.accessSync(dbPath, fs.constants.R_OK);
              return true;
            } catch {
              return false;
            }
          })() : false,
          writable: fs.existsSync(dbPath) ? (() => {
            try {
              fs.accessSync(dbPath, fs.constants.W_OK);
              return true;
            } catch {
              return false;
            }
          })() : false
        },
        uploads: {
          path: uploadsDir,
          exists: fs.existsSync(uploadsDir),
          writable: fs.existsSync(uploadsDir) ? (() => {
            try {
              fs.accessSync(uploadsDir, fs.constants.W_OK);
              return true;
            } catch {
              return false;
            }
          })() : false
        },
        envFile: {
          path: envPath,
          exists: fs.existsSync(envPath)
        }
      },
      database: {
        initialized: true,
        // Try to get a simple count to verify DB is working
        testQuery: (() => {
          try {
            const test = blogPosts.getAll();
            return { success: true, postCount: test.length };
          } catch (error) {
            return { success: false, error: error.message };
          }
        })()
      },
      dependencies: {
        express: 'loaded',
        sqlite: 'loaded',
        jwt: 'loaded',
        multer: 'loaded'
      }
    };

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Diagnostic check failed',
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Error logging middleware (must be after all routes)
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`\n❌ [${timestamp}] ERROR:`);
  console.error(`   Method: ${req.method}`);
  console.error(`   URL: ${req.url}`);
  console.error(`   IP: ${req.ip || req.connection.remoteAddress}`);
  console.error(`   Error: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(`   Stack: ${err.stack}`);
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('✅ CMS Backend Server Started Successfully!');
  console.log('='.repeat(60));
  console.log(`\n🌐 Server running on: http://localhost:${PORT}`);
  console.log(`📝 Default admin credentials: username=admin, password=admin123`);
  console.log(`🔒 Security headers: ✅ Enabled`);
  console.log(`🛡️  Rate limiting: ✅ Active`);
  console.log(`\n📊 Diagnostic Endpoints:`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   Diagnostics: http://localhost:${PORT}/api/diagnostics`);
  console.log(`\n⚠️  SECURITY: Change default admin password after first login!`);
  console.log('='.repeat(60) + '\n');
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('\n' + '='.repeat(60));
    console.error('❌ PORT ALREADY IN USE');
    console.error('='.repeat(60));
    console.error(`\n⚠️  Port ${PORT} is already in use by another process.`);
    console.error('\n💡 Solutions:');
    console.error('   1. Stop the existing server process');
    console.error('   2. Or use a different port by setting PORT environment variable');
    console.error('\n🔧 To find and kill the process using port 3001:');
    if (process.platform === 'win32') {
      console.error('   Windows: Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force');
      console.error('   Or: netstat -ano | findstr :3001');
    } else {
      console.error('   Linux/Mac: lsof -ti:3001 | xargs kill -9');
      console.error('   Or: fuser -k 3001/tcp');
    }
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  } else {
    console.error('\n❌ Server failed to start:', error);
    process.exit(1);
  }
});

// Graceful shutdown handlers to prevent database lock files
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection to prevent lock files
    closeDatabase();
    
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    closeDatabase();
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

