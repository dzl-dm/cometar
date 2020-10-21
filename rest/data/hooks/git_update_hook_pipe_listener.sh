#!/bin/bash

while [ 1 ]; do
    while read -r revision; do
		"$COMETAR_PROD_DIR/hooks/after_upload_hook.sh" -r "$revision"
    done <"${COMETAR_PIPES_DIR}/git_update_hook"
done
