#!/bin/sh
## Configuration for CoMetaR application
echo "---- BEGIN WEB CONFIGURATION ----"

## Set the link to be followed when clicking the brand image (bottom left)
envsubst "\$HREF_BRAND" < /config/cometar_config_template.json > /usr/share/nginx/html/cometar_browser/assets/config/config.json
## Set the html title tag
[ -e /usr/share/nginx/html/cometar_browser/index.html_ORIG ] || cp /usr/share/nginx/html/cometar_browser/index.html /usr/share/nginx/html/cometar_browser/index.html_ORIG
## The HTML has some unclosed tags, so xmlstarlet doesn't like it
# xmlstarlet ed -u '//title' -x "${TITLE}" /usr/share/nginx/html/cometar_browser/index.html_ORIG > /usr/share/nginx/html/cometar_browser/index.html_test
sed "s|<title>.*</title>|<title>${TITLE}</title>|g" /usr/share/nginx/html/cometar_browser/index.html_ORIG > /usr/share/nginx/html/cometar_browser/index.html
sed -i "s|</head>|\n${head_script}\n</head>|g" /usr/share/nginx/html/cometar_browser/index.html
sed -i "s|<body>|<body>\n${header_placeholder}|g" /usr/share/nginx/html/cometar_browser/index.html
sed -i "s|</body>|\n${footer_placeholder}\n<\body>|g" /usr/share/nginx/html/cometar_browser/index.html

chown -R nginx:nginx /usr/share/nginx/html/cometar_browser
echo "---- END WEB CONFIGURATION ----"
