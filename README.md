# CoMetaR - Colaborative Metadata Repository

## Docker based deployment guide
Clone this repo and cd into the new dir:
```sh
git clone https://github.com/dzl-dm/cometar.git .
cd cometar
```

Use docker compose to build and run the components
```sh
docker compose up -d
```

This provides a running system available at [localhost](http://localhost)
You may want to edit some settings in `docker-compose.yml` before deploying, and for production deployments more substantial changes could be desired including running behind an https terminating proxy

### Initialisation
In order to actually add data to CoMetaR, you must provide users' access to the git repository
Get a shell inside the docker container for git:
```sh
docker exec -it cometar_git-web bash
```

Once inside, run the following to add a user, you will be prompted for a password:
```sh
cd /etc/nginx/auth
htpasswd .htpasswd_git username
```
