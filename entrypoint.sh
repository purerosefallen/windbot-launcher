#!/bin/bash
sed -n "s/root/$WINDBOT_USERNAME/g;s/calvin/$WINDBOT_PASSWORD/g" /windbot-launcher/config-sample.json > /windbot-launcher/config.json
node /windbot-launcher/index.js
