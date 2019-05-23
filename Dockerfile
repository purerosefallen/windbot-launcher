FROM node:stretch

RUN apt update && \
    env DEBIAN_FRONTEND=noninteractive apt install -y curl wget vim sudo git mono-complete

RUN npm -g install pm2

COPY . /windbot-launcher
WORKDIR /windbot-launcher
RUN npm ci && \
    cp -rf config-sample.json config.json

RUN git clone https://github.com/purerosefallen/windbot /windbot-launcher/windbot
WORKDIR /windbot-launcher/windbot
RUN xbuild /property:Configuration=Release /property:TargetFrameworkVersion="v4.5" && \
    ln -s ./bin/Release/WindBot.exe .
RUN wget -O /windbot-launcher/windbot/cards.cdb https://github.com/purerosefallen/ygopro-database/raw/master/locales/zh-CN/cards.cdb

WORKDIR /windbot-launcher
EXPOSE 12399
VOLUME /windbot-launcher/config.json

CMD [ "pm2-docker", "start", "/windbot-launcher/index.js" ]
