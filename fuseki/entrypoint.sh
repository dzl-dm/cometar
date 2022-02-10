#!/bin/sh
## Licensed under the terms of http://www.apache.org/licenses/LICENSE-2.0

# env | sort
echo -e "Fuseki config file: ${FUSEKI_CONFIG}" 2>&1
# echo -e "Extra args: $@" 2>&1

# exec "$JAVA_HOME/bin/java" $JAVA_OPTIONS -jar "${FUSEKI_DIR}/${FUSEKI_JAR}" --config="${FUSEKI_CONFIG}" "$@"
exec "$JAVA_HOME/bin/java" $JAVA_OPTIONS -jar "${FUSEKI_DIR}/${FUSEKI_JAR}" --config="${FUSEKI_CONFIG}"
