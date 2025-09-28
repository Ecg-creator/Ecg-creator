#!/bin/bash

# BelieversCommons Genesis Stack Deployment Script
# First Warden Faiz Ahmed - One-Command Production Deployment
# Revenue Target: ₹3.7Cr Annual Consolidation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Genesis Stack ASCII Art
echo -e "${PURPLE}"
cat << "EOF"
 ____       _ _                      ____                                           
| __ )  ___| (_) _____   _____ _ __ / ___|___  _ __ ___  _ __ ___   ___  _ __  ___ 
|  _ \ / _ \ | |/ _ \ \ / / _ \ '__| |   / _ \| '_ ` _ \| '_ ` _ \ / _ \| '_ \/ __|
| |_) |  __/ | |  __/\ V /  __/ |  | |__| (_) | | | | | | | | | | | (_) | | | \__ \
|____/ \___|_|_|\___| \_/ \___|_|   \____\___/|_| |_| |_|_| |_| |_|\___/|_| |_|___/

   ____                     _       ____  _             _    
  / ___| ___ _ __   ___  ___(_)___  / ___|| |_ __ _  ___| | __
 | |  _ / _ \ '_ \ / _ \/ __| / __| \___ \| __/ _` |/ __| |/ /
 | |_| |  __/ | | |  __/\__ \ \__ \  ___) | || (_| | (__|   < 
  \____|\___|_| |_|\___||___/_|___/ |____/ \__\__,_|\___|_|\_\

EOF
echo -e "${NC}"

echo -e "${GREEN}🚀 BelieversCommons Genesis Stack Deployment${NC}"
echo -e "${BLUE}First Warden Faiz Ahmed - Enterprise Governance Revolution${NC}"
echo -e "${YELLOW}Revenue Target: ₹3.7Cr Annual Consolidation${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker first."
    exit 1
fi

print_status "✅ All prerequisites met"

# Environment setup
print_status "Setting up Genesis Stack environment..."

# Create necessary directories
mkdir -p logs/{genesis,mahdi,compliance}
mkdir -p compliance-reports
mkdir -p nginx/ssl

# Generate SSL certificates (self-signed for development)
if [ ! -f "nginx/ssl/genesis.crt" ]; then
    print_status "Generating SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/genesis.key \
        -out nginx/ssl/genesis.crt \
        -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=BelieversCommons/OU=Genesis Stack/CN=genesis.believers-commons.org"
fi

# Setup secrets if not exists
if [ ! -f "secrets/db_password.txt" ]; then
    print_warning "Database password not found. Using default (not recommended for production)"
    echo "genesis_secure_db_password_$(date +%Y%m%d)" > secrets/db_password.txt
fi

if [ ! -f "secrets/cloudflare_token.txt" ]; then
    print_warning "Cloudflare token not found. Please update secrets/cloudflare_token.txt"
    echo "your_cloudflare_api_token_here" > secrets/cloudflare_token.txt
fi

# Build and deploy
print_status "🐳 Building Genesis Stack containers..."

# Pull latest images
docker-compose pull

# Build custom images
docker-compose build --no-cache

print_status "🚀 Starting Genesis Stack services..."

# Deploy services
docker-compose up -d

# Wait for services to be ready
print_status "⏳ Waiting for services to initialize..."
sleep 30

# Health check
print_status "🔍 Performing health checks..."

services=("genesis-api:8080" "riveros-api:8081" "synergizeos-api:8082" "mahdi-playground:3000")
healthy_count=0

for service in "${services[@]}"; do
    service_name=$(echo $service | cut -d':' -f1)
    port=$(echo $service | cut -d':' -f2)
    
    if curl -f -s http://localhost:$port/health > /dev/null; then
        print_status "✅ $service_name is healthy"
        ((healthy_count++))
    else
        print_warning "⚠️  $service_name health check failed"
    fi
done

# Database initialization
print_status "🗄️  Initializing Genesis Ledger database..."
docker-compose exec -T ledger-db psql -U genesis_admin -d genesis_ledger -c "SELECT 'Genesis Ledger Initialized' as status;"

# Display deployment summary
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE${NC}"
echo -e "${PURPLE}===================${NC}"
echo ""
echo -e "${BLUE}Genesis Stack Services:${NC}"
echo -e "  🏛️  Genesis API (EmpireOS):     http://localhost:8080"
echo -e "  💰 RiverOS (Transactions):     http://localhost:8081"
echo -e "  🔄 SynergizeOS (Orchestration): http://localhost:8082"
echo -e "  📋 ECG Compliance:             http://localhost:8083"
echo -e "  💎 MAHDI Sandbox:              http://localhost:3000"
echo ""
echo -e "${BLUE}Monitoring & Analytics:${NC}"
echo -e "  📊 Grafana Dashboard:          http://localhost:3001"
echo -e "  📈 Prometheus Metrics:         http://localhost:9090"
echo ""
echo -e "${BLUE}Revenue Streams Status:${NC}"
echo -e "  💳 Membership NFT:             ₹50L target"
echo -e "  🏢 REIT-DAO Governance:        ₹1.2Cr target"
echo -e "  🛠️  MAHDI Licensing:            ₹25L target"
echo -e "  🔒 Security Premium:           ₹45L target"
echo -e "  ✅ Compliance Automation:      ₹30L target"
echo -e "  ${GREEN}💰 TOTAL ANNUAL TARGET:        ₹3.7Cr${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update Cloudflare token in secrets/cloudflare_token.txt"
echo "2. Configure production database credentials"
echo "3. Setup domain DNS records"
echo "4. Deploy to Kubernetes for scaling: kubectl apply -f k8s-manifests/"
echo ""
echo -e "${GREEN}Healthy Services: $healthy_count/${#services[@]}${NC}"
echo ""
echo -e "${PURPLE}First Warden Faiz Ahmed - BelieversCommons Genesis Stack${NC}"
echo -e "${BLUE}Enterprise Contact: faiz.ahmed@ecg-creator.com${NC}"

# Display container status
echo ""
echo -e "${BLUE}Container Status:${NC}"
docker-compose ps

# Final verification
if [ $healthy_count -eq ${#services[@]} ]; then
    echo -e "\n${GREEN}🎯 Genesis Stack deployment successful! All services are healthy.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Genesis Stack deployed with some issues. Check service logs for details.${NC}"
    echo "Run: docker-compose logs [service-name] for troubleshooting"
    exit 1
fi