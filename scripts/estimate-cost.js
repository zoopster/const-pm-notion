#!/usr/bin/env node

/**
 * Deployment Cost Estimation Script
 * Estimates API calls and resource usage for different deployment tiers
 */

const { program } = require('commander');

// Cost estimation models
const tierCosts = {
  starter: {
    databases: 8,
    views: 15,
    pages: 50,
    properties: 40,
    integrations: 0,
    automations: 5,
    sampleData: {
      projects: 3,
      tasks: 25,
      clients: 5,
      materials: 20
    }
  },
  professional: {
    databases: 15,
    views: 35,
    pages: 150,
    properties: 100,
    integrations: 10,
    automations: 20,
    sampleData: {
      projects: 8,
      tasks: 80,
      clients: 15,
      materials: 100,
      vendors: 12,
      budgets: 8
    }
  },
  enterprise: {
    databases: 25,
    views: 60,
    pages: 300,
    properties: 200,
    integrations: 25,
    automations: 40,
    sampleData: {
      projects: 15,
      tasks: 200,
      clients: 30,
      materials: 250,
      vendors: 25,
      budgets: 15,
      reports: 20,
      portfolios: 5
    }
  }
};

// API call weights (based on Notion API complexity)
const apiWeights = {
  createDatabase: 2,
  updateDatabase: 1,
  createPage: 1,
  updatePage: 1,
  addProperty: 1,
  createView: 1,
  setupIntegration: 3,
  createAutomation: 2,
  uploadFile: 1
};

function estimateDeploymentCost(tier, options = {}) {
  console.log(`💰 Estimating deployment cost for ${tier} tier...`);
  
  const tierConfig = tierCosts[tier];
  if (!tierConfig) {
    throw new Error(`Unknown tier: ${tier}`);
  }

  const includeSampleData = options.sampleData !== false;
  let totalApiCalls = 0;
  const breakdown = {};

  // Database creation
  const databaseCalls = tierConfig.databases * apiWeights.createDatabase;
  totalApiCalls += databaseCalls;
  breakdown.databases = databaseCalls;

  // View creation
  const viewCalls = tierConfig.views * apiWeights.createView;
  totalApiCalls += viewCalls;
  breakdown.views = viewCalls;

  // Property setup
  const propertyCalls = tierConfig.properties * apiWeights.addProperty;
  totalApiCalls += propertyCalls;
  breakdown.properties = propertyCalls;

  // Integration setup
  const integrationCalls = tierConfig.integrations * apiWeights.setupIntegration;
  totalApiCalls += integrationCalls;
  breakdown.integrations = integrationCalls;

  // Automation setup
  const automationCalls = tierConfig.automations * apiWeights.createAutomation;
  totalApiCalls += automationCalls;
  breakdown.automations = automationCalls;

  // Sample data creation
  if (includeSampleData) {
    const sampleDataCalls = Object.values(tierConfig.sampleData)
      .reduce((sum, count) => sum + count, 0) * apiWeights.createPage;
    totalApiCalls += sampleDataCalls;
    breakdown.sampleData = sampleDataCalls;
  }

  // Base configuration calls
  const baseCalls = 20; // Basic setup, testing, validation
  totalApiCalls += baseCalls;
  breakdown.baseSetup = baseCalls;

  // Estimated time based on API rate limits (3 requests per second)
  const estimatedSeconds = Math.ceil(totalApiCalls / 3);
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

  const result = {
    tier,
    totalApiCalls,
    estimatedTime: {
      seconds: estimatedSeconds,
      minutes: estimatedMinutes,
      formatted: formatTime(estimatedSeconds)
    },
    breakdown,
    rateLimit: '3 requests/second (Notion API)',
    includeSampleData,
    cost: calculateCost(totalApiCalls),
    recommendations: generateRecommendations(tier, totalApiCalls)
  };

  console.log('📊 Cost Estimation Results:');
  console.log(`   Total API Calls: ${totalApiCalls}`);
  console.log(`   Estimated Time: ${result.estimatedTime.formatted}`);
  console.log(`   Sample Data: ${includeSampleData ? 'Included' : 'Not included'}`);

  return result;
}

function calculateCost(apiCalls) {
  // Notion API is free for most operations, but we calculate resource cost
  const computeMinutes = Math.ceil(apiCalls / 60); // Rough estimate
  
  return {
    apiCalls: 0, // Notion API is free
    compute: {
      minutes: computeMinutes,
      estimated: '$0.00' // Most CI/CD platforms include reasonable compute
    },
    total: '$0.00',
    note: 'Notion API calls are free, compute costs are typically included in CI/CD platforms'
  };
}

function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

function generateRecommendations(tier, apiCalls) {
  const recommendations = [];

  if (apiCalls > 1000) {
    recommendations.push('Consider running deployment during off-peak hours to minimize impact');
    recommendations.push('Monitor API rate limits closely during deployment');
  }

  if (tier === 'starter') {
    recommendations.push('Starter tier deployment should complete quickly');
    recommendations.push('Consider upgrading to Professional for more features');
  } else if (tier === 'enterprise') {
    recommendations.push('Enterprise deployment includes all features and integrations');
    recommendations.push('Allow extra time for complex automation setup');
  }

  if (apiCalls < 100) {
    recommendations.push('This is a lightweight deployment that should complete very quickly');
  }

  return recommendations;
}

function compareTiers() {
  console.log('🔄 Comparing all deployment tiers...\n');
  
  const comparison = {};
  
  for (const tier of ['starter', 'professional', 'enterprise']) {
    comparison[tier] = estimateDeploymentCost(tier, { sampleData: true });
  }

  // Display comparison table
  console.log('Tier Comparison Summary:');
  console.log('─'.repeat(80));
  console.log('Tier          | API Calls | Time      | Features');
  console.log('─'.repeat(80));
  
  for (const [tier, data] of Object.entries(comparison)) {
    const tierName = tier.padEnd(12);
    const calls = data.totalApiCalls.toString().padEnd(8);
    const time = data.estimatedTime.formatted.padEnd(8);
    const features = tierCosts[tier].databases + tierCosts[tier].views;
    
    console.log(`${tierName} | ${calls} | ${time} | ${features} components`);
  }
  
  console.log('─'.repeat(80));
  
  return comparison;
}

// CLI setup
program
  .name('estimate-cost')
  .description('Estimate deployment cost and time for construction template')
  .option('--tier <tier>', 'Deployment tier (starter|professional|enterprise)', 'professional')
  .option('--no-sample-data', 'Exclude sample data from estimation')
  .option('--compare', 'Compare all tiers')
  .action((options) => {
    try {
      if (options.compare) {
        compareTiers();
      } else {
        const result = estimateDeploymentCost(options.tier, {
          sampleData: options.sampleData
        });
        
        // Output for CI/CD (simplified)
        if (process.env.CI) {
          console.log(result.totalApiCalls);
        } else {
          console.log(JSON.stringify(result, null, 2));
        }
      }
    } catch (error) {
      console.error('❌ Cost estimation failed:', error.message);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

module.exports = {
  estimateDeploymentCost,
  tierCosts,
  compareTiers
};