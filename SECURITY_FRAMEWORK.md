# ECG Security Framework

## Overview

The ECG Security Framework integrates Cloudflare Security API with Session Foundation vulnerability database to provide automated security scanning and compliance monitoring across the ECG portfolio repositories.

## Features

### 🔒 Security Scanning
- **Cloudflare API Integration**: Automated vulnerability scanning with DDoS protection, bot management, and rate limiting
- **Session Foundation Patterns**: Advanced vulnerability pattern detection for session management, network security, smart contracts, and infrastructure
- **Multi-Repository Support**: Concurrent scanning across ECG portfolio repositories
- **Real-time Monitoring**: Continuous security posture assessment

### 📋 Compliance Automation
- **DPDPA 2023**: Data processing consent, breach notification, privacy policy compliance
- **GST Compliance**: Transaction tax calculation, invoice generation, return filing automation
- **MCA Compliance**: Company registration status, annual filing, board resolution tracking
- **Charter Compliance**: License agreement monitoring per ECG-Voi Jeans terms

### 💰 Revenue Protection
- **85/15 Revenue Share**: Automated validation of revenue split calculations
- **Smart Contract Security**: Integrity monitoring and vulnerability detection
- **Platform Availability**: 99.9% uptime monitoring and alerting
- **GST Automation**: Automated tax compliance for platform governance income

### 📊 Dashboard & Reporting
- **Real-time Dashboard**: Web-based monitoring interface
- **Compliance Reports**: Automated compliance status reporting
- **Security Metrics**: Vulnerability trends and security score tracking
- **Action Items**: Prioritized remediation tasks

## Installation

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager
- Valid API keys for Cloudflare and Session Foundation

### Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/Ecg-creator/Ecg-creator.git
   cd Ecg-creator
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Configuration**
   - Update `config/security-config.yaml` with your specific requirements
   - Configure repository targets and scan schedules
   - Set compliance framework parameters

## Usage

### Command Line Interface

#### Start Full Framework
```bash
npm start
# or
node src/index.js start
```

#### Run Security Scan
```bash
npm run security-scan
# or
node src/scanner.js full
```

#### Run Compliance Check
```bash
npm run compliance-check
# or
node src/compliance/checker.js all
```

#### Quick Assessment
```bash
node src/scanner.js quick
```

### Web Dashboard

Access the dashboard at `http://localhost:3000` after starting the framework:

```bash
node src/index.js start
```

The dashboard provides:
- System status monitoring
- Security overview with vulnerability counts
- Compliance status across all frameworks
- Repository health status
- Revenue protection metrics
- Manual scan triggers

### API Endpoints

#### System Status
```bash
GET /api/status
```

#### Latest Security Results
```bash
GET /api/security/latest
```

#### Latest Compliance Results
```bash
GET /api/compliance/latest
```

#### Trigger Manual Scans
```bash
POST /api/security/scan
POST /api/compliance/check
```

## Configuration

### Security Configuration (`config/security-config.yaml`)

```yaml
cloudflare_config:
  api_security:
    vulnerability_scanning: true
    ddos_protection: enabled
    behavioral_analysis: ml_powered
  
  repository_targets:
    - "Ecg-creator/vercel"
    - "Ecg-creator/DigitalMe"
    - "Ecg-creator/SynergyzeGovernance"
    - "Believers-common-group/The-believers-lobby"

compliance_frameworks:
  dpdpa_2023:
    enabled: true
    monitoring:
      - data_processing_consent
      - data_breach_notification
      - privacy_policy_compliance

revenue_protection:
  smart_contracts:
    revenue_share_validation: true
    transaction_security: enabled
```

### Environment Variables

Required environment variables in `.env`:

```bash
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Session Foundation
SESSION_FOUNDATION_API_KEY=your_api_key

# Compliance Endpoints
DPDPA_COMPLIANCE_ENDPOINT=https://api.dpdpa.gov.in/v1
GST_COMPLIANCE_ENDPOINT=https://api.gst.gov.in/v2
MCA_COMPLIANCE_ENDPOINT=https://api.mca.gov.in/v1

# Revenue Protection
SMART_CONTRACT_RPC_URL=your_ethereum_rpc_url
REVENUE_SHARE_CONTRACT_ADDRESS=0x...

# Dashboard
DASHBOARD_PORT=3000
```

## Charter Line Document Compliance

The framework implements automated compliance monitoring per ECG-Voi Jeans license agreement:

### Article 2.1 ECG Network Custodian Obligations
- ✅ Platform security integrity maintenance
- ✅ Statutory compliance automation (GST/MCA/DPDPA 2023)
- ✅ Technical infrastructure security per Commons Technical Manual

### Article 2.2 Licensee Compliance Monitoring
- ✅ Commons Ethical Ledger violation detection
- ✅ Genesis Ledger data accuracy validation
- ✅ Principal action monitoring for assigned roles

### Article 4 Financial Security
- ✅ 85/15 revenue share smart contract protection
- ✅ Automated GST compliance for platform governance income
- ✅ Tax-deductible license expense optimization

## Security Scanning

### Vulnerability Types Detected

#### Session Management
- Session fixation vulnerabilities
- Insecure session storage
- Missing session timeout mechanisms

#### Network Security
- HTTP usage without HTTPS
- CORS misconfigurations
- Missing security headers

#### Smart Contract Security
- Reentrancy vulnerabilities
- Integer overflow/underflow
- Missing access control modifiers

#### Infrastructure Security
- Default/weak credentials
- Exposed debug information
- Insecure file permissions

#### API Security
- Missing rate limiting
- Insufficient input validation
- Unauthenticated endpoints

#### Authentication
- JWT 'none' algorithm usage
- Weak password policies
- Missing two-factor authentication

### Severity Levels

- **Critical (90-100)**: Immediate attention required
- **High (70-89)**: Address within 7 days
- **Medium (40-69)**: Address within 30 days
- **Low (10-39)**: Address in next release cycle
- **Info (0-9)**: Informational only

## Compliance Frameworks

### DPDPA 2023 (Data Protection and Digital Privacy Act)
- Data processing consent management
- Data breach notification procedures
- Privacy policy compliance validation
- User rights implementation (access, rectification, erasure)

### GST Compliance
- Transaction tax calculation accuracy
- Invoice generation with GST details
- Automated return filing
- Platform governance income tax handling

### MCA Compliance (Ministry of Corporate Affairs)
- Company registration status verification
- Annual filing compliance monitoring
- Board resolution tracking

## Revenue Protection

### 85/15 Revenue Share Monitoring
- Automated validation of revenue split calculations
- Smart contract integrity verification
- Transaction security validation
- Platform availability monitoring (99.9% target)

### GST Automation
- Automated GST calculation on platform fees
- Invoice generation with tax details
- Return filing automation
- Tax-deductible expense tracking

### License Expense Optimization
- Usage monitoring across all licenses
- Cost optimization recommendations
- Tax deduction maximization
- ROI analysis and reporting

## Alerting & Notifications

### Security Alerts
- Critical vulnerabilities detected
- Security score below threshold
- Failed security scans
- Compliance violations

### Compliance Alerts
- Compliance score below 60%
- Missing regulatory filings
- License violations
- Audit trail gaps

### Revenue Protection Alerts
- Revenue split calculation errors
- Smart contract vulnerabilities
- Platform availability issues
- GST compliance failures

## Logging

Logs are stored in the `logs/` directory:

- `combined.log`: All application logs
- `error.log`: Error-level logs only
- `security.log`: Security-specific events
- `compliance.log`: Compliance-specific events

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Development Mode
```bash
npm run dev
```

## Deployment

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure all required environment variables
3. Set up monitoring and alerting
4. Configure log rotation
5. Set up SSL certificates for dashboard

### Docker Deployment
```bash
# Build image
docker build -t ecg-security-framework .

# Run container
docker run -d \
  --name ecg-security \
  -p 3000:3000 \
  --env-file .env \
  ecg-security-framework
```

## Troubleshooting

### Common Issues

#### API Connection Failures
- Verify API keys are correct and active
- Check network connectivity to external APIs
- Validate API endpoint URLs

#### Scan Failures
- Ensure repository URLs are accessible
- Check GitHub token permissions
- Verify Cloudflare zone configuration

#### Compliance Check Errors
- Validate compliance endpoint configurations
- Check API rate limits
- Ensure proper authentication

#### Dashboard Not Loading
- Verify port 3000 is available
- Check dashboard service logs
- Ensure all dependencies are installed

### Log Analysis
```bash
# View security logs
tail -f logs/security.log

# View compliance logs
tail -f logs/compliance.log

# View all logs
tail -f logs/combined.log
```

## Support

For technical support and inquiries:

- **Email**: faiz.ahmed@ecg-creator.com
- **LinkedIn**: [Faiz Ahmed](https://www.linkedin.com/in/faizahmed)
- **GitHub**: [ECG Creator Organization](https://github.com/Ecg-creator)

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Success Metrics

The framework targets the following success metrics:
- ✅ Zero security breach incidents across portfolio
- ✅ 100% license compliance automation
- ✅ 30% premium service pricing capability
- ✅ ₹3.2Cr annual profit increase through security monetization

---

© 2024 ECG Creator - Enterprise Governance Solutions