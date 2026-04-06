#!/bin/bash
set -e

echo "=== Vuon LMS Entrypoint ==="
cd /home/frappe/frappe-bench

# ─── Volume mapping ───
# Railway mounts persistent volumes at /data (owned by root)
# Frappe expects sites at ./sites — we bridge them via symlink
if [ -d "/data" ]; then
  echo "Volume detected at /data"
  chown -R frappe:frappe /data 2>/dev/null || true

  if [ ! -L "sites" ]; then
    echo "Initial setup: migrating sites/ to /data volume..."
    REAL_FILES=$(ls /data 2>/dev/null | grep -v lost+found | head -1)

    if [ -z "$REAL_FILES" ]; then
      echo "  /data is empty — copying sites/ content..."
      cp -a sites/. /data/
      echo "  copied: $(ls /data | grep -v lost+found)"
    else
      echo "  /data already has content: $(ls /data | grep -v lost+found)"
    fi

    rm -rf sites
    ln -sf /data sites
    echo "  symlink created: sites -> /data"
  else
    echo "sites/ already symlinked to /data"
  fi
fi

# Verify apps.txt exists
if [ ! -f "sites/apps.txt" ]; then
  echo "WARNING: sites/apps.txt missing — regenerating from apps/..."
  ls apps/ | grep -v __pycache__ > sites/apps.txt
fi
echo "apps.txt: $(cat sites/apps.txt | tr '\n' ' ')"

# ─── Redis URL (with optional auth) ───
if [ -n "$REDIS_PASSWORD" ]; then
  REDIS_URL="redis://default:${REDIS_PASSWORD}@${REDIS_HOST:-redis}:${REDIS_PORT:-6379}"
else
  REDIS_URL="redis://${REDIS_HOST:-redis}:${REDIS_PORT:-6379}"
fi

# ─── Detect database type ───
DB_TYPE="${DB_TYPE:-mariadb}"
DB_DEFAULT_PORT=$( [ "$DB_TYPE" = "postgres" ] && echo 5432 || echo 3306 )

echo "DB: ${DB_TYPE} @ ${DB_HOST:-localhost}:${DB_PORT:-$DB_DEFAULT_PORT}"
echo "Redis: ${REDIS_HOST:-redis}:${REDIS_PORT:-6379}"

# ─── Configure connections ───
su frappe -c "cd /home/frappe/frappe-bench && \
  bench set-config -g db_host '${DB_HOST:-localhost}' && \
  bench set-config -gp db_port '${DB_PORT:-$DB_DEFAULT_PORT}' && \
  bench set-config -g db_type '${DB_TYPE}' && \
  bench set-config -g redis_cache '${REDIS_URL}/0' && \
  bench set-config -g redis_queue '${REDIS_URL}/1' && \
  bench set-config -g redis_socketio '${REDIS_URL}/2' && \
  bench set-config -gp socketio_port 9000"

echo "Configuration saved."

# ─── Auto-create site on first run ───
SITE_NAME="${FRAPPE_SITE_NAME:-lms.localhost}"

if [ ! -f "sites/${SITE_NAME}/site_config.json" ]; then
  echo "=== First run: creating site ${SITE_NAME} (db_type=${DB_TYPE}) ==="

  # Wait for DB
  echo "Waiting for ${DB_TYPE} at ${DB_HOST}:${DB_PORT:-$DB_DEFAULT_PORT}..."
  for i in $(seq 1 60); do
    if [ "$DB_TYPE" = "postgres" ]; then
      # Use pg_isready for PostgreSQL (handles IPv6 properly)
      if pg_isready -h "${DB_HOST}" -p "${DB_PORT:-5432}" -q 2>/dev/null; then
        echo "Database is ready."
        break
      fi
    else
      if python3 -c "
import socket
try:
    s = socket.create_connection(('${DB_HOST:-localhost}', ${DB_PORT:-3306}), timeout=5)
    s.close()
except:
    exit(1)
" 2>/dev/null; then
        echo "Database is ready."
        break
      fi
    fi
    if [ "$i" -eq 60 ]; then
      echo "ERROR: Database not reachable after 60 attempts."
      exit 1
    fi
    echo "  attempt $i/60..."
    sleep 3
  done

  # Build bench new-site command based on DB type
  if [ "$DB_TYPE" = "postgres" ]; then
    su frappe -c "cd /home/frappe/frappe-bench && bench new-site '${SITE_NAME}' \
      --db-type postgres \
      --db-host '${DB_HOST}' \
      --db-port '${DB_PORT:-5432}' \
      --db-name '${DB_NAME:-railway}' \
      --db-root-username '${DB_USER:-postgres}' \
      --db-root-password '${DB_PASSWORD}' \
      --admin-password '${ADMIN_PASSWORD:-admin}' \
      --install-app erpnext \
      --install-app lms \
      --install-app dfp_external_storage \
      --verbose"
  else
    su frappe -c "cd /home/frappe/frappe-bench && bench new-site '${SITE_NAME}' \
      --mariadb-root-password '${DB_PASSWORD}' \
      --admin-password '${ADMIN_PASSWORD:-admin}' \
      --install-app erpnext \
      --install-app lms \
      --install-app dfp_external_storage \
      --no-mariadb-socket"
  fi

  su frappe -c "cd /home/frappe/frappe-bench && \
    bench --site '${SITE_NAME}' set-config host_name '${HOST_NAME:-http://localhost:8000}' && \
    bench --site '${SITE_NAME}' set-config developer_mode 1"

  echo "=== Site ${SITE_NAME} created successfully ==="
fi

# Set default site
su frappe -c "cd /home/frappe/frappe-bench && bench use '${SITE_NAME}'"

echo "=== Starting Frappe ==="
exec su frappe -c "cd /home/frappe/frappe-bench && exec $*"
