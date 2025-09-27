const axios = require('axios');
const logger = require('../utils/logger');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

class ComplianceService {
  constructor() {
    this.dpdpaEndpoint = process.env.DPDPA_COMPLIANCE_ENDPOINT;
    this.gstEndpoint = process.env.GST_COMPLIANCE_ENDPOINT;
    this.mcaEndpoint = process.env.MCA_COMPLIANCE_ENDPOINT;
    
    this.config = null;
    this.complianceFrameworks = [];
  }

  async initialize() {
    try {
      // Load configuration
      const configPath = path.join(process.cwd(), 'config', 'security-config.yaml');
      const configFile = fs.readFileSync(configPath, 'utf8');
      this.config = YAML.parse(configFile);

      // Initialize compliance frameworks
      this.initializeComplianceFrameworks();

      logger.compliance('Compliance service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Compliance service:', error);
      return false;
    }
  }

  initializeComplianceFrameworks() {
    this.complianceFrameworks = [
      {
        name: 'DPDPA 2023',
        enabled: this.config.compliance_frameworks.dpdpa_2023.enabled,
        checks: [
          {
            id: 'dpdpa_consent_management',
            name: 'Data Processing Consent',
            description: 'Verify proper consent mechanisms for data processing',
            weight: 25,
            checker: this.checkDataProcessingConsent.bind(this)
          },
          {
            id: 'dpdpa_breach_notification',
            name: 'Data Breach Notification',
            description: 'Ensure data breach notification procedures are in place',
            weight: 30,
            checker: this.checkDataBreachNotification.bind(this)
          },
          {
            id: 'dpdpa_privacy_policy',
            name: 'Privacy Policy Compliance',
            description: 'Validate privacy policy completeness and accessibility',
            weight: 20,
            checker: this.checkPrivacyPolicyCompliance.bind(this)
          },
          {
            id: 'dpdpa_user_rights',
            name: 'User Rights Management',
            description: 'Verify implementation of user data rights (access, rectification, erasure)',
            weight: 25,
            checker: this.checkUserRightsManagement.bind(this)
          }
        ]
      },
      {
        name: 'GST Compliance',
        enabled: this.config.compliance_frameworks.gst_compliance.enabled,
        checks: [
          {
            id: 'gst_tax_calculation',
            name: 'Transaction Tax Calculation',
            description: 'Verify accurate GST calculation on transactions',
            weight: 30,
            checker: this.checkTransactionTaxCalculation.bind(this)
          },
          {
            id: 'gst_invoice_generation',
            name: 'Invoice Generation',
            description: 'Ensure proper invoice generation with GST details',
            weight: 25,
            checker: this.checkInvoiceGeneration.bind(this)
          },
          {
            id: 'gst_return_filing',
            name: 'Return Filing Automation',
            description: 'Validate automated GST return filing mechanisms',
            weight: 20,
            checker: this.checkReturnFilingAutomation.bind(this)
          },
          {
            id: 'gst_platform_income',
            name: 'Platform Governance Income',
            description: 'Verify GST compliance for platform governance income (85/15 split)',
            weight: 25,
            checker: this.checkPlatformGovernanceIncome.bind(this)
          }
        ]
      },
      {
        name: 'MCA Compliance',
        enabled: this.config.compliance_frameworks.mca_compliance.enabled,
        checks: [
          {
            id: 'mca_registration_status',
            name: 'Company Registration Status',
            description: 'Verify company registration status with MCA',
            weight: 35,
            checker: this.checkCompanyRegistrationStatus.bind(this)
          },
          {
            id: 'mca_annual_filing',
            name: 'Annual Filing Compliance',
            description: 'Ensure timely annual filing with MCA',
            weight: 35,
            checker: this.checkAnnualFilingCompliance.bind(this)
          },
          {
            id: 'mca_board_resolution',
            name: 'Board Resolution Tracking',
            description: 'Track board resolutions and compliance requirements',
            weight: 30,
            checker: this.checkBoardResolutionTracking.bind(this)
          }
        ]
      }
    ];

    logger.compliance('Compliance frameworks initialized', {
      frameworks: this.complianceFrameworks.map(f => ({ name: f.name, enabled: f.enabled }))
    });
  }

  async runFullComplianceCheck() {
    try {
      logger.compliance('Starting full compliance check');
      const results = {};

      for (const framework of this.complianceFrameworks) {
        if (framework.enabled) {
          results[framework.name] = await this.runFrameworkCompliance(framework);
        }
      }

      const overallCompliance = this.calculateOverallCompliance(results);
      
      logger.compliance('Full compliance check completed', {
        overallScore: overallCompliance.score,
        frameworks: Object.keys(results).length
      });

      return {
        timestamp: new Date().toISOString(),
        overallCompliance,
        frameworkResults: results,
        recommendations: this.generateComplianceRecommendations(results),
        actionItems: this.generateActionItems(results)
      };
    } catch (error) {
      logger.error('Failed to run full compliance check:', error);
      throw error;
    }
  }

  async runFrameworkCompliance(framework) {
    try {
      logger.compliance(`Running compliance checks for ${framework.name}`);
      const results = {
        framework: framework.name,
        timestamp: new Date().toISOString(),
        checks: [],
        overallScore: 0,
        status: 'UNKNOWN'
      };

      let totalWeight = 0;
      let weightedScore = 0;

      for (const check of framework.checks) {
        try {
          const checkResult = await check.checker();
          
          results.checks.push({
            id: check.id,
            name: check.name,
            description: check.description,
            weight: check.weight,
            result: checkResult,
            timestamp: new Date().toISOString()
          });

          totalWeight += check.weight;
          weightedScore += (checkResult.score * check.weight) / 100;

        } catch (error) {
          logger.error(`Failed to run check ${check.id}:`, error);
          results.checks.push({
            id: check.id,
            name: check.name,
            description: check.description,
            weight: check.weight,
            result: { score: 0, status: 'ERROR', message: error.message },
            timestamp: new Date().toISOString()
          });
        }
      }

      results.overallScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
      results.status = this.getComplianceStatus(results.overallScore);

      logger.compliance(`${framework.name} compliance check completed`, {
        score: results.overallScore,
        status: results.status
      });

      return results;
    } catch (error) {
      logger.error(`Failed to run framework compliance for ${framework.name}:`, error);
      throw error;
    }
  }

  // DPDPA 2023 Compliance Checks
  async checkDataProcessingConsent() {
    try {
      // Simulate checking for consent management implementation
      const consentFeatures = {
        consentBanner: true,
        granularConsent: true,
        withdrawalMechanism: true,
        consentRecords: true
      };

      const implementedFeatures = Object.values(consentFeatures).filter(Boolean).length;
      const score = (implementedFeatures / Object.keys(consentFeatures).length) * 100;

      return {
        score,
        status: score >= 80 ? 'COMPLIANT' : score >= 60 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: consentFeatures,
        message: `${implementedFeatures}/${Object.keys(consentFeatures).length} consent features implemented`
      };
    } catch (error) {
      throw error;
    }
  }

  async checkDataBreachNotification() {
    try {
      // Simulate checking breach notification procedures
      const breachProcedures = {
        detectionMechanism: true,
        notificationProcedure: true,
        regulatoryReporting: false,
        userNotification: true
      };

      const implementedProcedures = Object.values(breachProcedures).filter(Boolean).length;
      const score = (implementedProcedures / Object.keys(breachProcedures).length) * 100;

      return {
        score,
        status: score >= 80 ? 'COMPLIANT' : score >= 60 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: breachProcedures,
        message: `${implementedProcedures}/${Object.keys(breachProcedures).length} breach procedures implemented`
      };
    } catch (error) {
      throw error;
    }
  }

  async checkPrivacyPolicyCompliance() {
    try {
      // Simulate privacy policy compliance check
      const policyRequirements = {
        dataCollectionPurpose: true,
        dataRetentionPeriod: true,
        thirdPartySharing: true,
        userRights: true,
        contactInformation: true
      };

      const metRequirements = Object.values(policyRequirements).filter(Boolean).length;
      const score = (metRequirements / Object.keys(policyRequirements).length) * 100;

      return {
        score,
        status: score >= 90 ? 'COMPLIANT' : score >= 70 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: policyRequirements,
        message: `${metRequirements}/${Object.keys(policyRequirements).length} policy requirements met`
      };
    } catch (error) {
      throw error;
    }
  }

  async checkUserRightsManagement() {
    try {
      // Simulate user rights implementation check
      const userRights = {
        rightToAccess: true,
        rightToRectification: true,
        rightToErasure: false,
        rightToPortability: false,
        rightToRestriction: true
      };

      const implementedRights = Object.values(userRights).filter(Boolean).length;
      const score = (implementedRights / Object.keys(userRights).length) * 100;

      return {
        score,
        status: score >= 80 ? 'COMPLIANT' : score >= 60 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: userRights,
        message: `${implementedRights}/${Object.keys(userRights).length} user rights implemented`
      };
    } catch (error) {
      throw error;
    }
  }

  // GST Compliance Checks
  async checkTransactionTaxCalculation() {
    try {
      // Simulate GST calculation accuracy check
      const gstCalculation = {
        cgst: true,
        sgst: true,
        igst: true,
        rateAccuracy: true,
        exemptionHandling: false
      };

      const correctImplementations = Object.values(gstCalculation).filter(Boolean).length;
      const score = (correctImplementations / Object.keys(gstCalculation).length) * 100;

      return {
        score,
        status: score >= 90 ? 'COMPLIANT' : score >= 70 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: gstCalculation,
        message: `${correctImplementations}/${Object.keys(gstCalculation).length} GST calculation features correct`
      };
    } catch (error) {
      throw error;
    }
  }

  async checkInvoiceGeneration() {
    try {
      // Simulate invoice generation compliance
      const invoiceFeatures = {
        gstinDisplay: true,
        hsnSacCode: true,
        taxBreakdown: true,
        digitalSignature: false
      };

      const implementedFeatures = Object.values(invoiceFeatures).filter(Boolean).length;
      const score = (implementedFeatures / Object.keys(invoiceFeatures).length) * 100;

      return {
        score,
        status: score >= 85 ? 'COMPLIANT' : score >= 65 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: invoiceFeatures,
        message: `${implementedFeatures}/${Object.keys(invoiceFeatures).length} invoice features implemented`
      };
    } catch (error) {
      throw error;
    }
  }

  async checkReturnFilingAutomation() {
    try {
      // Simulate return filing automation check
      const filingFeatures = {
        gstr1Automation: true,
        gstr3bAutomation: false,
        reconciliation: true,
        errorHandling: true
      };

      const implementedFeatures = Object.values(filingFeatures).filter(Boolean).length;
      const score = (implementedFeatures / Object.keys(filingFeatures).length) * 100;

      return {
        score,
        status: score >= 80 ? 'COMPLIANT' : score >= 60 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: filingFeatures,
        message: `${implementedFeatures}/${Object.keys(filingFeatures).length} filing automation features implemented`
      };
    } catch (error) {
      throw error;
    }
  }

  async checkPlatformGovernanceIncome() {
    try {
      // Simulate platform governance income GST compliance (85/15 revenue split)
      const revenueCompliance = {
        revenueSplitTracking: true,
        gstOnPlatformFee: true,
        separateAccounting: true,
        complianceReporting: false
      };

      const implementedFeatures = Object.values(revenueCompliance).filter(Boolean).length;
      const score = (implementedFeatures / Object.keys(revenueCompliance).length) * 100;

      return {
        score,
        status: score >= 85 ? 'COMPLIANT' : score >= 65 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: revenueCompliance,
        message: `${implementedFeatures}/${Object.keys(revenueCompliance).length} revenue compliance features implemented`
      };
    } catch (error) {
      throw error;
    }
  }

  // MCA Compliance Checks
  async checkCompanyRegistrationStatus() {
    try {
      // Simulate company registration status check
      const registrationStatus = {
        activeStatus: true,
        annualComplianceStatus: true,
        directorCompliance: true,
        registeredOfficeCompliance: true
      };

      const compliantAspects = Object.values(registrationStatus).filter(Boolean).length;
      const score = (compliantAspects / Object.keys(registrationStatus).length) * 100;

      return {
        score,
        status: score === 100 ? 'COMPLIANT' : score >= 75 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: registrationStatus,
        message: `${compliantAspects}/${Object.keys(registrationStatus).length} registration aspects compliant`
      };
    } catch (error) {
      throw error;
    }
  }

  async checkAnnualFilingCompliance() {
    try {
      // Simulate annual filing compliance check
      const filingCompliance = {
        form20BFiled: true,
        form23ACFiled: false,
        boardMeetingCompliance: true,
        auditCompliance: true
      };

      const compliantFilings = Object.values(filingCompliance).filter(Boolean).length;
      const score = (compliantFilings / Object.keys(filingCompliance).length) * 100;

      return {
        score,
        status: score >= 90 ? 'COMPLIANT' : score >= 70 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: filingCompliance,
        message: `${compliantFilings}/${Object.keys(filingCompliance).length} annual filing requirements met`
      };
    } catch (error) {
      throw error;
    }
  }

  async checkBoardResolutionTracking() {
    try {
      // Simulate board resolution tracking
      const resolutionTracking = {
        resolutionRecords: true,
        complianceTracking: true,
        reminderSystem: false,
        digitalArchiving: true
      };

      const implementedFeatures = Object.values(resolutionTracking).filter(Boolean).length;
      const score = (implementedFeatures / Object.keys(resolutionTracking).length) * 100;

      return {
        score,
        status: score >= 80 ? 'COMPLIANT' : score >= 60 ? 'PARTIAL' : 'NON_COMPLIANT',
        details: resolutionTracking,
        message: `${implementedFeatures}/${Object.keys(resolutionTracking).length} resolution tracking features implemented`
      };
    } catch (error) {
      throw error;
    }
  }

  calculateOverallCompliance(results) {
    const frameworks = Object.values(results);
    if (frameworks.length === 0) {
      return { score: 0, status: 'UNKNOWN' };
    }

    const totalScore = frameworks.reduce((sum, framework) => sum + framework.overallScore, 0);
    const averageScore = totalScore / frameworks.length;

    return {
      score: Math.round(averageScore),
      status: this.getComplianceStatus(averageScore),
      frameworkCount: frameworks.length
    };
  }

  getComplianceStatus(score) {
    if (score >= 90) return 'FULLY_COMPLIANT';
    if (score >= 75) return 'MOSTLY_COMPLIANT';
    if (score >= 60) return 'PARTIALLY_COMPLIANT';
    if (score >= 40) return 'NEEDS_IMPROVEMENT';
    return 'NON_COMPLIANT';
  }

  generateComplianceRecommendations(results) {
    const recommendations = [];

    Object.values(results).forEach(framework => {
      framework.checks.forEach(check => {
        if (check.result.score < 80) {
          recommendations.push({
            framework: framework.framework,
            check: check.name,
            priority: check.result.score < 50 ? 'HIGH' : 'MEDIUM',
            recommendation: this.getCheckRecommendation(check.id),
            currentScore: check.result.score
          });
        }
      });
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  getCheckRecommendation(checkId) {
    const recommendations = {
      'dpdpa_consent_management': 'Implement comprehensive consent management with granular controls',
      'dpdpa_breach_notification': 'Establish formal data breach notification procedures',
      'dpdpa_privacy_policy': 'Update privacy policy to meet DPDPA 2023 requirements',
      'dpdpa_user_rights': 'Implement all user data rights including erasure and portability',
      'gst_tax_calculation': 'Implement accurate GST calculation for all transaction types',
      'gst_invoice_generation': 'Ensure invoices meet GST compliance requirements',
      'gst_return_filing': 'Automate GST return filing processes',
      'gst_platform_income': 'Implement proper GST handling for platform revenue share',
      'mca_registration_status': 'Ensure company registration status is current and compliant',
      'mca_annual_filing': 'Complete all pending annual filing requirements',
      'mca_board_resolution': 'Implement comprehensive board resolution tracking system'
    };

    return recommendations[checkId] || 'Review and improve compliance for this requirement';
  }

  generateActionItems(results) {
    const actionItems = [];
    const now = new Date();

    Object.values(results).forEach(framework => {
      framework.checks.forEach(check => {
        if (check.result.score < 60) {
          const dueDate = new Date(now);
          dueDate.setDate(now.getDate() + (check.result.score < 40 ? 7 : 30)); // Critical: 7 days, Others: 30 days

          actionItems.push({
            id: `action_${framework.framework.replace(/\s+/g, '_').toLowerCase()}_${check.id}`,
            title: `Improve ${check.name}`,
            description: check.description,
            framework: framework.framework,
            priority: check.result.score < 40 ? 'CRITICAL' : check.result.score < 60 ? 'HIGH' : 'MEDIUM',
            currentScore: check.result.score,
            targetScore: 90,
            dueDate: dueDate.toISOString().split('T')[0],
            assignee: 'Compliance Team',
            status: 'PENDING'
          });
        }
      });
    });

    return actionItems.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

module.exports = ComplianceService;