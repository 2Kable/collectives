FROM node:22-slim AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY collectives/static/css/ /build/collectives/static/css/
COPY frontend/ ./
RUN npm run build

FROM python:3.13

LABEL org.opencontainers.image.authors="CAF Annecy <digital@cafannecy.fr"

# UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY deployment/docker /app/deployment/docker/
RUN chmod +x /app/deployment/docker/entrypoint.sh

COPY instance /app/instance/
COPY logs /app/logs/

COPY migrations /app/migrations/
COPY config.py pyproject.toml .python-version uv.lock README.md /app/

COPY collectives /app/collectives/
COPY --from=frontend-builder /build/collectives/static/dist/vite /app/collectives/static/dist/vite
COPY deployment/docker/logging.cfg /app/
COPY metadata.jso[n] /app/

RUN cd /app; uv sync --locked --no-dev --extra deploy

WORKDIR /app

EXPOSE 5000
    
ENTRYPOINT [ "/app/deployment/docker/entrypoint.sh" ]

CMD [ "" ]
