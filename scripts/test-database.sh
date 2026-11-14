#!/usr/bin/env bash
# Tests Homami's database rules on a throwaway local database: never on the real one.
# Needs PostgreSQL. Uses the usual PGHOST / PGPORT / PGUSER / PGPASSWORD settings.
#   1. runs every setup script (supabase/NN-*.sql), then again every one that says "Safe to run again"
#   2. tries the rules as pretend people (supabase/tests/rules.test.sql)
set -euo pipefail
cd "$(dirname "$0")/.."

DB="homami_test_$$"
PSQL=(psql -X -q -v ON_ERROR_STOP=1)
"${PSQL[@]}" -d postgres -c "create database $DB" >/dev/null
trap '"${PSQL[@]}" -d postgres -c "drop database if exists $DB" >/dev/null 2>&1 || true' EXIT

run() {
  if ! out=$("${PSQL[@]}" -d "$DB" -f "$1" 2>&1); then
    echo "✗ $1 ($2)"; echo "$out"; exit 1
  fi
}

run supabase/tests/supabase-stand-ins.sql "Supabase stand-ins"
for f in supabase/[0-9][0-9]-*.sql; do run "$f" "first run"; done
echo "✓ All setup scripts run cleanly"
for f in supabase/[0-9][0-9]-*.sql; do
  if head -5 "$f" | grep -qi "safe to run again"; then run "$f" "second run"; fi
done
echo "✓ The scripts that say \"Safe to run again\" are: they run a second time without problems"

"${PSQL[@]}" -d "$DB" -f supabase/tests/rules.test.sql 2>&1 | sed -n 's/^psql:[^ ]* NOTICE:  //p; s/^NOTICE:  //p; /ERROR/p'
"${PSQL[@]}" -d "$DB" -c "select 1" >/dev/null
