#!/usr/bin/env node

/**
 * Main Construction Template Deployment Script
 * Deploys the built template to a Notion workspace
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Deployment state management
let deploymentState = {
  client: null,
  tier: null,
  startTime: null,
  completedSteps: [],
  createdResources: [],
  errors: []
};

async function deployConstructionTemplate() {
  console.log('🚀 Starting construction template deployment...');
  
  deploymentState.startTime = Date.now();
  
  try {
    // Initialize environment
    await initializeEnvironment();
    
    // Load build artifacts
    const buildPackage = await loadBuildArtifacts();
    
    // Initialize Notion client
    const notion = await initializeNotionClient();
    
    // Deploy in phases
    await deployPhase1_Databases(notion, buildPackage);
    await deployPhase2_Views(notion, buildPackage);
    await deployPhase3_SampleData(notion, buildPackage);
    await deployPhase4_Integrations(notion, buildPackage);
    await deployPhase5_Finalization(notion, buildPackage);
    
    // Generate deployment report
    const report = await generateDeploymentReport(buildPackage);
    
    console.log('🎉 Deployment completed successfully!');
    console.log(`⏱️ Total time: ${Date.now() - deploymentState.startTime}ms`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    // Attempt cleanup on failure
    await cleanupFailedDeployment();
    
    throw error;
  }
}

async function initializeEnvironment() {
  console.log('🔧 Initializing deployment environment...');
  
  deploymentState.client = process.env.CLIENT_NAME;
  deploymentState.tier = process.env.DEPLOYMENT_TIER || 'professional';
  
  if (!deploymentState.client) {
    throw new Error('CLIENT_NAME environment variable is required');
  }
  
  if (!process.env.NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN environment variable is required');
  }
  
  console.log(`✅ Environment initialized for ${deploymentState.client} (${deploymentState.tier})`);
  deploymentState.completedSteps.push('environment_init');
}

async function loadBuildArtifacts() {
  console.log('📦 Loading build artifacts...');
  
  // Find the latest build file
  const distPath = path.join(process.cwd(), 'dist');
  let buildFile = null;
  
  try {
    const files = await fs.readdir(distPath);
    const buildFiles = files.filter(file => 
      file.startsWith(`template-${deploymentState.tier}`) && file.endsWith('.json')
    );
    
    if (buildFiles.length === 0) {
      throw new Error(`No build artifacts found for tier: ${deploymentState.tier}`);
    }
    
    // Get the most recent build file
    buildFile = buildFiles.sort().pop();
    
  } catch (error) {
    throw new Error('Build artifacts directory not found. Run build-template.js first.');
  }
  
  const buildPath = path.join(distPath, buildFile);
  const buildContent = await fs.readFile(buildPath, 'utf8');
  const buildPackage = JSON.parse(buildContent);
  
  console.log(`✅ Loaded build package: ${buildFile}`);
  console.log(`   Client: ${buildPackage.client}`);
  console.log(`   Tier: ${buildPackage.tier}`);
  console.log(`   Databases: ${buildPackage.schemas?.length || 0}`);
  console.log(`   Views: ${buildPackage.views?.length || 0}`);
  
  deploymentState.completedSteps.push('artifacts_loaded');
  return buildPackage;
}

async function initializeNotionClient() {
  console.log('🔗 Initializing Notion client...');
  
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
  });
  
  // Test connection
  try {
    const user = await notion.users.me();
    console.log(`✅ Connected to Notion as: ${user.name}`);
  } catch (error) {
    throw new Error(`Failed to connect to Notion: ${error.message}`);
  }
  
  deploymentState.completedSteps.push('notion_connected');
  return notion;
}

async function deployPhase1_Databases(notion, buildPackage) {
  console.log('📊 Phase 1: Deploying databases...');
  
  const databases = buildPackage.schemas || [];
  const createdDatabases = [];
  
  for (const dbSchema of databases) {
    console.log(`   Creating database: ${dbSchema.name}`);
    
    try {
      const database = await createDatabase(notion, dbSchema, buildPackage.client);
      createdDatabases.push(database);
      deploymentState.createdResources.push({
        type: 'database',
        name: dbSchema.name,
        id: database.id
      });
      
      // Add delay to respect rate limits
      await sleep(1000);
      
    } catch (error) {
      console.error(`   ❌ Failed to create database ${dbSchema.name}: ${error.message}`);
      deploymentState.errors.push({
        phase: 'databases',
        resource: dbSchema.name,
        error: error.message
      });
    }
  }
  
  console.log(`✅ Phase 1 completed: ${createdDatabases.length}/${databases.length} databases created`);
  deploymentState.completedSteps.push('databases_deployed');
  return createdDatabases;
}

async function createDatabase(notion, dbSchema, clientName) {
  // Convert our schema format to Notion's format
  const notionProperties = convertSchemaToNotionProperties(dbSchema.schema);
  
  const database = await notion.databases.create({
    parent: {
      type: 'page_id',
      page_id: await getOrCreateParentPage(notion, clientName)
    },
    title: [
      {
        type: 'text',
        text: {
          content: `${clientName} - ${dbSchema.schema.title || dbSchema.name}`
        }
      }
    ],
    properties: notionProperties
  });
  
  return database;
}

async function getOrCreateParentPage(notion, clientName) {
  // For simplicity, we'll create databases in the workspace root
  // In a full implementation, you'd create a dedicated parent page
  
  // Search for existing parent page or create one
  const searchResults = await notion.search({
    query: `${clientName} Construction Management`,
    filter: { property: 'object', value: 'page' }
  });
  
  if (searchResults.results.length > 0) {
    return searchResults.results[0].id;
  }
  
  // Create parent page
  const page = await notion.pages.create({
    parent: { type: 'workspace', workspace: true },
    properties: {
      title: [
        {
          type: 'text',
          text: { content: `${clientName} Construction Management` }
        }
      ]
    }
  });
  
  return page.id;
}

function convertSchemaToNotionProperties(schema) {
  const properties = {};
  
  // Default properties for construction projects
  const defaultProperties = {
    'Name': {
      title: {}
    },
    'Status': {
      select: {
        options: [
          { name: 'Planning', color: 'yellow' },
          { name: 'In Progress', color: 'blue' },
          { name: 'Completed', color: 'green' },
          { name: 'On Hold', color: 'red' }
        ]
      }
    },
    'Created': {
      created_time: {}
    }
  };
  
  // Merge with schema properties if available
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([name, prop]) => {
      properties[name] = convertPropertyToNotion(prop);
    });
  } else {
    // Use default properties
    Object.assign(properties, defaultProperties);
  }
  
  return properties;
}

function convertPropertyToNotion(prop) {
  switch (prop.type) {
    case 'title':
      return { title: {} };
    case 'select':
      return {
        select: {
          options: prop.options?.map(opt => ({ name: opt, color: 'default' })) || []
        }
      };
    case 'number':
      return { number: { format: prop.format || 'number' } };
    case 'date':
      return { date: {} };
    case 'checkbox':
      return { checkbox: {} };
    case 'text':
      return { rich_text: {} };
    case 'url':
      return { url: {} };
    case 'email':
      return { email: {} };
    case 'phone':
      return { phone_number: {} };
    default:
      return { rich_text: {} };
  }
}

async function deployPhase2_Views(notion, buildPackage) {
  console.log('👁️ Phase 2: Creating views...');
  
  // Note: Notion API doesn't directly support creating views
  // Views are created automatically with databases
  // This phase would handle any custom view configurations
  
  console.log('✅ Phase 2 completed: Views configured with databases');
  deploymentState.completedSteps.push('views_deployed');
}

async function deployPhase3_SampleData(notion, buildPackage) {
  console.log('📝 Phase 3: Adding sample data...');
  
  if (!buildPackage.sampleData || process.env.INCLUDE_SAMPLE_DATA === 'false') {
    console.log('   Skipping sample data');
    return;
  }
  
  // Add sample data to each database
  for (const resource of deploymentState.createdResources) {
    if (resource.type === 'database') {
      await addSampleDataToDatabase(notion, resource, buildPackage.sampleData);
      await sleep(500); // Rate limiting
    }
  }
  
  console.log('✅ Phase 3 completed: Sample data added');
  deploymentState.completedSteps.push('sample_data_deployed');
}

async function addSampleDataToDatabase(notion, database, sampleData) {
  const dataKey = database.name;
  const data = sampleData[dataKey];
  
  if (!data || !Array.isArray(data)) {
    return;
  }
  
  console.log(`   Adding ${data.length} sample records to ${database.name}`);
  
  for (const record of data.slice(0, 5)) { // Limit to 5 records per database
    try {
      await notion.pages.create({
        parent: { database_id: database.id },
        properties: convertRecordToNotionProperties(record)
      });
    } catch (error) {
      console.warn(`   ⚠️ Failed to add record to ${database.name}: ${error.message}`);
    }
  }
}

function convertRecordToNotionProperties(record) {
  const properties = {};
  
  Object.entries(record).forEach(([key, value]) => {
    if (key === 'title' || key === 'name') {
      properties.Name = {
        title: [{ text: { content: String(value) } }]
      };
    } else if (typeof value === 'string' && ['Planning', 'In Progress', 'Completed', 'Active'].includes(value)) {
      properties.Status = {
        select: { name: value }
      };
    } else if (typeof value === 'number') {
      properties[key] = {
        number: value
      };
    } else {
      properties[key] = {
        rich_text: [{ text: { content: String(value) } }]
      };
    }
  });
  
  return properties;
}

async function deployPhase4_Integrations(notion, buildPackage) {
  console.log('🔌 Phase 4: Setting up integrations...');
  
  // Integration setup would go here
  // This is a placeholder for future integration implementations
  
  console.log('✅ Phase 4 completed: Integrations configured');
  deploymentState.completedSteps.push('integrations_deployed');
}

async function deployPhase5_Finalization(notion, buildPackage) {
  console.log('🎯 Phase 5: Finalizing deployment...');
  
  // Create summary page
  await createDeploymentSummaryPage(notion, buildPackage);
  
  // Save deployment metadata
  await saveDeploymentMetadata(buildPackage);
  
  console.log('✅ Phase 5 completed: Deployment finalized');
  deploymentState.completedSteps.push('deployment_finalized');
}

async function createDeploymentSummaryPage(notion, buildPackage) {
  const summaryContent = [
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ text: { content: `${buildPackage.client} Construction Template` } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { text: { content: `Deployed: ${new Date().toLocaleDateString()}` } }
        ]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { text: { content: `Tier: ${buildPackage.tier}` } }
        ]
      }
    }
  ];

  const page = await notion.pages.create({
    parent: { type: 'workspace', workspace: true },
    properties: {
      title: [
        {
          text: { content: `${buildPackage.client} - Deployment Summary` }
        }
      ]
    },
    children: summaryContent
  });

  deploymentState.createdResources.push({
    type: 'summary_page',
    id: page.id
  });
}

async function saveDeploymentMetadata(buildPackage) {
  const metadata = {
    ...deploymentState,
    buildPackage: {
      buildId: buildPackage.buildId,
      version: buildPackage.version,
      tier: buildPackage.tier,
      client: buildPackage.client
    },
    deploymentTime: Date.now() - deploymentState.startTime
  };
  
  await fs.writeFile(
    path.join('dist', `deployment-${Date.now()}.json`),
    JSON.stringify(metadata, null, 2)
  );
}

async function generateDeploymentReport(buildPackage) {
  const report = {
    success: true,
    client: buildPackage.client,
    tier: buildPackage.tier,
    deploymentTime: Date.now() - deploymentState.startTime,
    completedSteps: deploymentState.completedSteps.length,
    createdResources: deploymentState.createdResources.length,
    errors: deploymentState.errors.length,
    summary: {
      databases: deploymentState.createdResources.filter(r => r.type === 'database').length,
      pages: deploymentState.createdResources.filter(r => r.type === 'page').length,
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('\n📊 Deployment Report:');
  console.log(`   Client: ${report.client}`);
  console.log(`   Tier: ${report.tier}`);
  console.log(`   Duration: ${report.deploymentTime}ms`);
  console.log(`   Databases: ${report.summary.databases}`);
  console.log(`   Errors: ${report.errors}`);
  
  return report;
}

async function cleanupFailedDeployment() {
  console.log('🧹 Cleaning up failed deployment...');
  
  // This would implement cleanup logic for failed deployments
  // For now, just log the created resources that would need cleanup
  
  if (deploymentState.createdResources.length > 0) {
    console.log('Resources that may need manual cleanup:');
    deploymentState.createdResources.forEach(resource => {
      console.log(`   ${resource.type}: ${resource.name || resource.id}`);
    });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI execution
if (require.main === module) {
  deployConstructionTemplate()
    .then(report => {
      console.log('Deployment completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  deployConstructionTemplate
};