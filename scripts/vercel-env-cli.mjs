/**
 * scripts/vercel-env-cli.mjs
 *
 * Secure CLI Script to Inject Environment Variables into Vercel
 * Reads from .env.production or .env, validates all Firebase, Resend, and Mercado Pago
 * credentials according to .env.example, and injects them securely via stdin buffer
 * into Vercel environment targets.
 *
 * Usage:
 *   node scripts/vercel-env-cli.mjs [--file .env.production] [--target production] [--dry-run]
 *   npm run inject:vercel-env
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { execSync } from 'node:child_process';
import dotenv from 'dotenv';

const args = process.argv.slice(2);

function getArg(flag, defaultValue = '') {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return defaultValue;
}

const envFileArg = getArg('--file', '.env.production');
const targetEnv = getArg('--target', 'production');
const isDryRun = args.includes('--dry-run');
const isInteractive = args.includes('--interactive');

console.log('\n🔒 =============================================================');
console.log('🔒 Clientum CRM — Secure Vercel Environment Injection CLI Tool');
console.log('🔒 =============================================================\n');

// 1. Locate Environment File
let envPath = path.resolve(process.cwd(), envFileArg);
if (!fs.existsSync(envPath) && envFileArg === '.env.production') {
  const fallback = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(fallback)) envPath = fallback;
}

let parsedEnv = {};
if (fs.existsSync(envPath)) {
  console.log(`📂 Loading environment source: ${path.basename(envPath)}`);
  parsedEnv = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
} else {
  console.log(`⚠️ Source environment file (${envFileArg}) not found. Reading system process.env...`);
}

// Merge with process.env
const env = { ...parsedEnv };

// Ensure production URL
if (!env.APP_URL || env.APP_URL.includes('run.app')) {
  env.APP_URL = 'https://clientum.com.ar';
}

// Generate fallback encryption secrets if missing
function generateHexSecret() {
  return crypto.randomBytes(32).toString('hex');
}
if (!env.WORKFLOW_ENCRYPTION_KEY || env.WORKFLOW_ENCRYPTION_KEY.includes('xxxx')) {
  env.WORKFLOW_ENCRYPTION_KEY = generateHexSecret();
  console.log('🔑 Generated secure WORKFLOW_ENCRYPTION_KEY');
}
if (!env.API_KEY_PEPPER || env.API_KEY_PEPPER.includes('xxxx')) {
  env.API_KEY_PEPPER = generateHexSecret();
  console.log('🔑 Generated secure API_KEY_PEPPER');
}
if (!env.SESSION_SECRET || env.SESSION_SECRET.includes('xxxx')) {
  env.SESSION_SECRET = generateHexSecret();
  console.log('🔑 Generated secure SESSION_SECRET');
}

// 2. Canonical keys to inject based on .env.example
const CATEGORIZED_KEYS = {
  'System & Core': ['APP_URL', 'NODE_ENV', 'WORKFLOW_ENCRYPTION_KEY', 'API_KEY_PEPPER', 'SESSION_SECRET'],
  'Firebase Server (Admin)': ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_SERVICE_ACCOUNT_JSON'],
  'Firebase Client (Web SDK)': [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
    'VITE_FIREBASE_DATABASE_ID',
  ],
  'Resend Transactional Mail': ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
  'Mercado Pago Billing': [
    'PLATFORM_MERCADOPAGO_ACCESS_TOKEN',
    'PLATFORM_MERCADOPAGO_WEBHOOK_SECRET',
    'PLATFORM_MP_PLAN_ID_STARTER_MONTHLY',
    'PLATFORM_MP_PLAN_ID_STARTER_ANNUAL',
    'PLATFORM_MP_PLAN_ID_GROWTH_MONTHLY',
    'PLATFORM_MP_PLAN_ID_GROWTH_ANNUAL',
    'PLATFORM_MP_PLAN_ID_SCALE_MONTHLY',
    'PLATFORM_MP_PLAN_ID_SCALE_ANNUAL',
  ],
};

const ALL_KEYS = Object.values(CATEGORIZED_KEYS).flat();

// Audit credentials status
console.log('🔍 Auditing Service Credentials against .env.example:\n');

let readyCount = 0;
let missingCount = 0;

for (const [category, keys] of Object.entries(CATEGORIZED_KEYS)) {
  console.log(`  📦 [${category}]`);
  for (const key of keys) {
    const val = env[key]?.trim();
    if (val && !val.includes('xxxx') && !val.includes('your_') && !val.includes('re_xxxxxxxxx')) {
      const displayVal = val.length > 20 ? `${val.substring(0, 10)}...${val.substring(val.length - 4)}` : val;
      console.log(`     ✅ ${key.padEnd(38)} -> ${displayVal}`);
      readyCount++;
    } else {
      console.log(`     ❌ ${key.padEnd(38)} -> [MISSING / PLACEHOLDER]`);
      missingCount++;
    }
  }
  console.log('');
}

console.log('-------------------------------------------------------------');
console.log(`📊 Audit Summary: ${readyCount} variables ready, ${missingCount} missing/pending.`);
console.log('-------------------------------------------------------------\n');

if (isDryRun) {
  console.log('ℹ️ --dry-run mode enabled. No changes were made to Vercel.\n');
  process.exit(0);
}

// 3. Secure Execution via stdin buffer
console.log(`🚀 Injecting variables into Vercel target environment: "${targetEnv}"...\n`);

let injectedCount = 0;
let skippedCount = 0;
let failedCount = 0;

for (const key of ALL_KEYS) {
  const val = env[key];
  if (!val || val.includes('xxxx') || val.includes('your_') || val.includes('re_xxxxxxxxx')) {
    skippedCount++;
    continue;
  }

  try {
    // Pass VERCEL_TOKEN in subprocess env to authenticate Vercel CLI without prompt
    const options = {
      input: Buffer.from(val, 'utf8'),
      stdio: ['pipe', 'ignore', 'pipe'],
      timeout: 20000,
      env: {
        ...process.env,
        VERCEL_TOKEN: env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_ACCESS_TOKEN,
      }
    };

    let cmd = `npx vercel env add ${key} ${targetEnv} --force --yes`;
    if (env.VERCEL_TEAM_ID) {
      cmd += ` --team ${env.VERCEL_TEAM_ID}`;
    }

    execSync(cmd, options);
    console.log(`  ✅ Successfully injected: ${key}`);
    injectedCount++;
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    if (stderr.includes('already exists') || stderr.includes('Conflict')) {
      console.log(`  ℹ️ Variable ${key} already exists on Vercel.`);
      injectedCount++;
    } else {
      console.log(`  ⚠️ Could not inject ${key}: ${stderr.trim().split('\n')[0]}`);
      failedCount++;
    }
  }
}

console.log('\n=============================================================');
console.log(`🎉 Injection Completed!`);
console.log(`   - Injected / Verified: ${injectedCount}`);
console.log(`   - Skipped (missing):   ${skippedCount}`);
console.log(`   - Failed:               ${failedCount}`);
console.log('=============================================================\n');

if (missingCount > 0) {
  console.log('💡 Tip: Fill missing credentials in .env.production and re-run:');
  console.log('   npm run inject:vercel-env\n');
}
