FROM savonet/liquidsoap:8101608

ENV ICECAST_URL http://funkyradio.streamingmedia.it:8001/play.mp3
ENV OUT_URL http://bridge:3000/data

COPY script.liq script.liq

USER root
# install curl
RUN apt-get update && apt-get install -y curl

USER liquidsoap

CMD ["liquidsoap", "script.liq"]
