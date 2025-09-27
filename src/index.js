#!/usr/bin/env node

/**
 * ECG Security Framework
 * Cloudflare Security API integration with Session Foundation vulnerability database
 * 
 * @author Faiz Ahmed <faiz.ahmed@ecg-creator.com>
 * @license GPL-3.0
 */

require('dotenv').config();
const logger = require('./utils/logger');
const CloudflareService = require('./cloudflare/cloudflare-service');
const SessionFoundationService = require('./session-foundation/session-service');
const ComplianceService = require('./compliance/compliance-service');
const DashboardService = require('./dashboard/dashboard-service');
const OrchestrationService = require('./orchestration/orchestration-service');
const RevenueProtectionService = require('./revenue-protection/revenue-service');

class ECGSecurityFramework {
  constructor() {
    this.cloudflare = new CloudflareService();
    this.sessionFoundation = new SessionFoundationService();
    this.compliance = new ComplianceService();
    this.dashboard = new DashboardService();
    this.orchestration = new OrchestrationService();
    this.revenueProtection = new RevenueProtectionService();
    
    this.isRunning = false;
  }

  async initialize() {
    try {
      logger.info('Initializing ECG Security Framework...');
      
      // Initialize all services
      await this.cloudflare.initialize();
      await this.sessionFoundation.initialize();
      await this.compliance.initialize();
      await this.dashboard.initialize();
      await this.orchestration.initialize();
      await this.revenueProtection.initialize();
      
      logger.info('ECG Security Framework initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize ECG Security Framework:', error);
      return false;
    }
  }

  async start() {
    if (this.isRunning) {
      logger.warn('ECG Security Framework is already running');
      return;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      logger.error('Failed to start ECG Security Framework due to initialization errors');
      process.exit(1);
    }

    this.isRunning = true;
    logger.info('ECG Security Framework started successfully');

    // Wire up services
    this.dashboard.setOrchestrationService(this.orchestration);

    // Start the orchestration service which manages all scanning and monitoring
    await this.orchestration.start();
    
    // Start the dashboard service
    await this.dashboard.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async shutdown() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Shutting down ECG Security Framework...');
    this.isRunning = false;

    try {
      await this.orchestration.stop();
      await this.dashboard.stop();
      logger.info('ECG Security Framework shut down successfully');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }

    process.exit(0);
  }

  async runSecurityScan() {
    logger.info('Running manual security scan...');
    try {
      const results = await this.orchestration.runFullSecurityScan();
      logger.info('Security scan completed:', results);
      return results;
    } catch (error) {
      logger.error('Security scan failed:', error);
      throw error;
    }
  }

  async runComplianceCheck() {
    logger.info('Running compliance check...');
    try {
      const results = await this.compliance.runFullComplianceCheck();
      logger.info('Compliance check completed:', results);
      return results;
    } catch (error) {
      logger.error('Compliance check failed:', error);
      throw error;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const framework = new ECGSecurityFramework();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      framework.start();
      break;
    case 'scan':
      framework.runSecurityScan().then(() => process.exit(0)).catch(() => process.exit(1));
      break;
    case 'compliance':
      framework.runComplianceCheck().then(() => process.exit(0)).catch(() => process.exit(1));
      break;
    default:
      console.log('Usage: node src/index.js [start|scan|compliance]');
      console.log('  start      - Start the full security framework');
      console.log('  scan       - Run a one-time security scan');
      console.log('  compliance - Run a one-time compliance check');
      process.exit(1);
  }
}

module.exports = ECGSecurityFramework;