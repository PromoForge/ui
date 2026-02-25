#!/bin/bash
set -e

echo "Waiting for postgres..."
until pg_isready -h postgres -p 5432 -U promoforge; do
  sleep 1
done
echo "Postgres is ready."

# Patch config for Docker networking:
# - DB connects to 'postgres' service instead of 127.0.0.1
# - Server binds to 0.0.0.0 so ports are accessible from host
CONFIG=/etc/promoforge/config/development-postgres18.yaml
sed -i 's|connectAddr: "127.0.0.1:5432"|connectAddr: "postgres:5432"|g' "$CONFIG"
sed -i 's|bindOnLocalHost: true|bindOnLocalHost: false|g' "$CONFIG"
sed -i 's|broadcastAddress: "127.0.0.1"|broadcastAddress: "0.0.0.0"|g' "$CONFIG"
sed -i 's|listenAddress: "127.0.0.1:8000"|listenAddress: "0.0.0.0:8000"|g' "$CONFIG"

echo "Installing schema..."
promoforge-sql-tool -u promoforge --pw promoforge --ep postgres -p 5432 --pl postgres18 --db promoforge create || true
promoforge-sql-tool -u promoforge --pw promoforge --ep postgres -p 5432 --pl postgres18 --db promoforge setup -v 0.0
promoforge-sql-tool -u promoforge --pw promoforge --ep postgres -p 5432 --pl postgres18 --db promoforge update-schema -d /etc/promoforge/schema/postgresql/v18/promoforge/versioned
echo "Schema installed."

echo "Starting promoforge server..."
exec promoforge-server --config-file "$CONFIG" --allow-no-auth start
