#!/usr/bin/env bash
# Auto-generated script to push production environment variables to Vercel
# Run: chmod +x scripts/sync-vercel-env.sh && ./scripts/sync-vercel-env.sh

set -e

echo "🚀 Pushing environment variables to Vercel Production for clientum.com.ar..."

printf "%s" "https://clientum.com.ar" | npx vercel env add APP_URL production --force || true
printf "%s" "production" | npx vercel env add NODE_ENV production --force || true
printf "%s" "306986128b80cd391dc8dcb89b5d2712771af8e51111d063e36e129d855619c9" | npx vercel env add WORKFLOW_ENCRYPTION_KEY production --force || true
printf "%s" "b3ab10df6da4b154b6faf3d8a665fa7de87e5e3e59752c835d58704f94dbcd7d" | npx vercel env add API_KEY_PEPPER production --force || true
printf "%s" "84c89eb06473016fbbda8b31d69ce2e68b943b640a43cec98b6d664e17accaf6" | npx vercel env add SESSION_SECRET production --force || true
printf "%s" "re_9iGBnZDA_2HGxvm24xCRobdESayAq4fo7" | npx vercel env add RESEND_API_KEY production --force || true
printf "%s" "Clientum CRM <contacto@clientum.com.ar>" | npx vercel env add RESEND_FROM_EMAIL production --force || true
printf "%s" "APP_USR-106958768036541-100106-f97a0553d47737a83a2240bf35092b1e-3464210399" | npx vercel env add PLATFORM_MERCADOPAGO_ACCESS_TOKEN production --force || true
printf "%s" "vcp_4tSS0R68SHTttRB4nVA2urRjIGeXj2KNQYCIx6dMUrL1OvAHRp2wORWC" | npx vercel env add VERCEL_ACCESS_TOKEN production --force || true
printf "%s" "team_5Uj1941sz218AAM68VcWUC9T" | npx vercel env add VERCEL_TEAM_ID production --force || true
printf "%s" "cfut_JfEx3JGxzGnx6f7q5EZ2KCWhRNPbOY79nuM3tUdob8c1c492" | npx vercel env add CLOUDFLARE_API_TOKEN production --force || true
printf "%s" "75e6100982a89eba813e2f67c15d936b" | npx vercel env add CLOUDFLARE_ACCOUNT_ID production --force || true
printf "%s" "b7dc2d647b3dcbbece0d6639ba33b87c" | npx vercel env add CLOUDFLARE_ZONE_ID production --force || true
printf "%s" "8080" | npx vercel env add PORT production --force || true
printf "%s" "AQ.Ab8RN6JyvRct2fdgAVvmByaLsquDR6HKvKux74KxZ7dXQmPnJw" | npx vercel env add GEMINI_API_KEY production --force || true

echo "
✅ Environment variables pushed to Vercel!"
