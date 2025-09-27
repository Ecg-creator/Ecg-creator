# Genesis Stack Deployment Guide

## Quick Start (5-Minute Deployment)

### Prerequisites
- Docker & Docker Compose installed
- 8GB+ RAM available
- 20GB+ disk space

### Deployment Steps

1. **Clone & Configure**
   ```bash
   git clone https://github.com/Ecg-creator/Ecg-creator.git
   cd Ecg-creator
   
   # Update secrets (required)
   echo "your_secure_db_password" > secrets/db_password.txt
   echo "your_cloudflare_token" > secrets/cloudflare_token.txt
   echo "your_grafana_password" > secrets/grafana_password.txt
   ```

2. **Deploy Genesis Stack**
   ```bash
   # One-command deployment
   ./deploy.sh
   
   # Or manual deployment
   docker-compose up -d
   ```

3. **Verify Services**
   ```bash
   # Health checks
   curl http://localhost:8080/health    # Genesis API
   curl http://localhost:8081/health    # RiverOS
   curl http://localhost:8082/health    # SynergizeOS
   curl http://localhost:3000/health    # MAHDI Sandbox
   ```

### Service Endpoints

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Genesis API (EmpireOS) | 8080 | http://localhost:8080 | Core governance |
| RiverOS | 8081 | http://localhost:8081 | Revenue management |
| SynergizeOS | 8082 | http://localhost:8082 | Orchestration |
| ECG Compliance | 8083 | http://localhost:8083 | Compliance framework |
| MAHDI Sandbox | 3000 | http://localhost:3000 | Ruby playground |
| Grafana | 3001 | http://localhost:3001 | Analytics dashboard |
| Prometheus | 9090 | http://localhost:9090 | Metrics collection |

## Production Deployment (Kubernetes)

### Deploy to Kubernetes
```bash
# Create namespace and deploy
kubectl apply -f k8s-manifests/namespace.yaml
kubectl apply -f k8s-manifests/genesis-stack-deployment.yaml

# Check deployment status
kubectl get pods -n believers-commons
kubectl get services -n believers-commons

# Scale for high availability
kubectl scale deployment genesis-stack --replicas=5 -n believers-commons
```

### Auto-scaling Configuration
The Genesis Stack includes Horizontal Pod Autoscaler (HPA) with:
- CPU threshold: 70%
- Memory threshold: 80%
- Revenue per pod: ₹10L target
- Min replicas: 3, Max replicas: 10

## Revenue Streams Verification

### Check Revenue Status
```bash
# Overall revenue summary
curl http://localhost:8080/api/v1/revenue/summary

# Individual stream status
curl http://localhost:8081/revenue/streams    # REIT-DAO
curl http://localhost:8080/api/v1/membership  # SBT fees
curl http://localhost:3000/api/usage          # MAHDI licensing
```

### Expected Revenue Targets
- **Membership NFT**: ₹50L annually (SBT issuance fees)
- **REIT-DAO**: ₹1.2Cr annually (asset management)
- **MAHDI Sandbox**: ₹25L annually (developer licensing)
- **Security Premium**: ₹45L annually (Cloudflare integration)
- **Compliance**: ₹30L annually (regulatory services)
- **TOTAL**: ₹3.7Cr annually

## Compliance Verification

### ECG Charter Compliance Check
```bash
# Article 2.1 - Platform Security
curl http://localhost:8083/ecg-charter/status

# Article 4 - Financial Terms
curl http://localhost:8081/revenue/distribute

# DPDPA 2023 - Privacy Compliance
curl http://localhost:8083/dpdpa-2023/status
```

### Automated Compliance Reports
```bash
# Generate compliance report
curl http://localhost:8083/reports/generate?framework=all&period=monthly

# Check audit trail
curl http://localhost:8083/audit-trail
```

## Monitoring & Analytics

### Grafana Dashboards
Access: http://localhost:3001
- Revenue optimization analytics
- Member engagement metrics
- Compliance monitoring
- Infrastructure performance

### Prometheus Metrics
Access: http://localhost:9090
- Service health monitoring
- Revenue tracking
- Blockchain transaction metrics
- Container resource usage

## Troubleshooting

### Common Issues

1. **Service Health Check Fails**
   ```bash
   # Check container logs
   docker-compose logs genesis-api
   docker-compose logs riveros-api
   
   # Restart specific service
   docker-compose restart genesis-api
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose logs ledger-db
   
   # Reset database
   docker-compose down
   docker volume rm ecg-creator_postgres_data
   docker-compose up -d
   ```

3. **Revenue Tracking Not Working**
   ```bash
   # Check Prometheus metrics
   curl http://localhost:9090/api/v1/query?query=genesis_revenue_target_inr
   
   # Verify database tables
   docker-compose exec ledger-db psql -U genesis_admin -d genesis_ledger -c "SELECT * FROM genesis.revenue_streams;"
   ```

### Performance Optimization

1. **Scale Services**
   ```bash
   # Scale Genesis API
   docker-compose up -d --scale genesis-api=3
   
   # Scale for Kubernetes
   kubectl scale deployment genesis-stack --replicas=5
   ```

2. **Resource Monitoring**
   ```bash
   # Check resource usage
   docker stats
   
   # Kubernetes resource usage
   kubectl top pods -n believers-commons
   ```

## Security Configuration

### Cloudflare Integration
1. Update `secrets/cloudflare_token.txt` with your API token
2. Configure DNS records for your domain
3. Enable WAF and DDoS protection in Cloudflare dashboard

### SSL/TLS Certificates
```bash
# Generate production certificates
openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout nginx/ssl/production.key \
  -out nginx/ssl/production.crt \
  -subj "/C=IN/O=BelieversCommons/CN=your-domain.com"
```

### Multi-signature Safe
```bash
# Check Safe status
curl http://localhost:8080/api/v1/blockchain/multisig/status

# Verify owners and threshold
curl http://localhost:8081/multisig/status
```

## Backup & Recovery

### Database Backup
```bash
# Create backup
docker-compose exec ledger-db pg_dump -U genesis_admin genesis_ledger > backup.sql

# Restore backup
docker-compose exec -T ledger-db psql -U genesis_admin genesis_ledger < backup.sql
```

### Configuration Backup
```bash
# Backup all configurations
tar -czf genesis-stack-backup.tar.gz \
  docker-compose.yml \
  nginx/ \
  monitoring/ \
  k8s-manifests/ \
  secrets/
```

## Support & Contact

**First Warden Faiz Ahmed**
- Email: faiz.ahmed@ecg-creator.com
- LinkedIn: [Faiz Ahmed](https://www.linkedin.com/in/faizahmed)
- Enterprise Support: Available for ₹1Cr+ implementations

**Revenue Optimization Consulting**
- Strategic revenue planning
- Compliance framework customization
- Multi-signature treasury management
- Custom Genesis Stack implementations

---

*BelieversCommons Genesis Stack - Enterprise Governance Revolution*
*Powered by Docker • Secured by Cloudflare • Compliant with ECG Charter & DPDPA 2023*