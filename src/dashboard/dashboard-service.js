const express = require('express');
const path = require('path');
const logger = require('../utils/logger');

class DashboardService {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = process.env.DASHBOARD_PORT || 3000;
    this.orchestration = null;
  }

  async initialize() {
    try {
      // Set up middleware
      this.app.use(express.json());
      this.app.use(express.static(path.join(__dirname, 'public')));
      
      // Set up routes
      this.setupRoutes();
      
      logger.info('Dashboard service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Dashboard service:', error);
      return false;
    }
  }

  setOrchestrationService(orchestration) {
    this.orchestration = orchestration;
  }

  setupRoutes() {
    // Dashboard home
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // API Routes
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = this.orchestration 
          ? await this.orchestration.getSystemStatus()
          : { error: 'Orchestration service not available' };
        res.json(status);
      } catch (error) {
        logger.error('Failed to get system status:', error);
        res.status(500).json({ error: 'Failed to get system status' });
      }
    });

    this.app.get('/api/security/latest', async (req, res) => {
      try {
        const results = this.orchestration 
          ? await this.orchestration.getLastScanResults()
          : null;
        res.json(results || { message: 'No scan results available' });
      } catch (error) {
        logger.error('Failed to get security results:', error);
        res.status(500).json({ error: 'Failed to get security results' });
      }
    });

    this.app.get('/api/compliance/latest', async (req, res) => {
      try {
        const results = this.orchestration 
          ? await this.orchestration.getLastComplianceResults()
          : null;
        res.json(results || { message: 'No compliance results available' });
      } catch (error) {
        logger.error('Failed to get compliance results:', error);
        res.status(500).json({ error: 'Failed to get compliance results' });
      }
    });

    this.app.post('/api/security/scan', async (req, res) => {
      try {
        if (!this.orchestration) {
          return res.status(503).json({ error: 'Orchestration service not available' });
        }
        
        logger.info('Manual security scan initiated via dashboard');
        const results = await this.orchestration.runFullSecurityScan();
        res.json({ success: true, results });
      } catch (error) {
        logger.error('Failed to run security scan:', error);
        res.status(500).json({ error: 'Failed to run security scan' });
      }
    });

    this.app.post('/api/compliance/check', async (req, res) => {
      try {
        if (!this.orchestration) {
          return res.status(503).json({ error: 'Orchestration service not available' });
        }
        
        logger.compliance('Manual compliance check initiated via dashboard');
        const results = await this.orchestration.runFullComplianceCheck();
        res.json({ success: true, results });
      } catch (error) {
        logger.error('Failed to run compliance check:', error);
        res.status(500).json({ error: 'Failed to run compliance check' });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'ECG Security Framework Dashboard'
      });
    });
  }

  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECG Security Framework Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: white;
            border-radius: 10px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #7f8c8d;
            font-size: 18px;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        .status-active { background-color: #27ae60; }
        .status-warning { background-color: #f39c12; }
        .status-error { background-color: #e74c3c; }
        .status-unknown { background-color: #95a5a6; }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-value {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s ease;
            margin: 5px;
        }
        
        .btn:hover {
            background: #2980b9;
        }
        
        .btn-danger {
            background: #e74c3c;
        }
        
        .btn-danger:hover {
            background: #c0392b;
        }
        
        .btn-success {
            background: #27ae60;
        }
        
        .btn-success:hover {
            background: #229954;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .compliance-framework {
            margin: 10px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        
        .compliance-framework h4 {
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .score-bar {
            width: 100%;
            height: 8px;
            background: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .score-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        
        .score-excellent { background: #27ae60; }
        .score-good { background: #f39c12; }
        .score-poor { background: #e74c3c; }
        
        footer {
            text-align: center;
            padding: 30px;
            color: white;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>ECG Security Framework</h1>
            <p class="subtitle">Cloudflare Security API with Session Foundation Vulnerability Database</p>
            <p>Enterprise Governance • Compliance Automation • Revenue Protection</p>
        </header>
        
        <div class="dashboard-grid">
            <div class="card">
                <h3>System Status</h3>
                <div id="system-status">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading system status...</p>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>Security Overview</h3>
                <div id="security-overview">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading security data...</p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn" onclick="runSecurityScan()">Run Security Scan</button>
                </div>
            </div>
            
            <div class="card">
                <h3>Compliance Status</h3>
                <div id="compliance-overview">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading compliance data...</p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-success" onclick="runComplianceCheck()">Run Compliance Check</button>
                </div>
            </div>
            
            <div class="card">
                <h3>Portfolio Repositories</h3>
                <div id="repository-status">
                    <div class="metric">
                        <span>Ecg-creator/vercel</span>
                        <span><span class="status-indicator status-active"></span>Active</span>
                    </div>
                    <div class="metric">
                        <span>Ecg-creator/DigitalMe</span>
                        <span><span class="status-indicator status-active"></span>Active</span>
                    </div>
                    <div class="metric">
                        <span>Ecg-creator/SynergyzeGovernance</span>
                        <span><span class="status-indicator status-warning"></span>Warning</span>
                    </div>
                    <div class="metric">
                        <span>Believers-common-group/The-believers-lobby</span>
                        <span><span class="status-indicator status-active"></span>Active</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>Revenue Protection</h3>
                <div class="metric">
                    <span>85/15 Revenue Share</span>
                    <span class="metric-value">Protected</span>
                </div>
                <div class="metric">
                    <span>Smart Contract Integrity</span>
                    <span class="metric-value">Monitored</span>
                </div>
                <div class="metric">
                    <span>Platform Availability</span>
                    <span class="metric-value">99.9%</span>
                </div>
                <div class="metric">
                    <span>GST Compliance</span>
                    <span class="metric-value">Automated</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Quick Actions</h3>
                <div style="text-align: center;">
                    <button class="btn" onclick="refreshDashboard()">Refresh Dashboard</button>
                    <button class="btn btn-danger" onclick="viewLogs()">View Logs</button>
                    <button class="btn btn-success" onclick="downloadReport()">Download Report</button>
                </div>
            </div>
        </div>
        
        <footer>
            <p>&copy; 2024 ECG Creator - Enterprise Governance Solutions</p>
            <p>Led by Faiz Ahmed • faiz.ahmed@ecg-creator.com</p>
        </footer>
    </div>

    <script>
        // Dashboard JavaScript
        let isLoading = false;
        
        async function loadSystemStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                
                const systemStatusDiv = document.getElementById('system-status');
                systemStatusDiv.innerHTML = \`
                    <div class="metric">
                        <span>Framework Status</span>
                        <span><span class="status-indicator status-\${status.isRunning ? 'active' : 'error'}"></span>\${status.isRunning ? 'Running' : 'Stopped'}</span>
                    </div>
                    <div class="metric">
                        <span>Scheduled Tasks</span>
                        <span class="metric-value">\${status.scheduledTasks || 0}</span>
                    </div>
                    <div class="metric">
                        <span>Last Scan</span>
                        <span class="metric-value">\${status.lastScan ? new Date(status.lastScan).toLocaleString() : 'Never'}</span>
                    </div>
                    <div class="metric">
                        <span>Services</span>
                        <span class="metric-value">Cloudflare • Session Foundation • Compliance</span>
                    </div>
                \`;
            } catch (error) {
                console.error('Failed to load system status:', error);
                document.getElementById('system-status').innerHTML = '<p style="color: #e74c3c;">Failed to load system status</p>';
            }
        }
        
        async function loadSecurityOverview() {
            try {
                const response = await fetch('/api/security/latest');
                const data = await response.json();
                
                const securityDiv = document.getElementById('security-overview');
                
                if (data.message) {
                    securityDiv.innerHTML = \`<p style="color: #7f8c8d;">\${data.message}</p>\`;
                    return;
                }
                
                securityDiv.innerHTML = \`
                    <div class="metric">
                        <span>Total Vulnerabilities</span>
                        <span class="metric-value">\${data.summary?.totalVulnerabilities || 0}</span>
                    </div>
                    <div class="metric">
                        <span>Critical Issues</span>
                        <span class="metric-value" style="color: #e74c3c;">\${data.summary?.criticalVulnerabilities || 0}</span>
                    </div>
                    <div class="metric">
                        <span>Average Security Score</span>
                        <span class="metric-value">\${data.summary?.averageSecurityScore || 0}/100</span>
                    </div>
                    <div class="metric">
                        <span>Repositories Scanned</span>
                        <span class="metric-value">\${data.repositories?.length || 0}</span>
                    </div>
                \`;
            } catch (error) {
                console.error('Failed to load security overview:', error);
                document.getElementById('security-overview').innerHTML = '<p style="color: #e74c3c;">Failed to load security data</p>';
            }
        }
        
        async function loadComplianceOverview() {
            try {
                const response = await fetch('/api/compliance/latest');
                const data = await response.json();
                
                const complianceDiv = document.getElementById('compliance-overview');
                
                if (data.message) {
                    complianceDiv.innerHTML = \`<p style="color: #7f8c8d;">\${data.message}</p>\`;
                    return;
                }
                
                let frameworksHTML = '';
                if (data.frameworkResults) {
                    Object.values(data.frameworkResults).forEach(framework => {
                        const scoreClass = framework.overallScore >= 80 ? 'score-excellent' : 
                                         framework.overallScore >= 60 ? 'score-good' : 'score-poor';
                        
                        frameworksHTML += \`
                            <div class="compliance-framework">
                                <h4>\${framework.framework}</h4>
                                <div class="score-bar">
                                    <div class="score-fill \${scoreClass}" style="width: \${framework.overallScore}%"></div>
                                </div>
                                <p style="margin-top: 5px; font-size: 14px; color: #7f8c8d;">
                                    \${Math.round(framework.overallScore)}% - \${framework.status}
                                </p>
                            </div>
                        \`;
                    });
                }
                
                complianceDiv.innerHTML = frameworksHTML || '<p style="color: #7f8c8d;">No compliance data available</p>';
            } catch (error) {
                console.error('Failed to load compliance overview:', error);
                document.getElementById('compliance-overview').innerHTML = '<p style="color: #e74c3c;">Failed to load compliance data</p>';
            }
        }
        
        async function runSecurityScan() {
            if (isLoading) return;
            
            isLoading = true;
            const button = event.target;
            button.disabled = true;
            button.textContent = 'Scanning...';
            
            try {
                const response = await fetch('/api/security/scan', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert('Security scan completed successfully!');
                    await loadSecurityOverview();
                } else {
                    alert('Security scan failed: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Failed to run security scan:', error);
                alert('Failed to run security scan: ' + error.message);
            } finally {
                isLoading = false;
                button.disabled = false;
                button.textContent = 'Run Security Scan';
            }
        }
        
        async function runComplianceCheck() {
            if (isLoading) return;
            
            isLoading = true;
            const button = event.target;
            button.disabled = true;
            button.textContent = 'Checking...';
            
            try {
                const response = await fetch('/api/compliance/check', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert('Compliance check completed successfully!');
                    await loadComplianceOverview();
                } else {
                    alert('Compliance check failed: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Failed to run compliance check:', error);
                alert('Failed to run compliance check: ' + error.message);
            } finally {
                isLoading = false;
                button.disabled = false;
                button.textContent = 'Run Compliance Check';
            }
        }
        
        function refreshDashboard() {
            location.reload();
        }
        
        function viewLogs() {
            alert('Log viewing functionality would open in a new window/modal');
        }
        
        function downloadReport() {
            alert('Report download functionality would generate and download a PDF report');
        }
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            loadSystemStatus();
            loadSecurityOverview();
            loadComplianceOverview();
            
            // Auto-refresh every 30 seconds
            setInterval(() => {
                loadSystemStatus();
            }, 30000);
        });
    </script>
</body>
</html>
    `;
  }

  async start() {
    try {
      this.server = this.app.listen(this.port, () => {
        logger.info(`Dashboard service started on port ${this.port}`);
        logger.info(`Dashboard available at: http://localhost:${this.port}`);
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to start Dashboard service:', error);
      return false;
    }
  }

  async stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      logger.info('Dashboard service stopped');
    }
  }
}

module.exports = DashboardService;