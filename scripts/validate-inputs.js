#!/usr/bin/env node

/**
 * Input Validation Script for Construction Template Deployment
 * Validates deployment inputs before starting the deployment process
 */

const { program } = require('commander');
const Joi = require('joi');

// Validation schemas
const deploymentSchema = Joi.object({
  tier: Joi.string().valid('starter', 'professional', 'enterprise').required(),
  client: Joi.string().min(2).max(100).required(),
  token: Joi.string().pattern(/^secret_[A-Za-z0-9]{43}$/).required(),
  customDomain: Joi.string().domain().optional(),
  integrationConfig: Joi.string().optional()
});

const tierConfigurations = {
  starter: {
    maxProjects: 5,
    maxUsers: 2,
    features: ['basic-project-management', 'task-tracking', 'client-management'],
    integrations: []
  },
  professional: {
    maxProjects: 25,
    maxUsers: 10,
    features: ['all-starter-features', 'material-management', 'financial-tracking', 'vendor-management'],
    integrations: ['slack', 'email']
  },
  enterprise: {
    maxProjects: -1, // unlimited
    maxUsers: -1, // unlimited
    features: ['all-professional-features', 'multi-project-portfolio', 'advanced-analytics', 'api-access'],
    integrations: ['slack', 'email', 'quickbooks', 'custom-api']
  }
};

async function validateInputs(options) {
  console.log('🔍 Validating deployment inputs...');
  
  try {
    // Basic validation
    const { error, value } = deploymentSchema.validate({
      tier: options.tier,
      client: options.client,
      token: options.token,
      customDomain: options.customDomain,
      integrationConfig: options.integrationConfig
    });

    if (error) {
      console.error('❌ Validation Error:', error.details[0].message);
      process.exit(1);
    }

    // Additional validations
    await validateNotionToken(value.token);
    await validateTierConfiguration(value.tier);
    await validateClientName(value.client);
    
    if (value.integrationConfig) {
      await validateIntegrationConfig(value.integrationConfig, value.tier);
    }

    console.log('✅ All inputs validated successfully');
    console.log(`📊 Configuration: ${value.tier} tier for ${value.client}`);
    
    return value;
  } catch (err) {
    console.error('❌ Validation failed:', err.message);
    process.exit(1);
  }
}

async function validateNotionToken(token) {
  console.log('🔑 Validating Notion token format...');
  
  if (!token.startsWith('secret_')) {
    throw new Error('Notion token must start with "secret_"');
  }
  
  if (token.length !== 50) {
    throw new Error('Notion token must be exactly 50 characters long');
  }
  
  console.log('✅ Notion token format is valid');
}

async function validateTierConfiguration(tier) {
  console.log(`🏗️ Validating ${tier} tier configuration...`);
  
  const config = tierConfigurations[tier];
  if (!config) {
    throw new Error(`Unknown tier: ${tier}`);
  }
  
  console.log(`✅ ${tier} tier configuration:`, {
    maxProjects: config.maxProjects === -1 ? 'unlimited' : config.maxProjects,
    maxUsers: config.maxUsers === -1 ? 'unlimited' : config.maxUsers,
    features: config.features.length,
    integrations: config.integrations.length
  });
}

async function validateClientName(client) {
  console.log('🏢 Validating client name...');
  
  // Check for potentially problematic characters
  const problematicChars = /[<>:"/\\|?*]/;
  if (problematicChars.test(client)) {
    throw new Error('Client name contains invalid characters');
  }
  
  // Check for reserved words
  const reservedWords = ['notion', 'template', 'system', 'admin', 'api'];
  if (reservedWords.includes(client.toLowerCase())) {
    throw new Error('Client name cannot be a reserved word');
  }
  
  console.log('✅ Client name is valid');
}

async function validateIntegrationConfig(configStr, tier) {
  console.log('🔌 Validating integration configuration...');
  
  try {
    const config = JSON.parse(configStr);
    const tierConfig = tierConfigurations[tier];
    
    for (const integration of Object.keys(config)) {
      if (!tierConfig.integrations.includes(integration)) {
        throw new Error(`Integration '${integration}' not available in ${tier} tier`);
      }
    }
    
    console.log('✅ Integration configuration is valid');
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('Integration configuration must be valid JSON');
    }
    throw err;
  }
}

// CLI setup
program
  .name('validate-inputs')
  .description('Validate inputs for construction template deployment')
  .requiredOption('--tier <tier>', 'Deployment tier (starter|professional|enterprise)')
  .requiredOption('--client <client>', 'Client/company name')
  .requiredOption('--token <token>', 'Notion integration token')
  .option('--custom-domain <domain>', 'Custom domain (optional)')
  .option('--integration-config <config>', 'Integration configuration JSON (optional)')
  .action(async (options) => {
    try {
      await validateInputs({
        tier: options.tier,
        client: options.client,
        token: options.token,
        customDomain: options.customDomain,
        integrationConfig: options.integrationConfig
      });
    } catch (error) {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

module.exports = { validateInputs, tierConfigurations };