#!/bin/bash
set -e

PROJECT_DIR="/Users/samuelsaad/claudecodevs"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo ""
echo "================================================"
echo "  Benetic Production Deployment"
echo "================================================"
echo ""

# ── Step 1: Deploy Backend to Railway ──────────────
echo "STEP 1: Deploying backend to Railway..."
echo ""

cd "$PROJECT_DIR"

railway login

echo ""
echo "Creating Railway project..."
railway init --name benetic-backend

echo ""
echo "Adding PostgreSQL database..."
railway add --database postgres

echo ""
echo "Setting environment variables..."
railway variables --set "JWT_SECRET=$(openssl rand -hex 32)"
railway variables --set "DEBUG=false"
railway variables --set "REDIS_URL=redis://localhost:6379/0"

echo ""
echo "Deploying backend (this takes ~2 min)..."
railway up --detach

echo ""
echo "Getting Railway backend URL..."
RAILWAY_URL=$(railway domain 2>/dev/null || echo "")

if [ -z "$RAILWAY_URL" ]; then
  echo ""
  echo "⚠️  Could not auto-detect Railway URL."
  echo "    Open https://railway.app → your project → copy the domain."
  echo ""
  read -p "Paste your Railway backend URL (e.g. https://benetic-backend-production.up.railway.app): " RAILWAY_URL
fi

echo ""
echo "✅ Backend deployed to: $RAILWAY_URL"

# ── Step 2: Deploy Frontend to Vercel ──────────────
echo ""
echo "STEP 2: Deploying frontend to Vercel..."
echo ""

cd "$FRONTEND_DIR"

# Commit frontend files if needed
cd "$PROJECT_DIR"
git add frontend/ 2>/dev/null || true
git diff --cached --quiet 2>/dev/null || git commit -m "Add frontend for Vercel deployment" 2>/dev/null || true

cd "$FRONTEND_DIR"

vercel login

echo ""
echo "Deploying frontend to Vercel..."
NEXT_PUBLIC_API_URL="$RAILWAY_URL" vercel --prod \
  --name benetic \
  --yes \
  --env NEXT_PUBLIC_API_URL="$RAILWAY_URL"

echo ""
echo "================================================"
echo "  ✅ Deployment Complete!"
echo "  Backend:  $RAILWAY_URL"
echo "  Frontend: Check Vercel output above"
echo "================================================"
echo ""
