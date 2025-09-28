# Multi-stage Docker architecture for BelieversCommons Genesis Stack
# First Warden Faiz Ahmed - Genesis Stack Integration

# Genesis Base - Core Node.js foundation
FROM node:18-alpine as genesis-base
LABEL maintainer="faiz.ahmed@ecg-creator.com"
LABEL version="1.0.0"
LABEL description="BelieversCommons Genesis Stack - EmpireOS, RiverOS, SynergizeOS"

WORKDIR /app/genesis
RUN apk add --no-cache curl wget git openssl
COPY genesis/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# MAHDI Sandbox - Ruby on Rails development environment
FROM ruby:3.1-alpine as mahdi-sandbox
LABEL description="MAHDI Language Sandbox with Rails integration"

RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    git \
    curl \
    nodejs \
    npm \
    opentelemetry-cpp

WORKDIR /app/mahdi
COPY mahdi/Gemfile* ./
RUN bundle config set --local deployment 'true' && \
    bundle config set --local without 'development test' && \
    bundle install

# Ledger Database - PostgreSQL with Genesis integration
FROM postgres:15-alpine as ledger-db
LABEL description="Immutable Genesis Ledger Database"

ENV POSTGRES_DB=genesis_ledger
ENV POSTGRES_USER=genesis_admin
ENV POSTGRES_PASSWORD_FILE=/run/secrets/db_password

RUN apk add --no-cache postgresql-contrib
COPY database/init-genesis-ledger.sql /docker-entrypoint-initdb.d/
COPY database/reit-dao-schema.sql /docker-entrypoint-initdb.d/

# Reverse Proxy - NGINX with Cloudflare integration
FROM nginx:alpine as reverse-proxy
LABEL description="Cloudflare-integrated reverse proxy"

RUN apk add --no-cache openssl curl
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/genesis-stack.conf /etc/nginx/conf.d/
COPY nginx/cloudflare-ssl/ /etc/nginx/ssl/

# Final production image - Genesis Stack unified
FROM node:18-alpine as production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    redis \
    nginx \
    supervisor \
    curl \
    openssl \
    ruby \
    python3 \
    py3-pip

# Create application directories
RUN mkdir -p /app/{genesis,mahdi,compliance,security,metrics} \
    /var/log/{genesis,mahdi,compliance} \
    /etc/supervisor/conf.d

# Copy Genesis Stack components
COPY --from=genesis-base /app/genesis /app/genesis
COPY --from=mahdi-sandbox /app/mahdi /app/mahdi
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy application source
COPY src/ /app/
COPY config/ /app/config/
COPY scripts/ /app/scripts/

# Set up supervisor configuration
COPY docker/supervisor/ /etc/supervisor/conf.d/

# Install Python dependencies for compliance framework
COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r /app/requirements.txt

# Create non-root user for security
RUN addgroup -g 1001 genesis && \
    adduser -D -u 1001 -G genesis genesis

# Set permissions
RUN chown -R genesis:genesis /app /var/log/genesis /var/log/mahdi /var/log/compliance

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose ports
EXPOSE 8080 8081 8082 5432 6379 9090

USER genesis

# Start supervisor to manage all services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]