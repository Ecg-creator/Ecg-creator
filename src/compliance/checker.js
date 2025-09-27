#!/usr/bin/env node

/**
 * ECG Compliance Checker
 * Dedicated command-line interface for compliance checks
 */

require('dotenv').config();
const ComplianceService = require('./compliance-service');
const logger = require('../utils/logger');

async function main() {
  const args = process.argv.slice(2);
  const framework = args[0];
  
  const complianceService = new ComplianceService();
  
  try {
    console.log('🔧 Initializing compliance service...');
    await complianceService.initialize();
    
    switch (framework) {
      case 'dpdpa':
        console.log('🔒 Checking DPDPA 2023 compliance...');
        await checkDPDPACompliance(complianceService);
        break;
        
      case 'gst':
        console.log('💳 Checking GST compliance...');
        await checkGSTCompliance(complianceService);
        break;
        
      case 'mca':
        console.log('🏢 Checking MCA compliance...');
        await checkMCACompliance(complianceService);
        break;
        
      case 'all':
      default:
        console.log('📋 Running full compliance check...');
        const results = await complianceService.runFullComplianceCheck();
        displayFullResults(results);
        break;
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Compliance checker failed:', error);
    console.error('❌ Compliance check failed:', error.message);
    process.exit(1);
  }
}

async function checkDPDPACompliance(service) {
  try {
    const checks = [
      { id: 'dpdpa_consent_management', name: 'Data Processing Consent', checker: service.checkDataProcessingConsent.bind(service) },
      { id: 'dpdpa_breach_notification', name: 'Data Breach Notification', checker: service.checkDataBreachNotification.bind(service) },
      { id: 'dpdpa_privacy_policy', name: 'Privacy Policy Compliance', checker: service.checkPrivacyPolicyCompliance.bind(service) },
      { id: 'dpdpa_user_rights', name: 'User Rights Management', checker: service.checkUserRightsManagement.bind(service) }
    ];
    
    console.log('\n📊 DPDPA 2023 Compliance Results:');
    console.log('================================');
    
    let totalScore = 0;
    for (const check of checks) {
      const result = await check.checker();
      totalScore += result.score;
      
      const status = getStatusIcon(result.status);
      console.log(`${status} ${check.name}: ${result.score}% (${result.status})`);
      console.log(`   ${result.message}`);
      
      if (result.status !== 'COMPLIANT') {
        console.log(`   💡 Recommendation: ${service.getCheckRecommendation(check.id)}`);
      }
      console.log('');
    }
    
    const averageScore = totalScore / checks.length;
    console.log(`📈 Overall DPDPA 2023 Score: ${Math.round(averageScore)}%`);
    console.log(`📋 Status: ${service.getComplianceStatus(averageScore)}\n`);
    
  } catch (error) {
    throw error;
  }
}

async function checkGSTCompliance(service) {
  try {
    const checks = [
      { id: 'gst_tax_calculation', name: 'Transaction Tax Calculation', checker: service.checkTransactionTaxCalculation.bind(service) },
      { id: 'gst_invoice_generation', name: 'Invoice Generation', checker: service.checkInvoiceGeneration.bind(service) },
      { id: 'gst_return_filing', name: 'Return Filing Automation', checker: service.checkReturnFilingAutomation.bind(service) },
      { id: 'gst_platform_income', name: 'Platform Governance Income', checker: service.checkPlatformGovernanceIncome.bind(service) }
    ];
    
    console.log('\n📊 GST Compliance Results:');
    console.log('==========================');
    
    let totalScore = 0;
    for (const check of checks) {
      const result = await check.checker();
      totalScore += result.score;
      
      const status = getStatusIcon(result.status);
      console.log(`${status} ${check.name}: ${result.score}% (${result.status})`);
      console.log(`   ${result.message}`);
      
      if (result.status !== 'COMPLIANT') {
        console.log(`   💡 Recommendation: ${service.getCheckRecommendation(check.id)}`);
      }
      console.log('');
    }
    
    const averageScore = totalScore / checks.length;
    console.log(`📈 Overall GST Score: ${Math.round(averageScore)}%`);
    console.log(`📋 Status: ${service.getComplianceStatus(averageScore)}\n`);
    
  } catch (error) {
    throw error;
  }
}

async function checkMCACompliance(service) {
  try {
    const checks = [
      { id: 'mca_registration_status', name: 'Company Registration Status', checker: service.checkCompanyRegistrationStatus.bind(service) },
      { id: 'mca_annual_filing', name: 'Annual Filing Compliance', checker: service.checkAnnualFilingCompliance.bind(service) },
      { id: 'mca_board_resolution', name: 'Board Resolution Tracking', checker: service.checkBoardResolutionTracking.bind(service) }
    ];
    
    console.log('\n📊 MCA Compliance Results:');
    console.log('==========================');
    
    let totalScore = 0;
    for (const check of checks) {
      const result = await check.checker();
      totalScore += result.score;
      
      const status = getStatusIcon(result.status);
      console.log(`${status} ${check.name}: ${result.score}% (${result.status})`);
      console.log(`   ${result.message}`);
      
      if (result.status !== 'COMPLIANT') {
        console.log(`   💡 Recommendation: ${service.getCheckRecommendation(check.id)}`);
      }
      console.log('');
    }
    
    const averageScore = totalScore / checks.length;
    console.log(`📈 Overall MCA Score: ${Math.round(averageScore)}%`);
    console.log(`📋 Status: ${service.getComplianceStatus(averageScore)}\n`);
    
  } catch (error) {
    throw error;
  }
}

function displayFullResults(results) {
  console.log('\n📊 Full Compliance Report:');
  console.log('==========================');
  
  // Overall summary
  console.log(`📈 Overall Compliance Score: ${results.overallCompliance.score}%`);
  console.log(`📋 Status: ${results.overallCompliance.status}`);
  console.log(`🏛️  Frameworks Checked: ${results.overallCompliance.frameworkCount}`);
  console.log('');
  
  // Framework breakdown
  Object.values(results.frameworkResults).forEach(framework => {
    const statusIcon = getStatusIcon(framework.status);
    console.log(`${statusIcon} ${framework.framework}: ${Math.round(framework.overallScore)}%`);
    
    framework.checks.forEach(check => {
      const checkIcon = getStatusIcon(check.result.status);
      console.log(`   ${checkIcon} ${check.name}: ${check.result.score}%`);
    });
    console.log('');
  });
  
  // Top recommendations
  if (results.recommendations && results.recommendations.length > 0) {
    console.log('🎯 Top Recommendations:');
    console.log('========================');
    results.recommendations.slice(0, 5).forEach((rec, index) => {
      const priorityIcon = rec.priority === 'HIGH' ? '🔴' : '🟡';
      console.log(`${index + 1}. ${priorityIcon} ${rec.recommendation}`);
      console.log(`   Framework: ${rec.framework} | Score: ${rec.currentScore}%`);
    });
    console.log('');
  }
  
  // Action items
  if (results.actionItems && results.actionItems.length > 0) {
    console.log('📋 Critical Action Items:');
    console.log('=========================');
    results.actionItems
      .filter(item => item.priority === 'CRITICAL' || item.priority === 'HIGH')
      .slice(0, 3)
      .forEach((item, index) => {
        const priorityIcon = item.priority === 'CRITICAL' ? '🔴' : '🟠';
        console.log(`${index + 1}. ${priorityIcon} ${item.title}`);
        console.log(`   Due: ${item.dueDate} | Assignee: ${item.assignee}`);
      });
    console.log('');
  }
}

function getStatusIcon(status) {
  const icons = {
    'COMPLIANT': '✅',
    'FULLY_COMPLIANT': '✅',
    'MOSTLY_COMPLIANT': '✅',
    'PARTIAL': '⚠️',
    'PARTIALLY_COMPLIANT': '⚠️',
    'NON_COMPLIANT': '❌',
    'NEEDS_IMPROVEMENT': '⚠️',
    'ERROR': '💥',
    'UNKNOWN': '❓'
  };
  
  return icons[status] || '❓';
}

if (require.main === module) {
  if (process.argv.length < 2) {
    console.log('ECG Compliance Checker');
    console.log('Usage: node src/compliance/checker.js [framework]');
    console.log('');
    console.log('Frameworks:');
    console.log('  dpdpa - DPDPA 2023 compliance check');
    console.log('  gst   - GST compliance check');
    console.log('  mca   - MCA compliance check');
    console.log('  all   - All compliance frameworks (default)');
    console.log('');
    console.log('Examples:');
    console.log('  node src/compliance/checker.js dpdpa');
    console.log('  node src/compliance/checker.js all');
    process.exit(0);
  }
  
  main();
}

module.exports = { main };