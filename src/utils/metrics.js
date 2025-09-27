/**
 * Genesis Stack Prometheus Metrics
 * Revenue Optimization & Performance Monitoring
 */

const prometheus = require('prom-client');

function createPrometheusMetrics() {
    // Create a Registry to register the metrics
    const register = new prometheus.Registry();
    
    // Add default metrics
    prometheus.collectDefaultMetrics({ register });
    
    // Revenue metrics
    const revenueGauge = new prometheus.Gauge({
        name: 'genesis_revenue_target_inr',
        help: 'Genesis Stack annual revenue target in INR',
        labelNames: ['component', 'stream']
    });
    
    const revenueCounter = new prometheus.Counter({
        name: 'genesis_revenue_earned_inr_total',
        help: 'Total revenue earned by Genesis Stack in INR',
        labelNames: ['component', 'stream', 'tier']
    });
    
    // Membership metrics
    const membershipGauge = new prometheus.Gauge({
        name: 'genesis_membership_count',
        help: 'Total number of active members',
        labelNames: ['tier', 'status']
    });
    
    const sbtIssuanceCounter = new prometheus.Counter({
        name: 'genesis_sbt_issuance_total',
        help: 'Total SBT tokens issued',
        labelNames: ['tier']
    });
    
    // Compliance metrics
    const complianceGauge = new prometheus.Gauge({
        name: 'genesis_compliance_percentage',
        help: 'Compliance score percentage',
        labelNames: ['framework', 'article']
    });
    
    const auditCounter = new prometheus.Counter({
        name: 'genesis_audit_events_total',
        help: 'Total audit events recorded',
        labelNames: ['event_type', 'risk_level']
    });
    
    // Performance metrics
    const responseTimeHistogram = new prometheus.Histogram({
        name: 'genesis_response_time_seconds',
        help: 'Response time in seconds',
        labelNames: ['service', 'method', 'status'],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });
    
    const activeConnectionsGauge = new prometheus.Gauge({
        name: 'genesis_active_connections',
        help: 'Number of active connections',
        labelNames: ['service']
    });
    
    // Blockchain metrics
    const multiSigTransactionCounter = new prometheus.Counter({
        name: 'genesis_multisig_transactions_total',
        help: 'Total multi-sig transactions',
        labelNames: ['status', 'safe_address']
    });
    
    const blockchainGauge = new prometheus.Gauge({
        name: 'genesis_blockchain_balance_wei',
        help: 'Blockchain balance in wei',
        labelNames: ['address', 'token']
    });
    
    // MAHDI sandbox metrics
    const codeExecutionCounter = new prometheus.Counter({
        name: 'genesis_mahdi_code_executions_total',
        help: 'Total code executions in MAHDI sandbox',
        labelNames: ['language', 'status', 'user_tier']
    });
    
    const sandboxRevenueGauge = new prometheus.Gauge({
        name: 'genesis_mahdi_revenue_inr',
        help: 'MAHDI sandbox revenue in INR',
        labelNames: ['subscription_type']
    });
    
    // Register all metrics
    register.registerMetric(revenueGauge);
    register.registerMetric(revenueCounter);
    register.registerMetric(membershipGauge);
    register.registerMetric(sbtIssuanceCounter);
    register.registerMetric(complianceGauge);
    register.registerMetric(auditCounter);
    register.registerMetric(responseTimeHistogram);
    register.registerMetric(activeConnectionsGauge);
    register.registerMetric(multiSigTransactionCounter);
    register.registerMetric(blockchainGauge);
    register.registerMetric(codeExecutionCounter);
    register.registerMetric(sandboxRevenueGauge);
    
    return {
        register,
        revenueGauge,
        revenueCounter,
        membershipGauge,
        sbtIssuanceCounter,
        complianceGauge,
        auditCounter,
        responseTimeHistogram,
        activeConnectionsGauge,
        multiSigTransactionCounter,
        blockchainGauge,
        codeExecutionCounter,
        sandboxRevenueGauge
    };
}

module.exports = { createPrometheusMetrics };