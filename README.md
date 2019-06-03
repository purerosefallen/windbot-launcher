# windbot-launcher
A server for launching WindBot.

# Disclaimer
This project is just for testing proposes, and is not intended to be used for cheating in YGOPro-related tournament. We're not responsible for your use of this project.

# How to use
Copy `config-sample.json` to `config.json` and then `node ./index.js`. The default username and password is `root` and `calvin`, which is same as Dell iDRAC. You may wish to change them in `./config.json`.
Then, visit https://windbot.koishi.pro to login the server, and launch WindBot to any servers you like.

# Docker 

This project is also available as a Docker image.

## DockerHub Image

https://hub.docker.com/r/nanahira/windbot-launcher

## Ports

`12399`: The port for HTTP API.

## Environment Variables

`WINDBOT_USERNAME`: The username.
`WINDBOT_PASSWORD`: The password.
