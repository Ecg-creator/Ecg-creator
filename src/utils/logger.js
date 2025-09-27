const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ecg-security-framework' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    }),
    // Write security-specific logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'security.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => {
          if (info.type === 'security') {
            return `${info.timestamp} [SECURITY] ${info.level}: ${info.message}`;
          }
          return false;
        })
      )
    }),
    // Write compliance-specific logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'compliance.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => {
          if (info.type === 'compliance') {
            return `${info.timestamp} [COMPLIANCE] ${info.level}: ${info.message}`;
          }
          return false;
        })
      )
    })
  ]
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(info => {
        const timestamp = new Date().toISOString();
        return `${timestamp} [${info.level}]: ${info.message}`;
      })
    )
  }));
}

// Add custom methods for security and compliance logging
logger.security = (message, meta = {}) => {
  logger.info(message, { ...meta, type: 'security' });
};

logger.compliance = (message, meta = {}) => {
  logger.info(message, { ...meta, type: 'compliance' });
};

module.exports = logger;