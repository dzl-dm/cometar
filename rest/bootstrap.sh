#!/bin/bash
## Bootstrap will run specific processing for the container purpose
## such as setting configuration based on environment variables or available data

df="[%Y-%m-%d %H:%M:%S]"
function log_debug { [[ "${log_verbosity}" -ge 3 ]] && echo "[$(date +"$df")] DEBUG: ${@}"; }
function log_info { [[ "${log_verbosity}" -ge 2 ]] && echo "[$(date +"$df")] INFO: ${@}"; }
function log_warn { [[ "${log_verbosity}" -ge 1 ]] && echo "[$(date +"$df")] WARN: ${@}"; }
function log_error { echo "[$(date +"$df")] ERROR: ${@}"; }
function log_critical { echo "[$(date +"$df")] CRITICAL: ${@}"; }

log_info "Bootstrapping container..."

## Ensure git doesn't complain about permissions of git repo provided by git component
git config --global --add safe.directory /update-hook-repository
## TODO: Check git and fuseki are ready (or just wait a bit...)
sleep 5
curl -s -H 'Accept: application/json' 'http://localhost:5000/admin/load_latest_commit'
sleep 1
## In reality, we need the whole provenance to be computed, but setting for the last week should pick up anything that wasn't already computed
curl -s -H 'Accept: application/json' "http://localhost:5000/admin/update_provenance?date_from=$(date -d 'last week' '+%Y-%m-%d')"
sleep 1
curl -s -H 'Accept: application/json' 'http://localhost:5000/admin/load_provenance' &
sleep 1

## Execute the CMD to continue booting...
## First eval the docker CMD to expand variables
CMD=$(eval echo $@)
log_info "Continuing startup process (with CMD: $CMD)..."
exec $CMD
