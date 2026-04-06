#!/bin/bash
set -e

# Railway deployment setup for Vuon LMS
# Prerequisites:
#   - Railway CLI installed: npm i -g @railway/cli
#   - Logged in: railway login
#   - Custom image pushed to a registry (Docker Hub or GHCR)
#
# This script creates the Railway project with all required services.

echo "=== Vuon LMS — Railway Setup ==="
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
  echo "Error: Railway CLI not found. Install with: npm i -g @railway/cli"
  exit 1
fi

# Prompt for required values
read -p "Custom image name (e.g., ghcr.io/your-org/vuon-lms:latest): " CUSTOM_IMAGE
read -p "Site name (e.g., lms.vuon.io): " SITE_NAME
read -sp "Database root password: " DB_PASSWORD
echo ""
read -sp "Admin password: " ADMIN_PASSWORD
echo ""

echo ""
echo "Creating Railway project..."
railway init

echo ""
echo "=== Manual steps in Railway Dashboard ==="
echo ""
echo "1. Add a MariaDB service:"
echo "   - Click 'New Service' → 'Docker Image'"
echo "   - Image: mariadb:11.4"
echo "   - Add volume: /var/lib/mysql"
echo "   - Environment variables:"
echo "     MARIADB_ROOT_PASSWORD=$DB_PASSWORD"
echo "     MARIADB_AUTO_UPGRADE=1"
echo "   - Start command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --skip-character-set-client-handshake --skip-innodb-read-only-compressed"
echo ""
echo "2. Add a Redis service:"
echo "   - Click 'New Service' → 'Docker Image'"
echo "   - Image: redis:7-alpine"
echo ""
echo "3. Add Backend service:"
echo "   - Click 'New Service' → 'Docker Image'"
echo "   - Image: $CUSTOM_IMAGE"
echo "   - Add volume: /home/frappe/frappe-bench/sites"
echo ""
echo "4. Add Websocket service:"
echo "   - Same image: $CUSTOM_IMAGE"
echo "   - Start command: node /home/frappe/frappe-bench/apps/frappe/socketio.js"
echo "   - Share the sites volume from Backend"
echo ""
echo "5. Add Worker service:"
echo "   - Same image: $CUSTOM_IMAGE"
echo "   - Start command: bench worker --queue long,default,short"
echo "   - Share the sites volume from Backend"
echo ""
echo "6. Add Scheduler service:"
echo "   - Same image: $CUSTOM_IMAGE"
echo "   - Start command: bench schedule"
echo "   - Share the sites volume from Backend"
echo ""
echo "7. Add Frontend (nginx) service:"
echo "   - Image: frappe/frappe-nginx:v15"
echo "   - Environment:"
echo "     BACKEND=backend.railway.internal:8000"
echo "     SOCKETIO=websocket.railway.internal:9000"
echo "     FRAPPE_SITE_NAME_HEADER=$SITE_NAME"
echo "   - Expose port 8080 (public)"
echo "   - Add custom domain: $SITE_NAME"
echo ""
echo "=== After all services are running ==="
echo ""
echo "8. Initialize the site (run in Backend service shell):"
echo "   railway run -s backend -- bench new-site $SITE_NAME \\"
echo "     --mariadb-root-password $DB_PASSWORD \\"
echo "     --admin-password $ADMIN_PASSWORD \\"
echo "     --install-app erpnext --install-app lms --install-app dfp_external_storage"
echo ""
echo "9. Configure R2 storage in Frappe UI:"
echo "   - Go to https://$SITE_NAME/app/dfp-external-storage"
echo "   - Add your R2 bucket credentials"
echo ""
