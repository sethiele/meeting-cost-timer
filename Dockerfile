FROM nginx:1.27-alpine
COPY . /usr/share/nginx/html/
# Versionsnummer (Git-Tag) beim Bauen setzen, z. B. --build-arg VERSION=v1.2.0
ARG VERSION=dev
RUN printf "window.APP_VERSION = '%s';\n" "$VERSION" > /usr/share/nginx/html/js/version.js
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]