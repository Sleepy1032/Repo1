#!/bin/sh
# Starts Pocket Depth at http://localhost:8642/ and opens it in your browser.
cd "$(dirname "$0")" || exit 1
(sleep 1; open "http://localhost:8642/") &
exec python3 -m http.server 8642 --bind 127.0.0.1
