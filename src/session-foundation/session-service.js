const axios = require('axios');
const logger = require('../utils/logger');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

class SessionFoundationService {
  constructor() {
    this.apiKey = process.env.SESSION_FOUNDATION_API_KEY;
    this.baseURL = process.env.SESSION_FOUNDATION_BASE_URL || 'https://api.sessionfoundation.com/v1';
    
    this.config = null;
    this.client = null;
    this.vulnerabilityPatterns = [];
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
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // Load vulnerability patterns
      this.loadVulnerabilityPatterns();

      logger.info('Session Foundation service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Session Foundation service:', error);
      return false;
    }
  }

  loadVulnerabilityPatterns() {
    this.vulnerabilityPatterns = [
      {
        name: 'session_management_vulnerabilities',
        patterns: [
          {
            type: 'session_fixation',
            description: 'Session ID not regenerated after authentication',
            severity: 'high',
            pattern: /login.*session_start\(\)/gi
          },
          {
            type: 'insecure_session_storage',
            description: 'Session data stored in insecure location',
            severity: 'medium',
            pattern: /localStorage\.setItem.*session/gi
          },
          {
            type: 'missing_session_timeout',
            description: 'No session timeout mechanism implemented',
            severity: 'medium',
            pattern: /session_start.*(?!.*timeout)/gi
          }
        ]
      },
      {
        name: 'network_security_configuration_issues',
        patterns: [
          {
            type: 'http_without_https',
            description: 'HTTP used instead of HTTPS',
            severity: 'high',
            pattern: /http:\/\/(?!localhost)/gi
          },
          {
            type: 'cors_misconfiguration',
            description: 'CORS configured to allow all origins',
            severity: 'medium',
            pattern: /Access-Control-Allow-Origin.*\*/gi
          },
          {
            type: 'missing_security_headers',
            description: 'Missing security headers',
            severity: 'medium',
            pattern: /(?!.*X-Frame-Options)(?!.*X-Content-Type-Options)/gi
          }
        ]
      },
      {
        name: 'smart_contract_security_patterns',
        patterns: [
          {
            type: 'reentrancy_vulnerability',
            description: 'Potential reentrancy attack vulnerability',
            severity: 'critical',
            pattern: /\.call\{value:.*\}\(\)/gi
          },
          {
            type: 'integer_overflow',
            description: 'Potential integer overflow/underflow',
            severity: 'high',
            pattern: /\+\+|\-\-|[\+\-\*\/]\s*=\s*(?!.*SafeMath)/gi
          },
          {
            type: 'access_control_missing',
            description: 'Missing access control modifiers',
            severity: 'medium',
            pattern: /function\s+\w+\s*\([^)]*\)\s*(?!.*\b(?:onlyOwner|private|internal)\b)/gi
          }
        ]
      },
      {
        name: 'infrastructure_security_gaps',
        patterns: [
          {
            type: 'default_credentials',
            description: 'Default or weak credentials detected',
            severity: 'critical',
            pattern: /password.*=.*(admin|123456|password)/gi
          },
          {
            type: 'exposed_debug_info',
            description: 'Debug information exposed in production',
            severity: 'medium',
            pattern: /console\.(log|debug|error).*(?=.*password|.*token|.*key)/gi
          },
          {
            type: 'insecure_file_permissions',
            description: 'Insecure file permissions',
            severity: 'medium',
            pattern: /chmod\s+777/gi
          }
        ]
      },
      {
        name: 'api_security_misconfigurations',
        patterns: [
          {
            type: 'missing_rate_limiting',
            description: 'API endpoints without rate limiting',
            severity: 'medium',
            pattern: /app\.(get|post|put|delete).*(?!.*rateLimit)/gi
          },
          {
            type: 'missing_input_validation',
            description: 'Missing input validation on API endpoints',
            severity: 'high',
            pattern: /req\.(body|params|query)\..*(?!.*validate)/gi
          },
          {
            type: 'exposed_api_endpoints',
            description: 'API endpoints without authentication',
            severity: 'high',
            pattern: /app\.(get|post|put|delete).*(?!.*auth)/gi
          }
        ]
      },
      {
        name: 'authentication_bypass_patterns',
        patterns: [
          {
            type: 'jwt_none_algorithm',
            description: 'JWT using none algorithm vulnerability',
            severity: 'critical',
            pattern: /jwt\.sign.*algorithm.*none/gi
          },
          {
            type: 'weak_password_policy',
            description: 'Weak password policy implementation',
            severity: 'medium',
            pattern: /password.*length.*[1-5]/gi
          },
          {
            type: 'missing_2fa',
            description: 'Two-factor authentication not implemented',
            severity: 'medium',
            pattern: /login.*(?!.*2fa|.*totp|.*mfa)/gi
          }
        ]
      }
    ];

    logger.security('Loaded vulnerability patterns', { 
      patternCount: this.vulnerabilityPatterns.length 
    });
  }

  async scanForVulnerabilities(codeContent, filePath = '') {
    try {
      const vulnerabilities = [];
      const timestamp = new Date().toISOString();

      // Scan code content against all patterns
      for (const patternGroup of this.vulnerabilityPatterns) {
        for (const pattern of patternGroup.patterns) {
          const matches = codeContent.match(pattern.pattern);
          
          if (matches) {
            matches.forEach((match, index) => {
              vulnerabilities.push({
                id: `sf_${Date.now()}_${index}`,
                type: pattern.type,
                category: patternGroup.name,
                severity: pattern.severity,
                description: pattern.description,
                file: filePath,
                line: this.getLineNumber(codeContent, match),
                match: match,
                timestamp: timestamp,
                recommendation: this.getRecommendation(pattern.type)
              });
            });
          }
        }
      }

      logger.security('Session Foundation vulnerability scan completed', {
        file: filePath,
        vulnerabilitiesFound: vulnerabilities.length
      });

      return vulnerabilities;
    } catch (error) {
      logger.error('Failed to scan for vulnerabilities:', error);
      throw error;
    }
  }

  getLineNumber(content, match) {
    const lines = content.substring(0, content.indexOf(match)).split('\n');
    return lines.length;
  }

  getRecommendation(vulnerabilityType) {
    const recommendations = {
      'session_fixation': 'Regenerate session ID after successful authentication',
      'insecure_session_storage': 'Use secure, httpOnly cookies for session storage',
      'missing_session_timeout': 'Implement proper session timeout mechanisms',
      'http_without_https': 'Always use HTTPS in production environments',
      'cors_misconfiguration': 'Configure CORS to allow only specific trusted origins',
      'missing_security_headers': 'Add security headers like X-Frame-Options, X-Content-Type-Options',
      'reentrancy_vulnerability': 'Use reentrancy guards and checks-effects-interactions pattern',
      'integer_overflow': 'Use SafeMath library for arithmetic operations',
      'access_control_missing': 'Add proper access control modifiers to functions',
      'default_credentials': 'Change all default credentials and use strong passwords',
      'exposed_debug_info': 'Remove debug statements before production deployment',
      'insecure_file_permissions': 'Set appropriate file permissions (644 for files, 755 for directories)',
      'missing_rate_limiting': 'Implement rate limiting on all API endpoints',
      'missing_input_validation': 'Add comprehensive input validation and sanitization',
      'exposed_api_endpoints': 'Implement proper authentication and authorization',
      'jwt_none_algorithm': 'Never use "none" algorithm for JWT tokens',
      'weak_password_policy': 'Implement strong password policies (min 8 chars, complexity)',
      'missing_2fa': 'Implement two-factor authentication for sensitive operations'
    };

    return recommendations[vulnerabilityType] || 'Review and address this security issue';
  }

  async analyzeSecurityPosture(scanResults) {
    try {
      const analysis = {
        timestamp: new Date().toISOString(),
        totalVulnerabilities: scanResults.length,
        severityBreakdown: this.getSeverityBreakdown(scanResults),
        categoryBreakdown: this.getCategoryBreakdown(scanResults),
        riskScore: this.calculateRiskScore(scanResults),
        topRecommendations: this.getTopRecommendations(scanResults),
        complianceImpact: this.assessComplianceImpact(scanResults)
      };

      logger.security('Security posture analysis completed', {
        riskScore: analysis.riskScore,
        totalVulnerabilities: analysis.totalVulnerabilities
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze security posture:', error);
      throw error;
    }
  }

  getSeverityBreakdown(vulnerabilities) {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    
    vulnerabilities.forEach(vuln => {
      if (breakdown[vuln.severity] !== undefined) {
        breakdown[vuln.severity]++;
      }
    });

    return breakdown;
  }

  getCategoryBreakdown(vulnerabilities) {
    const breakdown = {};
    
    vulnerabilities.forEach(vuln => {
      breakdown[vuln.category] = (breakdown[vuln.category] || 0) + 1;
    });

    return breakdown;
  }

  calculateRiskScore(vulnerabilities) {
    let score = 0;
    
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score += 10;
          break;
        case 'high':
          score += 7;
          break;
        case 'medium':
          score += 4;
          break;
        case 'low':
          score += 1;
          break;
      }
    });

    return Math.min(100, score);
  }

  getTopRecommendations(vulnerabilities) {
    const recommendations = {};
    
    vulnerabilities.forEach(vuln => {
      const rec = this.getRecommendation(vuln.type);
      recommendations[rec] = (recommendations[rec] || 0) + 1;
    });

    return Object.entries(recommendations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([recommendation, count]) => ({ recommendation, count }));
  }

  assessComplianceImpact(vulnerabilities) {
    const impact = {
      dpdpa2023: { affected: false, issues: [] },
      gst: { affected: false, issues: [] },
      mca: { affected: false, issues: [] }
    };

    vulnerabilities.forEach(vuln => {
      // DPDPA 2023 impact
      if (['exposed_debug_info', 'missing_input_validation', 'insecure_session_storage'].includes(vuln.type)) {
        impact.dpdpa2023.affected = true;
        impact.dpdpa2023.issues.push(vuln.description);
      }

      // GST compliance impact
      if (['missing_input_validation', 'exposed_api_endpoints'].includes(vuln.type)) {
        impact.gst.affected = true;
        impact.gst.issues.push(vuln.description);
      }

      // MCA compliance impact
      if (['default_credentials', 'missing_session_timeout'].includes(vuln.type)) {
        impact.mca.affected = true;
        impact.mca.issues.push(vuln.description);
      }
    });

    return impact;
  }

  async generateSecurityReport(analysis) {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          overallRiskLevel: this.getRiskLevel(analysis.riskScore),
          totalIssues: analysis.totalVulnerabilities,
          criticalIssues: analysis.severityBreakdown.critical,
          complianceRisk: this.getComplianceRiskLevel(analysis.complianceImpact)
        },
        details: analysis,
        recommendations: analysis.topRecommendations,
        nextSteps: [
          'Address all critical vulnerabilities immediately',
          'Implement security testing in CI/CD pipeline', 
          'Regular security training for development team',
          'Establish incident response procedures'
        ]
      };

      logger.security('Security report generated', {
        riskLevel: report.summary.overallRiskLevel,
        totalIssues: report.summary.totalIssues
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate security report:', error);
      throw error;
    }
  }

  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }

  getComplianceRiskLevel(complianceImpact) {
    const affectedFrameworks = Object.values(complianceImpact).filter(f => f.affected).length;
    
    if (affectedFrameworks === 0) return 'LOW';
    if (affectedFrameworks === 1) return 'MEDIUM';
    return 'HIGH';
  }
}

module.exports = SessionFoundationService;