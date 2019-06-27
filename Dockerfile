FROM nanahira/windbot

RUN apt update && \
    env DEBIAN_FRONTEND=noninteractive apt install -y nodejs

COPY . /windbot-launcher
WORKDIR /windbot-launcher
RUN ln -s /windbot /windbot-launcher/windbot && \
    cp -rf config-sample.json config.json

EXPOSE 12399
ENV WINDBOT_USERNAME root
ENV WINDBOT_PASSWORD calvin
CMD [ "/windbot-launcher/entrypoint.sh" ]
