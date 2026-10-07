#!/bin/bash
# ==============================================================================
# JS-FORGE VPS DEPLOYMENT SCRIPT
# Mirrors the LOGICFORGE deployment workflow
# ==============================================================================

set -e

VPS_USER="root"
VPS_HOST="151.241.99.129"
REMOTE_DIR="/var/www/js_forge"

echo "=== 1. Building Production Bundle ==="
npm run build

echo "=== 2. Creating Remote Directory on VPS ==="
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${REMOTE_DIR}"

echo "=== 3. Uploading dist/ files to VPS ==="
rsync -avz --delete dist/ ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/

echo "=== 4. Setting up Nginx Configuration (js_forge) ==="
scp deploy/js_forge ${VPS_USER}@${VPS_HOST}:/etc/nginx/sites-available/js_forge

echo "=== 5. Enabling Site & Testing Nginx ==="
ssh ${VPS_USER}@${VPS_HOST} "ln -sfn /etc/nginx/sites-available/js_forge /etc/nginx/sites-enabled/js_forge && nginx -t && systemctl reload nginx"

echo "=== 6. (Optional) Run Certbot for SSL if not yet configured ==="
echo "On VPS run: certbot --nginx -d jsforge.staacornews.com -d js-forge.staacornews.com"

echo "=== DEPLOYMENT COMPLETE! ==="
