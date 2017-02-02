#!/bin/bash

source $(dirname $0)/../config/conf.cfg
curl -s -X GET -G "$FUSEKITESTDATASET/data?default" > $TEMPDIR/export.ttl
