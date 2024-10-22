#!/bin/bash
## Description: Call API endpoints to build cometar front-page images.
## Suitable to be run by cron daily overnight, so they are ready for users for the rest of the day

df="%Y-%m-%d %H:%M:%S"
function log_debug { { [[ "${log_verbosity}" -ge 3 ]] && echo "[$(date +"$df")] DEBUG: ${@}"; } || return 0; }
function log_info { { [[ "${log_verbosity}" -ge 2 ]] && echo "[$(date +"$df")] INFO: ${@}"; } || return 0; }
function log_warn { { [[ "${log_verbosity}" -ge 1 ]] && echo "[$(date +"$df")] WARN: ${@}"; } || return 0; }
function log_error { >&2 echo "[$(date +"$df")] ERROR: ${@}"; }
function log_critical { >&2 echo "[$(date +"$df")] CRITICAL: ${@}"; }

log_info "Building figures..."
curl -I http://localhost:5000//query/progress/metadata/changes/figure 2>/dev/null || log_warn "Changes figure had an error while building..."
sleep 1
curl -I http://localhost:5000//query/progress/metadata/total_annotations/figure 2>/dev/null || log_warn "total_annotations figure had an error while building..."
sleep 1
curl -I http://localhost:5000//query/progress/metadata/total_concepts/figure 2>/dev/null || log_warn "total_concepts figure had an error while building..."
sleep 1
curl -I http://localhost:5000//query/progress/metadata/distribution/figure 2>/dev/null || log_warn "Distribution figure had an error while building..."
log_info "Figures built!"
