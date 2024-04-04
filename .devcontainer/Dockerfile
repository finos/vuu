FROM   mcr.microsoft.com/devcontainers/java:17

COPY ./install-sdk-packages.sh ./install-sdk-packages.sh

RUN chmod u+x ./install-sdk-packages.sh && ./install-sdk-packages.sh && rm ./install-sdk-packages.sh
