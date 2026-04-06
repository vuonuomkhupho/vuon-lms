#!/bin/bash
set -e

echo "=== Vuon LMS Entrypoint ==="
cd /home/frappe/frappe-bench

# ─── Volume mapping ───
# Railway mounts persistent volumes at /data
# Frappe expects sites at ./sites — we bridge them
if [ -d "/data" ]; then
  echo "Volume detected at /data"

  if [ ! -L "sites" ]; then
    echo "Initial setup: migrating sites/ to /data volume..."

    # Copy initial sites content to volume if empty
    if [ -z "$(ls -A /data 2>/dev/null)" ]; then
      echo "  /data is empty — copying sites/ content..."
      cp -a sites/. /data/
      echo "  copied: $(ls /data)"
    else
      echo "  /data already has content: $(ls /data)"
    fi

    # Replace sites dir with symlink to volume
    rm -rf sites
    ln -sf /data sites
    echo "  symlink created: sites -> /data"
  else
    echo "sites/ already symlinked to /data"
  fi
fi

# Verify apps.txt exists (critical for bench commands)
if [ ! -f "sites/apps.txt" ]; then
  echo "WARNING: sites/apps.txt not found! Creating from installed apps..."
  ls apps/ | grep -v __pycache__ > sites/apps.txt
  echo "  apps.txt created: $(cat sites/apps.txt)"
fi

echo "apps.txt contents: $(cat sites/apps.txt)"

# ─── Build Redis URL with optional auth ───
if [ -n "$REDIS_PASSWORD" ]; then
  REDIS_URL="redis://default:${REDIS_PASSWORD}@${REDIS_HOST:-redis}:${REDIS_PORT:-6379}"
else
  REDIS_URL="redis://${REDIS_HOST:-redis}:${REDIS_PORT:-6379}"
fi

# ─── Configure connections ───
echo "Configuring database: ${DB_HOST:-mariadb}:${DB_PORT:-3306}"
echo "Configuring Redis: ${REDIS_HOST:-redis}:${REDIS_PORT:-6379}"

bench set-config -g db_host "${DB_HOST:-mariadb}"
bench set-config -gp db_port "${DB_PORT:-3306}"
bench set-config -g redis_cache "${REDIS_URL}/0"
bench set-config -g redis_queue "${REDIS_URL}/1"
bench set-config -g redis_socketio "${REDIS_URL}/2"
bench set-config -gp socketio_port 9000

# ─── Auto-create site on first run ───
SITE_NAME="${FRAPPE_SITE_NAME:-lms.localhost}"

if [ ! -f "sites/${SITE_NAME}/site_config.json" ]; then
  echo "=== First run: creating site ${SITE_NAME} ==="

  # Wait for DB to be ready
  echo "Waiting for database at ${DB_HOST:-mariadb}:${DB_PORT:-3306}..."
  for i in $(seq 1 60); do
    if python3 -c "
import socket
s = socket.socket()
try:
    s.settimeout(2)
    s.connect(('${DB_HOST:-mariadb}', ${DB_PORT:-3306}))
    s.close()
    exit(0)
except:
    exit(1)
" 2>/dev/null; then
      echo "Database is ready."
      break
    fi
    if [ "$i" -eq 60 ]; then
      echo "ERROR: Database not reachable after 60 attempts. Exiting."
      exit 1
    fi
    echo "  attempt $i/60..."
    sleep 3
  done

  bench new-site "${SITE_NAME}" \
    --mariadb-root-password "${DB_PASSWORD}" \
    --admin-password "${ADMIN_PASSWORD:-admin}" \
    --install-app erpnext \
    --install-app lms \
    --install-app dfp_external_storage \
    --no-mariadb-socket

  bench --site "${SITE_NAME}" set-config host_name "${HOST_NAME:-http://localhost:8000}"
  bench --site "${SITE_NAME}" set-config developer_mode 1

  echo "=== Site ${SITE_NAME} created successfully ==="
fi

# Set default site
bench use "${SITE_NAME}"

echo "=== Starting Frappe (bench start) ==="

# ─── Run the command (default: bench start) ───
exec "$@"
