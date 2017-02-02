#!/bin/sh

# remove old file
rm -fv /var/tmp/path_count.csv

# RUN SQL FOR CRC
export PGPASSWORD=i2b2demodata
psql -h localhost -U i2b2demodata i2b2 -f patient_count_1_crc.sql

# RUN SQL FOR METADATA
export PGPASSWORD=i2b2metadata
psql -h localhost -U i2b2metadata i2b2 -f patient_count_2_ont.sql

rm -v /var/tmp/path_count.csv
