# Stage 1: render _pages/*.html through _layouts/base.html into the site root,
# then strip everything that should not be served.
FROM python:3.12-slim AS build
WORKDIR /site
COPY . .
RUN python3 build.py \
 && rm -rf _pages _layouts build.py README.md EDITING.md .github Dockerfile fly.toml

# Stage 2: nginx serves the rendered site. The official image logs every
# request and error to stdout/stderr, which lands in `fly logs`.
FROM nginx:alpine
COPY --from=build /site /usr/share/nginx/html
