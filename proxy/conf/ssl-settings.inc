## Caching and timeout for performance
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 45m;
## Diffie-Hellman cert, for PFS
# ssl_dhparam /etc/ssl/dhparam.pem;

## Use what we want over what the browser wants
ssl_prefer_server_ciphers on;
## Only allow up-to-date protocols
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;
## Smaller buffer is more responsive and better for small data, larger buffer better for bigger files (default: 16k)
ssl_buffer_size 8k;

## HSTS long duration:
add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload" always;
