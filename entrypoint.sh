#!/bin/bash
cat /windbot-launcher/config-sample.json | sed "s/root/$WINDBOT_USERNAME/g;s/calvin/$WINDBOT_PASSWORD/g" > /windbot-launcher/config.json
node /windbot-launcher/index.js
