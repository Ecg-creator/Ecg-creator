const axios = require('axios');
const logger = require('../utils/logger');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

class CloudflareService {
  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID;
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.baseURL = 'https://api.cloudflare.com/client/v4';
    
    this.config = null;
    this.client = null;
  }

  async initialize() {
    try {
      // Load configuration
      const configPath = path.join(process.cwd(), 'config', 'security-config.yaml');
      const configFile = fs.readFileSync(configPath, 'utf8');
      this.config = YAML.parse(configFile);

      // Initialize HTTP client
      this.client = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      logger.info('Cloudflare service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Cloudflare service:', error);
      return false;
    }
  }

  async enableSecurityFeatures() {
    try {
      const securityFeatures = this.config.cloudflare_config.api_security;
      const results = {};

      // Enable DDoS protection
      if (securityFeatures.ddos_protection === 'enabled') {
        results.ddos = await this.enableDDoSProtection();
      }

      // Enable bot management
      if (securityFeatures.bot_management === 'enabled') {
        results.botManagement = await this.enableBotManagement();
      }

      // Enable rate limiting
      if (securityFeatures.rate_limiting) {
        results.rateLimiting = await this.enableRateLimiting();
      }

      logger.security('Cloudflare security features enabled', { results });
      return results;
    } catch (error) {
      logger.error('Failed to enable Cloudflare security features:', error);
      throw error;
    }
  }

  async enableDDoSProtection() {
    try {
      const response = await this.client.put(`/zones/${this.zoneId}/settings/security_level`, {
        value: 'high'
      });

      logger.security('DDoS protection enabled', { response: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to enable DDoS protection:', error);
      return { success: false, error: error.message };
    }
  }

  async enableBotManagement() {
    try {
      const response = await this.client.put(`/zones/${this.zoneId}/settings/bot_management`, {
        value: 'on'
      });

      logger.security('Bot management enabled', { response: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to enable bot management:', error);
      return { success: false, error: error.message };
    }
  }

  async enableRateLimiting() {
    try {
      // Create rate limiting rule for API endpoints
      const ruleData = {
        threshold: 100,
        period: 60,
        action: {
          mode: 'challenge',
          timeout: 86400
        },
        match: {
          request: {
            url: '*api*'
          }
        },
        disabled: false,
        description: 'ECG Security Framework - API Rate Limiting'
      };

      const response = await this.client.post(`/zones/${this.zoneId}/rate_limits`, ruleData);

      logger.security('Rate limiting enabled', { response: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to enable rate limiting:', error);
      return { success: false, error: error.message };
    }
  }

  async scanRepositoryForVulnerabilities(repoUrl) {
    try {
      logger.security(`Starting vulnerability scan for repository: ${repoUrl}`);
      
      // Simulate vulnerability scanning (in real implementation, this would integrate with Cloudflare's security scanning APIs)
      const scanResults = {
        repository: repoUrl,
        timestamp: new Date().toISOString(),
        vulnerabilities: await this.performVulnerabilityScan(repoUrl),
        securityScore: 0,
        recommendations: []
      };

      // Calculate security score based on vulnerabilities found
      scanResults.securityScore = this.calculateSecurityScore(scanResults.vulnerabilities);
      scanResults.recommendations = this.generateRecommendations(scanResults.vulnerabilities);

      logger.security('Repository vulnerability scan completed', {
        repository: repoUrl,
        score: scanResults.securityScore,
        vulnerabilityCount: scanResults.vulnerabilities.length
      });

      return scanResults;
    } catch (error) {
      logger.error(`Failed to scan repository ${repoUrl}:`, error);
      throw error;
    }
  }

  async performVulnerabilityScan(repoUrl) {
    // Simulate vulnerability detection patterns
    const vulnerabilities = [];
    
    // Common vulnerability patterns to check
    const patterns = [
      {
        type: 'exposed_secrets',
        severity: 'critical',
        description: 'API keys or secrets exposed in code',
        pattern: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*[\'"]?[\w\-]{10,}[\'"]?/gi
      },
      {
        type: 'sql_injection',
        severity: 'high',
        description: 'Potential SQL injection vulnerability',
        pattern: /SELECT\s+.*\s+FROM\s+.*WHERE.*\$\{?.*\}?/gi
      },
      {
        type: 'xss_vulnerability',
        severity: 'medium',
        description: 'Cross-site scripting vulnerability',
        pattern: /innerHTML\s*=.*\$\{?.*\}?/gi
      },
      {
        type: 'weak_encryption',
        severity: 'medium',
        description: 'Weak encryption algorithm detected',
        pattern: /md5|sha1(?!256)/gi
      }
    ];

    // Simulate finding some vulnerabilities based on repository type
    if (repoUrl.includes('api') || repoUrl.includes('backend')) {
      vulnerabilities.push({
        id: `vuln_${Date.now()}_1`,
        type: 'exposed_secrets',
        severity: 'high',
        description: 'Potential API key exposure in configuration files',
        file: 'config/database.js',
        line: 23,
        recommendation: 'Move secrets to environment variables'
      });
    }

    if (repoUrl.includes('frontend') || repoUrl.includes('web')) {
      vulnerabilities.push({
        id: `vuln_${Date.now()}_2`,
        type: 'xss_vulnerability',
        severity: 'medium',
        description: 'Potential XSS vulnerability in user input handling',
        file: 'src/components/UserForm.js',
        line: 45,
        recommendation: 'Sanitize user input before rendering'
      });
    }

    return vulnerabilities;
  }

  calculateSecurityScore(vulnerabilities) {
    let score = 100;
    
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });

    return Math.max(0, score);
  }

  generateRecommendations(vulnerabilities) {
    const recommendations = [];
    const vulnTypes = [...new Set(vulnerabilities.map(v => v.type))];

    vulnTypes.forEach(type => {
      switch (type) {
        case 'exposed_secrets':
          recommendations.push('Implement proper secret management using environment variables or secret management services');
          break;
        case 'sql_injection':
          recommendations.push('Use parameterized queries and input validation');
          break;
        case 'xss_vulnerability':
          recommendations.push('Implement proper input sanitization and output encoding');
          break;
        case 'weak_encryption':
          recommendations.push('Upgrade to stronger encryption algorithms (SHA-256 or better)');
          break;
      }
    });

    return recommendations;
  }

  async getSecurityAnalytics() {
    try {
      const response = await this.client.get(`/zones/${this.zoneId}/analytics/dashboard`);
      
      logger.security('Retrieved Cloudflare security analytics');
      return response.data;
    } catch (error) {
      logger.error('Failed to get security analytics:', error);
      throw error;
    }
  }

  async createSecurityRule(rule) {
    try {
      const response = await this.client.post(`/zones/${this.zoneId}/firewall/rules`, rule);
      
      logger.security('Created security rule', { rule: rule.description });
      return response.data;
    } catch (error) {
      logger.error('Failed to create security rule:', error);
      throw error;
    }
  }
}

module.exports = CloudflareService;