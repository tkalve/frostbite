FROM docker.io/node:lts-alpine AS base

FROM base AS installer
WORKDIR /app
COPY . .

RUN yarn install --immutable
RUN yarn build

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim

# Ensure the directory exists before changing ownership
RUN mkdir -p /etc/nginx/conf.d && chown -R nginx /etc/nginx/conf.d

WORKDIR /app

COPY --from=installer /app/dist .
COPY /nginx/default.conf /etc/nginx/templates/default.conf.template
COPY /nginx/securityheaders.conf /etc/nginx/templates/securityheaders.conf.template

USER 0

RUN mkdir -p /etc/nginx/conf.d && chown -R nginx /etc/nginx/conf.d
RUN chown -R nginx /etc/nginx/conf.d \
    && chown -R nginx /app \
    && chmod +x /docker-entrypoint.d/*.sh

USER 101
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
