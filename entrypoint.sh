#!/bin/bash
cat /windbot-launcher/config-sample.json | sed "s/root/$WINDBOT_USERNAME/g;s/calvin/$WINDBOT_PASSWORD/g" > /windbot-launcher/config.json
pm2-docker start /windbot-launcher/index.js
