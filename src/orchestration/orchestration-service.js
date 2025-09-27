const cron = require('node-cron');
const logger = require('../utils/logger');
const CloudflareService = require('../cloudflare/cloudflare-service');
const SessionFoundationService = require('../session-foundation/session-service');
const ComplianceService = require('../compliance/compliance-service');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

class OrchestrationService {
  constructor() {
    this.cloudflare = new CloudflareService();
    this.sessionFoundation = new SessionFoundationService();
    this.compliance = new ComplianceService();
    
    this.config = null;
    this.scheduledTasks = [];
    this.isRunning = false;
    this.lastScanResults = null;
  }

  async initialize() {
    try {
      // Load configuration
      const configPath = path.join(process.cwd(), 'config', 'security-config.yaml');
      const configFile = fs.readFileSync(configPath, 'utf8');
      this.config = YAML.parse(configFile);

      // Initialize services
      await this.cloudflare.initialize();
      await this.sessionFoundation.initialize();
      await this.compliance.initialize();

      logger.info('Orchestration service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Orchestration service:', error);
      return false;
    }
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Orchestration service is already running');
      return;
    }

    try {
      this.isRunning = true;
      
      // Schedule security scans
      this.scheduleSecurityScans();
      
      // Schedule compliance checks
      this.scheduleComplianceChecks();
      
      // Enable Cloudflare security features
      await this.cloudflare.enableSecurityFeatures();

      logger.info('Orchestration service started successfully');
    } catch (error) {
      logger.error('Failed to start orchestration service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    try {
      // Stop all scheduled tasks
      this.scheduledTasks.forEach(task => {
        if (task.destroy) {
          task.destroy();
        }
      });
      this.scheduledTasks = [];

      this.isRunning = false;
      logger.info('Orchestration service stopped successfully');
    } catch (error) {
      logger.error('Error stopping orchestration service:', error);
      throw error;
    }
  }

  scheduleSecurityScans() {
    try {
      const scanConfig = this.config.cloudflare_config.scan_schedule;
      
      // Schedule daily security scan
      const scanTask = cron.schedule(`0 ${scanConfig.time.split(':')[1]} ${scanConfig.time.split(':')[0]} * * *`, 
        async () => {
          logger.info('Starting scheduled security scan');
          try {
            await this.runFullSecurityScan();
          } catch (error) {
            logger.error('Scheduled security scan failed:', error);
          }
        },
        {
          scheduled: false,
          timezone: scanConfig.timezone
        }
      );

      scanTask.start();
      this.scheduledTasks.push(scanTask);

      logger.info('Security scan scheduled', {
        frequency: scanConfig.frequency,
        time: scanConfig.time,
        timezone: scanConfig.timezone
      });
    } catch (error) {
      logger.error('Failed to schedule security scans:', error);
    }
  }

  scheduleComplianceChecks() {
    try {
      // Schedule weekly compliance check (every Monday at 1 AM)
      const complianceTask = cron.schedule('0 1 * * 1', 
        async () => {
          logger.compliance('Starting scheduled compliance check');
          try {
            await this.runFullComplianceCheck();
          } catch (error) {
            logger.error('Scheduled compliance check failed:', error);
          }
        },
        {
          scheduled: false,
          timezone: 'Asia/Kolkata'
        }
      );

      complianceTask.start();
      this.scheduledTasks.push(complianceTask);

      logger.compliance('Compliance checks scheduled for weekly execution');
    } catch (error) {
      logger.error('Failed to schedule compliance checks:', error);
    }
  }

  async runFullSecurityScan() {
    try {
      logger.security('Starting full security scan across ECG portfolio');
      
      const scanResults = {
        timestamp: new Date().toISOString(),
        repositories: [],
        summary: {
          totalRepositories: 0,
          totalVulnerabilities: 0,
          criticalVulnerabilities: 0,
          highVulnerabilities: 0,
          averageSecurityScore: 0
        },
        complianceImpact: null,
        recommendations: []
      };

      // Get repository targets from configuration
      const repositories = this.config.cloudflare_config.repository_targets;
      scanResults.summary.totalRepositories = repositories.length;

      // Scan each repository
      for (const repo of repositories) {
        try {
          logger.security(`Scanning repository: ${repo}`);
          
          const repoScanResult = await this.scanRepository(repo);
          scanResults.repositories.push(repoScanResult);
          
          // Update summary statistics
          scanResults.summary.totalVulnerabilities += repoScanResult.vulnerabilities.length;
          scanResults.summary.criticalVulnerabilities += repoScanResult.vulnerabilities.filter(v => v.severity === 'critical').length;
          scanResults.summary.highVulnerabilities += repoScanResult.vulnerabilities.filter(v => v.severity === 'high').length;
          
        } catch (error) {
          logger.error(`Failed to scan repository ${repo}:`, error);
          scanResults.repositories.push({
            repository: repo,
            error: error.message,
            vulnerabilities: [],
            securityScore: 0,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Calculate average security score
      const validScores = scanResults.repositories
        .filter(r => !r.error && r.securityScore !== undefined)
        .map(r => r.securityScore);
      
      scanResults.summary.averageSecurityScore = validScores.length > 0 
        ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
        : 0;

      // Analyze compliance impact
      const allVulnerabilities = scanResults.repositories
        .flatMap(r => r.vulnerabilities || []);
      
      if (allVulnerabilities.length > 0) {
        scanResults.complianceImpact = await this.sessionFoundation.analyzeSecurityPosture(allVulnerabilities);
      }

      // Generate portfolio-wide recommendations
      scanResults.recommendations = this.generatePortfolioRecommendations(scanResults);

      // Store results
      this.lastScanResults = scanResults;

      // Send alerts if critical issues found
      if (scanResults.summary.criticalVulnerabilities > 0) {
        await this.sendSecurityAlert(scanResults);
      }

      logger.security('Full security scan completed', {
        repositories: scanResults.summary.totalRepositories,
        vulnerabilities: scanResults.summary.totalVulnerabilities,
        averageScore: scanResults.summary.averageSecurityScore
      });

      return scanResults;
    } catch (error) {
      logger.error('Failed to run full security scan:', error);
      throw error;
    }
  }

  async scanRepository(repoUrl) {
    try {
      // Use Cloudflare service for initial vulnerability scan
      const cloudflareResults = await this.cloudflare.scanRepositoryForVulnerabilities(repoUrl);
      
      // Simulate getting repository code content for Session Foundation analysis
      const mockCodeContent = this.generateMockCodeContent(repoUrl);
      
      // Use Session Foundation for detailed vulnerability pattern analysis
      const sessionFoundationResults = await this.sessionFoundation.scanForVulnerabilities(
        mockCodeContent, 
        repoUrl
      );

      // Combine results
      const combinedVulnerabilities = [
        ...cloudflareResults.vulnerabilities,
        ...sessionFoundationResults
      ];

      // Calculate final security score
      const securityScore = this.cloudflare.calculateSecurityScore(combinedVulnerabilities);

      return {
        repository: repoUrl,
        timestamp: new Date().toISOString(),
        vulnerabilities: combinedVulnerabilities,
        securityScore: securityScore,
        scanSources: ['Cloudflare', 'Session Foundation'],
        recommendations: [
          ...cloudflareResults.recommendations,
          ...this.sessionFoundation.getTopRecommendations(sessionFoundationResults)
            .map(r => r.recommendation)
        ]
      };
    } catch (error) {
      logger.error(`Failed to scan repository ${repoUrl}:`, error);
      throw error;
    }
  }

  generateMockCodeContent(repoUrl) {
    // Generate mock code content based on repository type for demonstration
    const baseContent = `
// ECG Creator Repository: ${repoUrl}
const express = require('express');
const app = express();

// Configuration
const config = {
  database: {
    password: process.env.DB_PASSWORD || "default123",
    host: "localhost"
  },
  session: {
    secret: "session_secret_key"
  }
};

// Routes
app.get('/api/users', (req, res) => {
  const userId = req.params.id;
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  // Potential SQL injection vulnerability
});

app.post('/api/login', (req, res) => {
  // Login logic without proper validation
  const user = req.body.user;
  document.getElementById('welcome').innerHTML = user.name;
  // Potential XSS vulnerability
});

// Revenue sharing logic (85/15 split)
function calculateRevenueShare(totalRevenue) {
  const platformShare = totalRevenue * 0.15;
  const creatorShare = totalRevenue * 0.85;
  return { platformShare, creatorShare };
}

// Smart contract interaction
const contractCall = async (amount) => {
  // Potential reentrancy vulnerability
  await contract.call{value: amount}();
};

module.exports = app;
    `;

    return baseContent;
  }

  async runFullComplianceCheck() {
    try {
      logger.compliance('Starting full compliance check');
      
      const complianceResults = await this.compliance.runFullComplianceCheck();
      
      // Store results
      this.lastComplianceResults = complianceResults;

      // Send alerts for critical compliance issues
      if (complianceResults.overallCompliance.score < 60) {
        await this.sendComplianceAlert(complianceResults);
      }

      logger.compliance('Full compliance check completed', {
        overallScore: complianceResults.overallCompliance.score,
        status: complianceResults.overallCompliance.status
      });

      return complianceResults;
    } catch (error) {
      logger.error('Failed to run full compliance check:', error);
      throw error;
    }
  }

  generatePortfolioRecommendations(scanResults) {
    const recommendations = [];
    
    // High-level portfolio recommendations
    if (scanResults.summary.criticalVulnerabilities > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Security',
        recommendation: 'Immediately address all critical vulnerabilities across the portfolio',
        affectedRepositories: scanResults.summary.totalRepositories
      });
    }

    if (scanResults.summary.averageSecurityScore < 70) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Security Posture',
        recommendation: 'Implement comprehensive security training and secure coding practices',
        affectedRepositories: scanResults.repositories.filter(r => r.securityScore < 70).length
      });
    }

    // Repository-specific patterns
    const commonVulnerabilities = this.analyzeCommonVulnerabilities(scanResults.repositories);
    commonVulnerabilities.forEach(vuln => {
      if (vuln.count > 1) {
        recommendations.push({
          priority: vuln.severity === 'critical' ? 'CRITICAL' : vuln.severity === 'high' ? 'HIGH' : 'MEDIUM',
          category: 'Pattern Detection',
          recommendation: `Address common ${vuln.type} vulnerability across ${vuln.count} repositories`,
          affectedRepositories: vuln.count
        });
      }
    });

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  analyzeCommonVulnerabilities(repositories) {
    const vulnerabilityMap = {};
    
    repositories.forEach(repo => {
      if (repo.vulnerabilities) {
        repo.vulnerabilities.forEach(vuln => {
          const key = `${vuln.type}_${vuln.severity}`;
          if (!vulnerabilityMap[key]) {
            vulnerabilityMap[key] = {
              type: vuln.type,
              severity: vuln.severity,
              count: 0,
              description: vuln.description
            };
          }
          vulnerabilityMap[key].count++;
        });
      }
    });

    return Object.values(vulnerabilityMap).sort((a, b) => b.count - a.count);
  }

  async sendSecurityAlert(scanResults) {
    try {
      const alertData = {
        type: 'SECURITY_ALERT',
        timestamp: new Date().toISOString(),
        severity: 'CRITICAL',
        summary: {
          totalVulnerabilities: scanResults.summary.totalVulnerabilities,
          criticalVulnerabilities: scanResults.summary.criticalVulnerabilities,
          averageSecurityScore: scanResults.summary.averageSecurityScore
        },
        affectedRepositories: scanResults.repositories.length,
        topRecommendations: scanResults.recommendations.slice(0, 3)
      };

      logger.security('Security alert triggered', alertData);

      // In a real implementation, this would send alerts via webhook, email, or other channels
      if (process.env.ALERT_WEBHOOK_URL) {
        // Send webhook alert (implementation would go here)
        logger.info('Security alert sent via webhook');
      }

      return alertData;
    } catch (error) {
      logger.error('Failed to send security alert:', error);
    }
  }

  async sendComplianceAlert(complianceResults) {
    try {
      const alertData = {
        type: 'COMPLIANCE_ALERT',
        timestamp: new Date().toISOString(),
        severity: complianceResults.overallCompliance.score < 40 ? 'CRITICAL' : 'HIGH',
        overallScore: complianceResults.overallCompliance.score,
        status: complianceResults.overallCompliance.status,
        frameworks: Object.keys(complianceResults.frameworkResults).length,
        criticalActionItems: complianceResults.actionItems.filter(item => item.priority === 'CRITICAL').length
      };

      logger.compliance('Compliance alert triggered', alertData);

      // In a real implementation, this would send alerts via webhook, email, or other channels
      if (process.env.ALERT_WEBHOOK_URL) {
        // Send webhook alert (implementation would go here)
        logger.info('Compliance alert sent via webhook');
      }

      return alertData;
    } catch (error) {
      logger.error('Failed to send compliance alert:', error);
    }
  }

  async getLastScanResults() {
    return this.lastScanResults;
  }

  async getLastComplianceResults() {
    return this.lastComplianceResults;
  }

  async getSystemStatus() {
    return {
      timestamp: new Date().toISOString(),
      isRunning: this.isRunning,
      scheduledTasks: this.scheduledTasks.length,
      lastScan: this.lastScanResults?.timestamp,
      lastCompliance: this.lastComplianceResults?.timestamp,
      services: {
        cloudflare: 'ACTIVE',
        sessionFoundation: 'ACTIVE',
        compliance: 'ACTIVE'
      }
    };
  }
}

module.exports = OrchestrationService;