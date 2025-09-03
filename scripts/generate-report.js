#!/usr/bin/env node

/**
 * Deployment Report Generator
 * Generates comprehensive reports for construction template deployments
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

async function generateDeploymentReport(options = {}) {
  console.log('📊 Generating deployment report...');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    reportType: 'deployment',
    format: options.format || 'json',
    ...options
  };
  
  try {
    // Collect deployment data
    const deploymentData = await collectDeploymentData();
    
    // Generate report content
    const report = {
      ...reportData,
      deployment: deploymentData,
      summary: generateSummary(deploymentData),
      recommendations: generateRecommendations(deploymentData),
      metadata: {
        generatedBy: 'Construction Template CI/CD',
        version: getPackageVersion(),
        reportId: `report-${Date.now()}`
      }
    };
    
    // Save report in requested format
    await saveReport(report, options);
    
    console.log(`✅ Deployment report generated: ${options.output || 'deployment-report.json'}`);
    return report;
    
  } catch (error) {
    console.error('❌ Failed to generate report:', error.message);
    throw error;
  }
}

async function collectDeploymentData() {
  const data = {
    client: process.env.CLIENT_NAME || 'Unknown Client',
    tier: process.env.DEPLOYMENT_TIER || 'Unknown Tier',
    resources: [],
    performance: {},
    errors: []
  };
  
  try {
    // Try to find deployment metadata
    const distPath = path.join(process.cwd(), 'dist');
    const files = await fs.readdir(distPath);
    const metadataFiles = files.filter(file => file.startsWith('deployment-') && file.endsWith('.json'));
    
    if (metadataFiles.length > 0) {
      const latestMetadata = metadataFiles.sort().pop();
      const metadataContent = await fs.readFile(path.join(distPath, latestMetadata), 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      data.resources = metadata.createdResources || [];
      data.performance.deploymentTime = metadata.deploymentTime || 0;
      data.errors = metadata.errors || [];
      data.completedSteps = metadata.completedSteps || [];
    }
    
  } catch (error) {
    console.warn('⚠️ Could not load deployment metadata:', error.message);
  }
  
  // Add current system info
  data.system = {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  return data;
}

function generateSummary(deploymentData) {
  return {
    client: deploymentData.client,
    tier: deploymentData.tier,
    resourcesCreated: deploymentData.resources.length,
    databases: deploymentData.resources.filter(r => r.type === 'database').length,
    pages: deploymentData.resources.filter(r => r.type === 'page').length,
    deploymentTime: deploymentData.performance.deploymentTime || 0,
    completedSteps: deploymentData.completedSteps?.length || 0,
    errors: deploymentData.errors.length,
    status: deploymentData.errors.length === 0 ? 'Success' : 'Completed with errors'
  };
}

function generateRecommendations(deploymentData) {
  const recommendations = [];
  
  if (deploymentData.errors.length > 0) {
    recommendations.push('Review and address deployment errors');
  }
  
  if (deploymentData.performance.deploymentTime > 300000) { // 5 minutes
    recommendations.push('Consider optimizing deployment process for better performance');
  }
  
  if (deploymentData.resources.length === 0) {
    recommendations.push('Verify deployment completed successfully - no resources were tracked');
  }
  
  recommendations.push('Set up monitoring and health checks for the deployed template');
  recommendations.push('Document any custom configurations for client reference');
  
  return recommendations;
}

async function saveReport(report, options) {
  const outputPath = options.output || 'deployment-report.json';
  
  switch (options.format) {
    case 'markdown':
      await saveMarkdownReport(report, outputPath.replace('.json', '.md'));
      break;
    case 'html':
      await saveHtmlReport(report, outputPath.replace('.json', '.html'));
      break;
    default:
      await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  }
}

async function saveMarkdownReport(report, outputPath) {
  const markdown = `
# Deployment Report

**Client:** ${report.deployment.client}  
**Tier:** ${report.deployment.tier}  
**Generated:** ${report.timestamp}  
**Status:** ${report.summary.status}  

## Summary

- **Resources Created:** ${report.summary.resourcesCreated}
- **Databases:** ${report.summary.databases}
- **Pages:** ${report.summary.pages}
- **Deployment Time:** ${report.summary.deploymentTime}ms
- **Completed Steps:** ${report.summary.completedSteps}
- **Errors:** ${report.summary.errors}

## Resources Created

${report.deployment.resources.map(r => `- ${r.type}: ${r.name || r.id}`).join('\n')}

## Recommendations

${report.recommendations.map(r => `- ${r}`).join('\n')}

## System Information

- **Node.js Version:** ${report.deployment.system.nodeVersion}
- **Platform:** ${report.deployment.system.platform}
- **Architecture:** ${report.deployment.system.architecture}

---
*Generated by Construction Template CI/CD v${report.metadata.version}*
`;
  
  await fs.writeFile(outputPath, markdown);
}

async function saveHtmlReport(report, outputPath) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Deployment Report - ${report.deployment.client}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    .success { color: green; }
    .error { color: red; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Construction Template Deployment Report</h1>
    <p><strong>Client:</strong> ${report.deployment.client}</p>
    <p><strong>Tier:</strong> ${report.deployment.tier}</p>
    <p><strong>Generated:</strong> ${report.timestamp}</p>
    <p><strong>Status:</strong> <span class="${report.summary.errors === 0 ? 'success' : 'error'}">${report.summary.status}</span></p>
  </div>
  
  <div class="summary">
    <div class="metric">
      <h3>${report.summary.resourcesCreated}</h3>
      <p>Resources Created</p>
    </div>
    <div class="metric">
      <h3>${report.summary.databases}</h3>
      <p>Databases</p>
    </div>
    <div class="metric">
      <h3>${report.summary.deploymentTime}ms</h3>
      <p>Deployment Time</p>
    </div>
    <div class="metric">
      <h3>${report.summary.errors}</h3>
      <p>Errors</p>
    </div>
  </div>
  
  <h2>Recommendations</h2>
  <ul>
    ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
  </ul>
  
  <footer>
    <p><em>Generated by Construction Template CI/CD v${report.metadata.version}</em></p>
  </footer>
</body>
</html>
`;
  
  await fs.writeFile(outputPath, html);
}

function getPackageVersion() {
  try {
    const packageJson = require('../package.json');
    return packageJson.version;
  } catch (error) {
    return '1.0.0';
  }
}

// CLI setup
program
  .name('generate-report')
  .description('Generate deployment report for construction template')
  .option('--output <file>', 'Output file path', 'deployment-report.json')
  .option('--format <format>', 'Report format (json|markdown|html)', 'json')
  .option('--client <client>', 'Client name')
  .option('--tier <tier>', 'Deployment tier')
  .action(async (options) => {
    try {
      await generateDeploymentReport(options);
    } catch (error) {
      console.error('❌ Report generation failed:', error.message);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

module.exports = {
  generateDeploymentReport
};