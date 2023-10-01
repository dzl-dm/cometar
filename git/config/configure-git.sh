#!/bin/sh
echo "---- BEGIN GIT CONFIGURATION ----"

## Check git repo exists, if not init
if [[ cd ${GIT_BASE} && git rev-parse --git-dir > /dev/null 2>&1 ]] ; then
  echo "Git repo exists at '${GIT_BASE}'"
else
  # NOT a git repo!
  git init --bare "${GIT_BASE}"
  echo "Initialized git repo at '${GIT_BASE}'..."
fi

## Configuration for git hook
envsubst "\$REST_SERVER" < /config/git-hook_update > /git/hooks/update
envsubst "\$REST_SERVER" < /config/git-hook_post-receive > /git/hooks/post-receive
chmod +x /git/hooks/update
chmod +x /git/hooks/post-receive
chown -R nginx:nginx "${GIT_BASE}"
## Allow nginx to write docker logs
nohup tail -f /tmp/stdout &
nohup tail -f /tmp/stderr >&2 &

echo "Updated environment settings and file permissions"

echo "---- END GIT CONFIGURATION ----"
