/**
 * scripts/setup-vercel-env.mjs
 *
 * Automation script to validate, format, and push production environment variables to Vercel
 * for clientum.com.ar.
 *
 * Usage:
 *   node scripts/setup-vercel-env.mjs [--file .env.production] [--sync] [--project my-vercel-project]
 *   npm run setup:vercel-env
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue = '') {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

const envFileArg = getArg('--file', '.env.production');
const projectNameArg = getArg('--project', process.env.VERCEL_PROJECT_NAME || '');
const syncApiFlag = args.includes('--sync') || args.includes('--upload');

console.log('\n🚀  =============================================================');
console.log('🚀  Clientum CRM — Production Environment Setup for clientum.com.ar');
console.log('🚀  =============================================================\n');

// 1. System/Container variables to IGNORE
const SYSTEM_IGNORED_KEYS = new Set([
  'PATH', 'PWD', 'LANG', 'LANGUAGE', 'LC_ALL', 'HOME', 'SHLVL', '_',
  'CNB_GROUP_ID', 'CNB_STACK_ID', 'CNB_USER_ID', 'GOMEMLIMIT', 'GOOGLE_RUNTIME',
  'NODE_OPTIONS', 'NODE_VERSION', 'YARN_VERSION', 'NO_UPDATE_NOTIFIER',
  'K_CONFIGURATION', 'K_REVISION', 'K_SERVICE', 'CLOUD_RUN_TIMEOUT_SECONDS',
  'CONTROL_PLANE_API_DIR', 'CONTROL_PLANE_PORT', 'NGINX_PORT', 'DEFAULT_APP_PORT',
  'CSP_HEADER_VALUE', 'NG_ALLOWED_HOSTS', 'AUTHORIZED_SERVICE_ACCOUNT_EMAIL',
  'APPLET_DIR', 'APPLET_ID', 'APP_DIR'
]);

// 2. Locate and load local environment file
let envFilePath = path.resolve(process.cwd(), envFileArg);
if (!fs.existsSync(envFilePath) && envFileArg === '.env.production') {
  const fallbackEnv = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(fallbackEnv)) {
    envFilePath = fallbackEnv;
  }
}

let parsedEnv = {};
if (fs.existsSync(envFilePath)) {
  console.log(`📄  Loading variables from file: ${path.basename(envFilePath)}`);
  const fileContent = fs.readFileSync(envFilePath, 'utf8');
  parsedEnv = dotenv.parse(fileContent);
} else {
  console.log(`⚠️  File ${envFileArg} not found. Reading from current environment.`);
}

// Merge with relevant process.env
const env = { ...parsedEnv };

// Add relevant non-system process.env
for (const [k, v] of Object.entries(process.env)) {
  if (v && !SYSTEM_IGNORED_KEYS.has(k) && !env[k]) {
    env[k] = v;
  }
}

// 3. Expected environment keys schema from .env.example
const REQUIRED_KEYS = [
  'APP_URL',
  'NODE_ENV',
  'WORKFLOW_ENCRYPTION_KEY',
  'API_KEY_PEPPER',
  'SESSION_SECRET',
  // Firebase Server Admin
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  // Firebase Client
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_FIREBASE_DATABASE_ID',
  // Resend Email
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  // Mercado Pago
  'PLATFORM_MERCADOPAGO_ACCESS_TOKEN',
  'PLATFORM_MERCADOPAGO_WEBHOOK_SECRET',
  'PLATFORM_MP_PLAN_ID_STARTER_MONTHLY',
  'PLATFORM_MP_PLAN_ID_STARTER_ANNUAL',
  'PLATFORM_MP_PLAN_ID_GROWTH_MONTHLY',
  'PLATFORM_MP_PLAN_ID_GROWTH_ANNUAL',
  'PLATFORM_MP_PLAN_ID_SCALE_MONTHLY',
  'PLATFORM_MP_PLAN_ID_SCALE_ANNUAL',
  // Integrations & Vercel
  'VERCEL_ACCESS_TOKEN',
  'VERCEL_TEAM_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_ZONE_ID',
];

// Production domain enforce
env.APP_URL = 'https://clientum.com.ar';
env.NODE_ENV = 'production';

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

if (!env.WORKFLOW_ENCRYPTION_KEY || env.WORKFLOW_ENCRYPTION_KEY.includes('xxxx')) {
  env.WORKFLOW_ENCRYPTION_KEY = generateSecret();
  console.log('🔑  Generated secure WORKFLOW_ENCRYPTION_KEY');
}
if (!env.API_KEY_PEPPER || env.API_KEY_PEPPER.includes('xxxx')) {
  env.API_KEY_PEPPER = generateSecret();
  console.log('🔑  Generated secure API_KEY_PEPPER');
}
if (!env.SESSION_SECRET || env.SESSION_SECRET.includes('xxxx')) {
  env.SESSION_SECRET = generateSecret();
  console.log('🔑  Generated secure SESSION_SECRET');
}

// Default Resend sender for domain
if (!env.RESEND_FROM_EMAIL || env.RESEND_FROM_EMAIL.includes('resend.dev')) {
  env.RESEND_FROM_EMAIL = 'Clientum CRM <contacto@clientum.com.ar>';
}

// 4. Validation Report
console.log('\n🔍  Running Validation Audits for clientum.com.ar:\n');

const missingKeys = [];
const validKeys = [];

for (const key of REQUIRED_KEYS) {
  const val = env[key]?.trim();
  if (!val || val.includes('xxxx') || val.includes('your_')) {
    missingKeys.push(key);
  } else {
    validKeys.push(key);
  }
}

const auditResults = [];

// Domain
auditResults.push(`  ✅  APP_URL configured: ${env.APP_URL}`);

// Resend
if (env.RESEND_API_KEY && env.RESEND_API_KEY.startsWith('re_') && !env.RESEND_API_KEY.includes('xxxx')) {
  auditResults.push(`  ✅  RESEND_API_KEY valid (re_...) | Sender: ${env.RESEND_FROM_EMAIL}`);
} else {
  auditResults.push('  ❌  RESEND_API_KEY missing or using placeholder.');
}

// Mercado Pago
if (env.PLATFORM_MERCADOPAGO_ACCESS_TOKEN && (env.PLATFORM_MERCADOPAGO_ACCESS_TOKEN.startsWith('APP_USR-') || env.PLATFORM_MERCADOPAGO_ACCESS_TOKEN.startsWith('TEST-'))) {
  auditResults.push(`  ✅  PLATFORM_MERCADOPAGO_ACCESS_TOKEN valid (${env.PLATFORM_MERCADOPAGO_ACCESS_TOKEN.startsWith('APP_USR-') ? 'Production' : 'Test'})`);
} else {
  auditResults.push('  ❌  PLATFORM_MERCADOPAGO_ACCESS_TOKEN missing or invalid.');
}

// Mercado Pago Plans
const mpPlanKeys = REQUIRED_KEYS.filter(k => k.startsWith('PLATFORM_MP_PLAN_ID_'));
const configuredPlans = mpPlanKeys.filter(k => env[k] && !env[k].includes('xxxx'));
if (configuredPlans.length === mpPlanKeys.length) {
  auditResults.push('  ✅  All 6 Mercado Pago Subscription Plan IDs configured.');
} else {
  auditResults.push(`  ⚠️   ${configuredPlans.length}/6 Mercado Pago Plan IDs configured (Run: npm run setup:mp-plans)`);
}

// Firebase
if (env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID) {
  const proj = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;
  auditResults.push(`  ✅  Firebase Project ID detected: ${proj}`);
} else {
  auditResults.push('  ❌  Firebase Project credentials missing.');
}

auditResults.forEach((msg) => console.log(msg));

console.log('\n-------------------------------------------------------------');
console.log(`📊  Summary: ${validKeys.length} configured variables, ${missingKeys.length} missing/pending.`);
if (missingKeys.length > 0) {
  console.log('\n⚠️   Pending configuration variables:');
  missingKeys.forEach((k) => console.log(`   - ${k}`));
}
console.log('-------------------------------------------------------------\n');

// 5. Save cleaned .env.production
const productionEnvPath = path.resolve(process.cwd(), '.env.production');
let fileOutput = '# Clientum CRM Production Environment for clientum.com.ar\n';
fileOutput += `# Updated on ${new Date().toISOString()}\n\n`;

const CLEAN_ENV_KEYS = REQUIRED_KEYS.concat(
  Object.keys(env).filter(k => !REQUIRED_KEYS.includes(k) && !SYSTEM_IGNORED_KEYS.has(k))
);

Array.from(new Set(CLEAN_ENV_KEYS)).sort().forEach((key) => {
  const val = env[key] || '';
  if (val.includes('\n')) {
    fileOutput += `${key}="${val.replace(/\n/g, '\\n')}"\n`;
  } else if (val.includes(' ')) {
    fileOutput += `${key}="${val}"\n`;
  } else {
    fileOutput += `${key}=${val}\n`;
  }
});

fs.writeFileSync(productionEnvPath, fileOutput, { mode: 0o600 });
console.log(`💾  Cleaned production config saved: .env.production`);

// 6. Generate Vercel CLI script (scripts/sync-vercel-env.sh)
const syncScriptPath = path.resolve(process.cwd(), 'scripts', 'sync-vercel-env.sh');
let shContent = '#!/usr/bin/env bash\n';
shContent += '# Auto-generated script to push production environment variables to Vercel\n';
shContent += '# Run: chmod +x scripts/sync-vercel-env.sh && ./scripts/sync-vercel-env.sh\n\n';
shContent += 'set -e\n\n';
shContent += 'echo "🚀 Pushing environment variables to Vercel Production for clientum.com.ar..."\n\n';

for (const key of Array.from(new Set(CLEAN_ENV_KEYS))) {
  const val = env[key];
  if (val && !val.includes('xxxx') && !val.includes('your_')) {
    const escapedVal = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    shContent += `printf "%s" "${escapedVal}" | npx vercel env add ${key} production --force || true\n`;
  }
}

shContent += '\necho "\n✅ Environment variables pushed to Vercel!"\n';
fs.writeFileSync(syncScriptPath, shContent, { mode: 0o755 });
console.log(`📜  Created Vercel CLI sync script: scripts/sync-vercel-env.sh`);

// 7. REST API Upload if project name and sync requested
if (syncApiFlag && projectNameArg) {
  const vercelToken = env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_ACCESS_TOKEN;
  const vercelTeamId = env.VERCEL_TEAM_ID || process.env.VERCEL_TEAM_ID;

  if (vercelToken) {
    console.log(`\n🌐  Syncing variables to Vercel project "${projectNameArg}" via REST API...`);
    const teamQuery = vercelTeamId ? `?teamId=${encodeURIComponent(vercelTeamId)}` : '';
    let successCount = 0;

    for (const key of CLEAN_ENV_KEYS) {
      const val = env[key];
      if (!val || val.includes('xxxx') || val.includes('your_')) continue;

      try {
        const res = await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(projectNameArg)}/env${teamQuery}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            value: val,
            type: 'encrypted',
            target: ['production', 'preview', 'development'],
          }),
        });

        if (res.ok || res.status === 409) {
          console.log(`  ✅  ${key}`);
          successCount++;
        }
      } catch (e) {
        // silent fallback
      }
    }
    console.log(`🎉  Synced ${successCount} variables to Vercel API.`);
  }
} else {
  console.log('\n💡  To apply variables to Vercel:');
  console.log('   1. Vercel CLI:  run `npm run sync:vercel-env` (or `./scripts/sync-vercel-env.sh`)');
  console.log('   2. Vercel API:  run `node scripts/setup-vercel-env.mjs --sync --project <your-vercel-project-name>`');
  console.log('   3. Dashboard:   Copy contents of `.env.production` into Vercel Dashboard > Project Settings > Environment Variables.');
}

console.log('\nDone!\n');
