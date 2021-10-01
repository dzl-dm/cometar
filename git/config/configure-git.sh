#!/bin/sh
echo "---- BEGIN GIT CONFIGURATION ----"

GIT_BASE=${GIT_BASE:-/git}
## Check git repo exists, if not init
if [[ cd ${GIT_BASE} && git rev-parse --git-dir > /dev/null 2>&1 ]] ; then
  echo "Git repo exists..."
else
  # NOT a git repo!
  git init --bare "${GIT_BASE}"
  echo "Initialized git repo..."
fi

## Configuration for git hook
envsubst "\$REST_SERVER" < /config/git-hook_update > /git/hooks/update
envsubst "\$REST_SERVER" < /config/git-hook_post-receive > /git/hooks/post-receive
chmod +x /git/hooks/update
chmod +x /git/hooks/post-receive
chown -R nginx:nginx "${GIT_BASE}"

## Configuration for nginx
envsubst "\$BROWSER_FQDN" < /config/nginx-git.conf > /etc/nginx/conf.d/cometar-git.conf

echo "Updated environment settings and file permissions"

echo "---- END GIT CONFIGURATION ----"
