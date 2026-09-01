# Despite what SonarQube says both the tag and sha digest are needed:
# the digest pins the exact image for reproducibility,
# the tag allows Dependabot to evaluate version constraints
FROM node:24.20.0-bookworm@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2

# Ignore what SonarQube says about using ADD instead of curl
# curl is used intentionally over ADD: ADD lacks support for --proto, -f, -s, -L flags and cannot
# unzip and clean up in a single layer, which would increase image size
# this is the approach suggested in AWS docs
RUN curl --proto =https -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws
ENV AWS_PAGER=""

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY .npmrc .npmrc
COPY .nvmrc .nvmrc

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm ci --ignore-scripts && npm run install-browsers

# Ignore what SonarQube says about recursive copying
# it is safe in this context
COPY . .

HEALTHCHECK NONE

USER node

ENTRYPOINT [ "./run-tests.sh" ]
