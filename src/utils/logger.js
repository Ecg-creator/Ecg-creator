/**
 * Genesis Stack Logging Utility
 * BelieversCommons Enterprise Logging Framework
 */

const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            return JSON.stringify({
                timestamp,
                level,
                message,
                stack,
                genesis_component: process.env.GENESIS_MODE || 'unknown',
                revenue_tracking: true,
                ...meta
            });
        })
    ),
    defaultMeta: {
        service: 'genesis-stack',
        version: '1.0.0',
        warden: 'faiz-ahmed'
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: '/var/log/genesis/error.log',
            level: 'error'
        }),
        new winston.transports.File({
            filename: '/var/log/genesis/combined.log'
        })
    ]
});

// Revenue-specific logging
logger.revenue = (message, amount, currency = 'INR') => {
    logger.info(message, {
        type: 'revenue',
        amount,
        currency,
        timestamp: new Date().toISOString()
    });
};

// Compliance logging
logger.compliance = (article, status, details) => {
    logger.info(`ECG Charter ${article} compliance: ${status}`, {
        type: 'compliance',
        article,
        status,
        details,
        timestamp: new Date().toISOString()
    });
};

module.exports = logger;