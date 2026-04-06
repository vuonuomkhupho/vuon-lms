#!/bin/bash
set -e

cd /home/frappe/frappe-bench

# ─── Configure Redis & DB connections ───
# These are set from Railway service environment variables
bench set-config -g db_host "${DB_HOST:-mariadb}"
bench set-config -gp db_port "${DB_PORT:-3306}"
bench set-config -g redis_cache "redis://${REDIS_HOST:-redis}:${REDIS_PORT:-6379}/0"
bench set-config -g redis_queue "redis://${REDIS_HOST:-redis}:${REDIS_PORT:-6379}/1"
bench set-config -g redis_socketio "redis://${REDIS_HOST:-redis}:${REDIS_PORT:-6379}/2"
bench set-config -gp socketio_port 9000

# ─── Auto-create site on first run ───
SITE_NAME="${FRAPPE_SITE_NAME:-lms.localhost}"

if [ ! -f "sites/${SITE_NAME}/site_config.json" ]; then
  echo "=== First run: creating site ${SITE_NAME} ==="

  # Wait for MariaDB to be ready
  echo "Waiting for MariaDB..."
  for i in $(seq 1 30); do
    if mysql -h "${DB_HOST:-mariadb}" -P "${DB_PORT:-3306}" -u root -p"${DB_PASSWORD}" -e "SELECT 1" &>/dev/null; then
      echo "MariaDB is ready."
      break
    fi
    echo "  attempt $i/30..."
    sleep 2
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

  echo "=== Site created successfully ==="
fi

# Set default site
bench use "${SITE_NAME}"

# ─── Run the command (default: bench start) ───
exec "$@"
