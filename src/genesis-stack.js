/**
 * BelieversCommons Genesis Stack - Unified Integration
 * First Warden Faiz Ahmed - Enterprise Governance Solutions
 * 
 * Revenue Target: ₹3.7Cr annual consolidation
 * Components: EmpireOS + RiverOS + SynergizeOS
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const { createPrometheusMetrics } = require('./utils/metrics');
const { initializeDatabase } = require('./database/connection');
const { setupCompliance } = require('./compliance/ecg-charter');
const { initializeBlockchain } = require('./blockchain/safe-deployment');
const logger = require('./utils/logger');

class GenesisStack {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 8080;
        this.mode = process.env.GENESIS_MODE || 'empire';
        this.revenueTarget = parseInt(process.env.REVENUE_TARGET) || 370000000;
        this.initialize();
    }

    async initialize() {
        try {
            await this.setupMiddleware();
            await this.setupDatabase();
            await this.setupCompliance();
            await this.setupBlockchain();
            await this.setupRoutes();
            await this.setupMetrics();
            
            logger.info('Genesis Stack initialized successfully', {
                mode: this.mode,
                revenueTarget: this.revenueTarget,
                port: this.port
            });
        } catch (error) {
            logger.error('Genesis Stack initialization failed', error);
            process.exit(1);
        }
    }

    async setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                }
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));

        // General middleware
        this.app.use(compression());
        this.app.use(morgan('combined'));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    async setupDatabase() {
        this.db = await initializeDatabase();
        logger.info('Genesis Ledger database connected');
    }

    async setupCompliance() {
        this.compliance = await setupCompliance({
            article2_1: true, // Platform security
            article4: true,   // Financial terms automation
            dpdpa2023: true   // Privacy compliance
        });
        logger.info('ECG Charter compliance framework initialized');
    }

    async setupBlockchain() {
        this.blockchain = await initializeBlockchain({
            threshold: 3,
            owners: 5,
            network: process.env.TARGET_NETWORK || 'mainnet'
        });
        logger.info('Multi-signature Safe deployed');
    }

    async setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                mode: this.mode,
                timestamp: new Date().toISOString(),
                revenueTarget: this.revenueTarget,
                services: {
                    database: this.db ? 'connected' : 'disconnected',
                    compliance: this.compliance ? 'active' : 'inactive',
                    blockchain: this.blockchain ? 'deployed' : 'pending'
                }
            });
        });

        // Genesis Stack API routes
        this.app.use('/api/v1/empire', require('./routes/empire-os'));
        this.app.use('/api/v1/river', require('./routes/river-os'));
        this.app.use('/api/v1/synergize', require('./routes/synergize-os'));
        this.app.use('/api/v1/compliance', require('./routes/compliance'));
        this.app.use('/api/v1/membership', require('./routes/membership-nft'));
        this.app.use('/api/v1/reit-dao', require('./routes/reit-dao'));
        this.app.use('/api/v1/mahdi', require('./routes/mahdi-sandbox'));

        // Revenue optimization endpoints
        this.app.get('/api/v1/revenue/summary', async (req, res) => {
            const revenueStreams = {
                membership_nft: 5000000,      // ₹50L annual
                reit_dao_governance: 12000000, // ₹1.2Cr
                mahdi_sandbox: 2500000,       // ₹25L
                security_premium: 4500000,    // ₹45L
                compliance_automation: 3000000 // ₹30L
            };

            const totalRevenue = Object.values(revenueStreams).reduce((a, b) => a + b, 0);
            
            res.json({
                annual_target: this.revenueTarget,
                current_streams: revenueStreams,
                total_projected: totalRevenue,
                target_achievement: ((totalRevenue / this.revenueTarget) * 100).toFixed(2) + '%',
                currency: 'INR'
            });
        });
    }

    async setupMetrics() {
        this.metrics = createPrometheusMetrics();
        this.app.get('/metrics', this.metrics.register.metrics());
        
        // Track revenue metrics
        setInterval(() => {
            this.metrics.revenueGauge.set(this.revenueTarget);
            this.metrics.complianceGauge.set(1); // 100% compliance
        }, 30000);
    }

    async start() {
        this.server = this.app.listen(this.port, () => {
            logger.info(`Genesis Stack ${this.mode} listening on port ${this.port}`, {
                revenueTarget: this.revenueTarget,
                pid: process.pid
            });
        });

        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    async shutdown() {
        logger.info('Genesis Stack shutting down gracefully...');
        
        if (this.server) {
            this.server.close(() => {
                logger.info('HTTP server closed');
                process.exit(0);
            });
        }

        // Close database connections
        if (this.db) {
            await this.db.end();
        }
    }
}

// Export for use in other modules
module.exports = GenesisStack;

// Start the server if this file is run directly
if (require.main === module) {
    const genesisStack = new GenesisStack();
    genesisStack.start().catch(error => {
        logger.error('Failed to start Genesis Stack', error);
        process.exit(1);
    });
}