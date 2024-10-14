#!/bin/bash
## Bootstrap will run specific processing for the container purpose
## Here we want to ensure data is loaded and available as soon as possible and leave the flask service running
## The data loading can only start once the flask service is running though

df="[%Y-%m-%d %H:%M:%S]"
function log_debug { [[ "${log_verbosity}" -ge 3 ]] && echo "[$(date +"$df")] DEBUG: ${@}"; } || return true
function log_info { [[ "${log_verbosity}" -ge 2 ]] && echo "[$(date +"$df")] INFO: ${@}"; } || return true
function log_warn { [[ "${log_verbosity}" -ge 1 ]] && echo "[$(date +"$df")] WARN: ${@}"; } || return true
function log_error { echo "[$(date +"$df")] ERROR: ${@}"; }
function log_critical { echo "[$(date +"$df")] CRITICAL: ${@}"; }

log_info "Bootstrapping container..."
## Ensure git doesn't complain about permissions of git repo provided by git component
git config --global --add safe.directory /update-hook-repository

## Fuseki container is responsible for checking when it needs updates
## (it should pull, rather than the API pushing)

## Execute the CMD to continue booting...
## First eval the docker CMD to expand variable(s)
CMD=$(eval echo $@)
log_info "Continuing startup process (with CMD: $CMD)..."
exec $CMD &
sleep 0.2
log_info "API should now be available"
wait
