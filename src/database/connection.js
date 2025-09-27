/**
 * Genesis Ledger Database Connection
 * PostgreSQL connection with immutable transaction recording
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

class GenesisLedgerConnection {
    constructor() {
        this.pool = null;
    }
    
    async initialize() {
        const config = {
            host: process.env.POSTGRES_HOST || 'ledger-db',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'genesis_ledger',
            user: process.env.POSTGRES_USER || 'genesis_admin',
            password: process.env.POSTGRES_PASSWORD || 'genesis_secure_db_password_believers_commons_2024',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
        
        this.pool = new Pool(config);
        
        // Test connection
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            logger.info('Genesis Ledger database connected successfully', {
                host: config.host,
                database: config.database
            });
            
            return this.pool;
        } catch (error) {
            logger.error('Failed to connect to Genesis Ledger database', error);
            throw error;
        }
    }
    
    async recordTransaction(transactionData) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO genesis.transaction_ledger 
                (transaction_hash, block_number, from_address, to_address, value, 
                 gas_used, gas_price, transaction_fee, data, status, genesis_component, revenue_impact)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
            `;
            
            const values = [
                transactionData.hash,
                transactionData.blockNumber,
                transactionData.from,
                transactionData.to,
                transactionData.value,
                transactionData.gasUsed,
                transactionData.gasPrice,
                transactionData.transactionFee,
                transactionData.data,
                transactionData.status,
                transactionData.genesisComponent,
                transactionData.revenueImpact || 0
            ];
            
            const result = await client.query(query, values);
            
            logger.info('Transaction recorded in Genesis Ledger', {
                transactionId: result.rows[0].id,
                hash: transactionData.hash,
                revenueImpact: transactionData.revenueImpact
            });
            
            return result.rows[0];
        } finally {
            client.release();
        }
    }
    
    async getRevenueStreams() {
        const query = `
            SELECT stream_name, annual_target, current_revenue, 
                   (current_revenue / annual_target * 100) as achievement_percentage
            FROM genesis.revenue_streams 
            WHERE active = true
        `;
        
        const result = await this.pool.query(query);
        return result.rows;
    }
    
    async updateRevenueStream(streamName, amount) {
        const query = `
            UPDATE genesis.revenue_streams 
            SET current_revenue = current_revenue + $1, last_updated = NOW()
            WHERE stream_name = $2
            RETURNING *
        `;
        
        const result = await this.pool.query(query, [amount, streamName]);
        
        if (result.rows.length > 0) {
            logger.revenue('Revenue stream updated', amount, 'INR');
        }
        
        return result.rows[0];
    }
    
    async end() {
        if (this.pool) {
            await this.pool.end();
            logger.info('Database connection pool closed');
        }
    }
}

async function initializeDatabase() {
    const db = new GenesisLedgerConnection();
    await db.initialize();
    return db;
}

module.exports = { initializeDatabase, GenesisLedgerConnection };