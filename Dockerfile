FROM nanahira/windbot

RUN apt update && \
    env DEBIAN_FRONTEND=noninteractive apt install -y nodejs npm

COPY . /windbot-launcher
WORKDIR /windbot-launcher
RUN npm install && \
    ln -s /windbot /windbot-launcher/windbot && \
    cp -rf config-sample.json config.json

WORKDIR /windbot-launcher
EXPOSE 12399
ENV WINDBOT_USERNAME root
ENV WINDBOT_PASSWORD calvin
CMD [ "/windbot-launcher/entrypoint.sh" ]
