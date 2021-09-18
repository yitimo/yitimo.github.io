FROM nginx:1.19.0-alpine

COPY ./docs /usr/share/nginx/html
