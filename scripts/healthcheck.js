#!/usr/bin/env node

/**
 * Health Check Script
 * Performs comprehensive health checks on deployed construction templates
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

async function performHealthCheck() {
  console.log('🏥 Starting health check...');
  
  const checks = {
    notion_connectivity: { status: 'pending', message: '', duration: 0 },
    database_access: { status: 'pending', message: '', duration: 0 },
    data_integrity: { status: 'pending', message: '', duration: 0 },
    api_performance: { status: 'pending', message: '', duration: 0 },
    error_rates: { status: 'pending', message: '', duration: 0 }
  };
  
  const startTime = Date.now();
  
  try {
    // Check 1: Notion API connectivity
    await checkNotionConnectivity(checks);
    
    // Check 2: Database accessibility
    await checkDatabaseAccess(checks);
    
    // Check 3: Data integrity
    await checkDataIntegrity(checks);
    
    // Check 4: API performance
    await checkApiPerformance(checks);
    
    // Check 5: Error rates
    await checkErrorRates(checks);
    
    const totalDuration = Date.now() - startTime;
    const overallHealth = calculateOverallHealth(checks);
    
    // Generate health report
    const report = {
      timestamp: new Date().toISOString(),
      overall_status: overallHealth.status,
      overall_score: overallHealth.score,
      total_duration: totalDuration,
      checks,
      recommendations: generateRecommendations(checks)
    };
    
    console.log('\n🏥 Health Check Results:');
    console.log(`   Overall Status: ${report.overall_status}`);
    console.log(`   Health Score: ${report.overall_score}%`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    
    // Print individual check results
    Object.entries(checks).forEach(([checkName, result]) => {
      const icon = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${icon} ${checkName.replace(/_/g, ' ')}: ${result.message} (${result.duration}ms)`);
    });
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
}

async function checkNotionConnectivity(checks) {
  console.log('🔗 Checking Notion connectivity...');
  const start = Date.now();
  
  try {
    const notion = new Client({
      auth: process.env.NOTION_TOKEN,
      logLevel: 'warn'
    });
    
    const user = await notion.users.me();
    
    checks.notion_connectivity = {
      status: 'healthy',
      message: `Connected as ${user.name}`,
      duration: Date.now() - start
    };
    
  } catch (error) {
    checks.notion_connectivity = {
      status: 'unhealthy',
      message: `Connection failed: ${error.message}`,
      duration: Date.now() - start
    };
  }
}

async function checkDatabaseAccess(checks) {
  console.log('📊 Checking database access...');
  const start = Date.now();
  
  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    
    const databases = await notion.search({
      filter: { property: 'object', value: 'database' },
      page_size: 10
    });
    
    if (databases.results.length === 0) {
      checks.database_access = {
        status: 'warning',
        message: 'No databases found',
        duration: Date.now() - start
      };
    } else {
      checks.database_access = {
        status: 'healthy',
        message: `Found ${databases.results.length} accessible databases`,
        duration: Date.now() - start
      };
    }
    
  } catch (error) {
    checks.database_access = {
      status: 'unhealthy',
      message: `Database access failed: ${error.message}`,
      duration: Date.now() - start
    };
  }
}

async function checkDataIntegrity(checks) {
  console.log('🔍 Checking data integrity...');
  const start = Date.now();
  
  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    
    // Get a sample of pages to check
    const pages = await notion.search({
      filter: { property: 'object', value: 'page' },
      page_size: 5
    });
    
    let integrityIssues = 0;
    
    for (const page of pages.results) {
      try {
        // Try to retrieve the full page to check for corruption
        await notion.pages.retrieve({ page_id: page.id });
      } catch (error) {
        integrityIssues++;
      }
    }
    
    if (integrityIssues === 0) {
      checks.data_integrity = {
        status: 'healthy',
        message: `Checked ${pages.results.length} pages, no issues found`,
        duration: Date.now() - start
      };
    } else {
      checks.data_integrity = {
        status: 'warning',
        message: `Found ${integrityIssues} pages with issues`,
        duration: Date.now() - start
      };
    }
    
  } catch (error) {
    checks.data_integrity = {
      status: 'unhealthy',
      message: `Data integrity check failed: ${error.message}`,
      duration: Date.now() - start
    };
  }
}

async function checkApiPerformance(checks) {
  console.log('⚡ Checking API performance...');
  const start = Date.now();
  
  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    
    // Perform multiple API calls to test performance
    const performanceTests = [
      () => notion.users.me(),
      () => notion.search({ filter: { property: 'object', value: 'database' }, page_size: 1 }),
      () => notion.search({ filter: { property: 'object', value: 'page' }, page_size: 1 })
    ];
    
    const results = await Promise.all(
      performanceTests.map(async test => {
        const testStart = Date.now();
        await test();
        return Date.now() - testStart;
      })
    );
    
    const avgResponseTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    const maxResponseTime = Math.max(...results);
    
    let status = 'healthy';
    let message = `Average response time: ${avgResponseTime.toFixed(0)}ms`;
    
    if (avgResponseTime > 2000) {
      status = 'unhealthy';
      message += ' (too slow)';
    } else if (avgResponseTime > 1000) {
      status = 'warning';
      message += ' (slow)';
    }
    
    checks.api_performance = {
      status,
      message: `${message}, max: ${maxResponseTime}ms`,
      duration: Date.now() - start
    };
    
  } catch (error) {
    checks.api_performance = {
      status: 'unhealthy',
      message: `Performance check failed: ${error.message}`,
      duration: Date.now() - start
    };
  }
}

async function checkErrorRates(checks) {
  console.log('🛡️ Checking error rates...');
  const start = Date.now();
  
  try {
    // This would typically check logs or error tracking systems
    // For now, we'll simulate by making several API calls and tracking failures
    
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const testCount = 5;
    let errorCount = 0;
    
    for (let i = 0; i < testCount; i++) {
      try {
        await notion.users.me();
      } catch (error) {
        errorCount++;
      }
    }
    
    const errorRate = (errorCount / testCount) * 100;
    
    let status = 'healthy';
    let message = `Error rate: ${errorRate}% (${errorCount}/${testCount} calls failed)`;
    
    if (errorRate > 20) {
      status = 'unhealthy';
    } else if (errorRate > 5) {
      status = 'warning';
    }
    
    checks.error_rates = {
      status,
      message,
      duration: Date.now() - start
    };
    
  } catch (error) {
    checks.error_rates = {
      status: 'unhealthy',
      message: `Error rate check failed: ${error.message}`,
      duration: Date.now() - start
    };
  }
}

function calculateOverallHealth(checks) {
  const checkResults = Object.values(checks);
  const healthyCount = checkResults.filter(c => c.status === 'healthy').length;
  const warningCount = checkResults.filter(c => c.status === 'warning').length;
  const unhealthyCount = checkResults.filter(c => c.status === 'unhealthy').length;
  
  const totalChecks = checkResults.length;
  const score = Math.round(((healthyCount * 100) + (warningCount * 50)) / totalChecks);
  
  let status = 'healthy';
  if (unhealthyCount > 0) {
    status = 'unhealthy';
  } else if (warningCount > 0) {
    status = 'warning';
  }
  
  return { status, score };
}

function generateRecommendations(checks) {
  const recommendations = [];
  
  Object.entries(checks).forEach(([checkName, result]) => {
    if (result.status === 'unhealthy') {
      switch (checkName) {
        case 'notion_connectivity':
          recommendations.push('Check Notion API token and network connectivity');
          break;
        case 'database_access':
          recommendations.push('Verify database permissions and integration setup');
          break;
        case 'data_integrity':
          recommendations.push('Review and repair corrupted data entries');
          break;
        case 'api_performance':
          recommendations.push('Consider optimizing API calls or checking for rate limiting');
          break;
        case 'error_rates':
          recommendations.push('Investigate high error rates and implement proper error handling');
          break;
      }
    } else if (result.status === 'warning') {
      switch (checkName) {
        case 'database_access':
          recommendations.push('Consider setting up additional databases for better organization');
          break;
        case 'api_performance':
          recommendations.push('Monitor API performance and consider caching strategies');
          break;
      }
    }
  });
  
  return recommendations;
}

// Quick health status for monitoring systems
async function quickHealthCheck() {
  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    await notion.users.me();
    return { healthy: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { healthy: false, error: error.message, timestamp: new Date().toISOString() };
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'quick') {
    quickHealthCheck()
      .then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.healthy ? 0 : 1);
      });
  } else {
    performHealthCheck()
      .then(report => {
        // Save detailed report
        require('fs').writeFileSync(
          'health-check-report.json',
          JSON.stringify(report, null, 2)
        );
        
        process.exit(report.overall_status === 'healthy' ? 0 : 1);
      })
      .catch(error => {
        console.error('Health check failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = {
  performHealthCheck,
  quickHealthCheck
};