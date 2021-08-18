FROM nginx:1.19.0-alpine

COPY ./_site /usr/share/nginx/html
