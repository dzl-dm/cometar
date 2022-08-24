#!/bin/bash
## Healthcheck for CoMetaR's Jena Fuseki system

[[ "$(curl -Is http://127.0.0.1:3030/$/ping | grep HTTP | cut -d" " -f2)" == "200" ]]
