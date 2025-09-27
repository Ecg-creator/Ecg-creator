#!/usr/bin/env node

/**
 * ECG Security Scanner
 * Command-line interface for running security scans
 */

require('dotenv').config();
const ECGSecurityFramework = require('./index');
const logger = require('./utils/logger');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const framework = new ECGSecurityFramework();
  
  try {
    // Initialize services
    await framework.initialize();
    
    switch (command) {
      case 'full':
        console.log('🔍 Running full security scan...');
        const scanResults = await framework.runSecurityScan();
        console.log('✅ Security scan completed');
        console.log(`📊 Summary: ${scanResults.summary?.totalVulnerabilities || 0} vulnerabilities found`);
        console.log(`🎯 Average security score: ${scanResults.summary?.averageSecurityScore || 0}/100`);
        break;
        
      case 'compliance':
        console.log('📋 Running compliance check...');
        const complianceResults = await framework.runComplianceCheck();
        console.log('✅ Compliance check completed');
        console.log(`📊 Overall compliance score: ${complianceResults.overallCompliance?.score || 0}%`);
        console.log(`📈 Status: ${complianceResults.overallCompliance?.status || 'UNKNOWN'}`);
        break;
        
      case 'revenue':
        console.log('💰 Running revenue protection check...');
        const revenueCheck = await framework.revenueProtection.runRevenueProtectionCheck();
        console.log('✅ Revenue protection check completed');
        console.log(`📊 Status: ${revenueCheck.overallStatus}`);
        console.log(`⚠️  Risks identified: ${revenueCheck.risks.length}`);
        break;
        
      case 'quick':
        console.log('⚡ Running quick security assessment...');
        // Run a subset of checks for quick feedback
        const quickResults = await runQuickAssessment(framework);
        console.log('✅ Quick assessment completed');
        console.log(`📊 Security posture: ${quickResults.securityPosture}`);
        console.log(`📋 Compliance status: ${quickResults.complianceStatus}`);
        break;
        
      default:
        console.log('ECG Security Scanner');
        console.log('Usage: node src/scanner.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  full       - Run full security scan across all repositories');
        console.log('  compliance - Run comprehensive compliance check');
        console.log('  revenue    - Run revenue protection validation');
        console.log('  quick      - Run quick security and compliance assessment');
        console.log('');
        console.log('Examples:');
        console.log('  node src/scanner.js full');
        console.log('  node src/scanner.js compliance');
        console.log('  node src/scanner.js revenue');
        process.exit(0);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Scanner execution failed:', error);
    console.error('❌ Scanner failed:', error.message);
    process.exit(1);
  }
}

async function runQuickAssessment(framework) {
  try {
    // Quick security check on first repository
    const repos = ['Ecg-creator/vercel']; // Just check one repo for speed
    const quickScanResults = await framework.orchestration.scanRepository(repos[0]);
    
    // Quick compliance check
    const complianceResults = await framework.compliance.runFullComplianceCheck();
    
    // Determine overall posture
    const securityScore = quickScanResults.securityScore || 0;
    const complianceScore = complianceResults.overallCompliance?.score || 0;
    
    let securityPosture = 'UNKNOWN';
    if (securityScore >= 80) securityPosture = 'GOOD';
    else if (securityScore >= 60) securityPosture = 'FAIR';
    else securityPosture = 'POOR';
    
    let complianceStatus = 'UNKNOWN';
    if (complianceScore >= 80) complianceStatus = 'COMPLIANT';
    else if (complianceScore >= 60) complianceStatus = 'PARTIAL';
    else complianceStatus = 'NON_COMPLIANT';
    
    return {
      securityPosture,
      complianceStatus,
      securityScore,
      complianceScore,
      vulnerabilitiesFound: quickScanResults.vulnerabilities?.length || 0,
      complianceFrameworks: Object.keys(complianceResults.frameworkResults || {}).length
    };
  } catch (error) {
    logger.error('Quick assessment failed:', error);
    return {
      securityPosture: 'ERROR',
      complianceStatus: 'ERROR',
      error: error.message
    };
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, runQuickAssessment };