#!/usr/bin/env node

/**
 * Template Builder Script
 * Builds and configures construction templates based on tier and client requirements
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

// Template configurations
const templateConfigs = {
  starter: {
    databases: [
      'projects',
      'tasks', 
      'clients',
      'documents',
      'team-members'
    ],
    views: [
      'active-projects',
      'pending-tasks',
      'client-overview',
      'recent-documents'
    ],
    features: [
      'basic-project-tracking',
      'task-management',
      'client-contact-management',
      'document-storage'
    ]
  },
  professional: {
    databases: [
      'projects',
      'tasks',
      'clients', 
      'documents',
      'team-members',
      'materials',
      'vendors',
      'budgets',
      'expenses',
      'schedules'
    ],
    views: [
      'project-dashboard',
      'task-kanban',
      'client-portal',
      'material-inventory',
      'vendor-directory',
      'budget-tracking',
      'expense-reports',
      'project-timeline'
    ],
    features: [
      'all-starter-features',
      'material-management',
      'vendor-management',
      'budget-tracking',
      'expense-management',
      'project-scheduling',
      'reporting-dashboard'
    ]
  },
  enterprise: {
    databases: [
      'projects',
      'tasks',
      'clients',
      'documents',
      'team-members',
      'materials',
      'vendors',
      'budgets',
      'expenses',
      'schedules',
      'portfolios',
      'contracts',
      'reports',
      'integrations',
      'automations'
    ],
    views: [
      'portfolio-overview',
      'project-dashboard',
      'task-kanban',
      'client-portal',
      'material-inventory',
      'vendor-directory',
      'budget-tracking',
      'expense-reports',
      'project-timeline',
      'contract-management',
      'analytics-dashboard',
      'integration-hub'
    ],
    features: [
      'all-professional-features',
      'portfolio-management',
      'contract-management',
      'advanced-analytics',
      'custom-integrations',
      'workflow-automation',
      'multi-project-tracking',
      'enterprise-reporting'
    ]
  }
};

async function buildTemplate(options) {
  console.log(`🏗️ Building ${options.tier} template for ${options.client}...`);
  
  const startTime = Date.now();
  const buildId = `build-${Date.now()}`;
  
  try {
    // Ensure dist directory exists
    await ensureDirectoryExists('dist');
    
    // Generate template configuration
    const templateConfig = await generateTemplateConfig(options);
    
    // Build database schemas
    const schemas = await buildDatabaseSchemas(options.tier);
    
    // Build view configurations
    const views = await buildViewConfigurations(options.tier);
    
    // Generate sample data if requested
    let sampleData = null;
    if (options.sampleData) {
      sampleData = await generateSampleData(options.tier, options.client);
    }
    
    // Build integration configurations
    const integrations = await buildIntegrationConfigs(options.tier);
    
    // Generate documentation
    const documentation = await generateDocumentation(options);
    
    // Create final build package
    const buildPackage = {
      buildId,
      timestamp: new Date().toISOString(),
      client: options.client,
      tier: options.tier,
      version: getPackageVersion(),
      config: templateConfig,
      schemas,
      views,
      sampleData,
      integrations,
      documentation,
      metadata: {
        buildDuration: Date.now() - startTime,
        includedFeatures: templateConfigs[options.tier].features.length,
        databaseCount: schemas.length,
        viewCount: views.length
      }
    };
    
    // Save build package
    const buildPath = path.join('dist', `template-${options.tier}-${buildId}.json`);
    await fs.writeFile(buildPath, JSON.stringify(buildPackage, null, 2));
    
    // Save individual components
    await saveBuildComponents(buildPackage);
    
    console.log(`✅ Template built successfully in ${Date.now() - startTime}ms`);
    console.log(`📦 Build package: ${buildPath}`);
    console.log(`🏢 Client: ${options.client}`);
    console.log(`🎯 Tier: ${options.tier}`);
    console.log(`📊 Features: ${buildPackage.metadata.includedFeatures}`);
    
    return buildPackage;
    
  } catch (error) {
    console.error('❌ Template build failed:', error.message);
    throw error;
  }
}

async function generateTemplateConfig(options) {
  const config = {
    client: options.client,
    tier: options.tier,
    includeSampleData: options.sampleData,
    customizations: {
      branding: {
        companyName: options.client,
        logo: null, // To be added during deployment
        colorScheme: 'construction-blue'
      },
      settings: {
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        measurementUnit: 'imperial'
      }
    },
    features: templateConfigs[options.tier].features,
    databases: templateConfigs[options.tier].databases,
    views: templateConfigs[options.tier].views
  };
  
  return config;
}

async function buildDatabaseSchemas(tier) {
  console.log(`📊 Building database schemas for ${tier} tier...`);
  
  const schemas = [];
  const baseSchemasPath = path.join(__dirname, '..', 'src', 'schemas', 'databases');
  
  // Load base schemas
  try {
    const files = await fs.readdir(baseSchemasPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const schemaPath = path.join(baseSchemasPath, file);
      const schemaContent = await fs.readFile(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Include schema if it's in the tier configuration
      const schemaName = file.replace('.json', '');
      if (templateConfigs[tier].databases.includes(schemaName)) {
        schemas.push({
          name: schemaName,
          schema: schema,
          tier: tier
        });
      }
    }
  } catch (error) {
    console.warn('⚠️ Schema directory not found, using default schemas');
    // Generate basic schemas
    schemas.push(...generateDefaultSchemas(tier));
  }
  
  console.log(`✅ Built ${schemas.length} database schemas`);
  return schemas;
}

async function buildViewConfigurations(tier) {
  console.log(`👁️ Building view configurations for ${tier} tier...`);
  
  const views = [];
  const tierViews = templateConfigs[tier].views;
  
  for (const viewName of tierViews) {
    const view = {
      name: viewName,
      type: getViewType(viewName),
      configuration: generateViewConfig(viewName, tier),
      databases: getViewDatabases(viewName)
    };
    
    views.push(view);
  }
  
  console.log(`✅ Built ${views.length} view configurations`);
  return views;
}

function getViewType(viewName) {
  if (viewName.includes('kanban')) return 'kanban';
  if (viewName.includes('timeline') || viewName.includes('schedule')) return 'timeline';
  if (viewName.includes('dashboard') || viewName.includes('overview')) return 'table';
  if (viewName.includes('calendar')) return 'calendar';
  return 'table';
}

function generateViewConfig(viewName, tier) {
  // Basic view configuration - would be expanded based on requirements
  return {
    filters: [],
    sorts: [{ property: 'created_time', direction: 'descending' }],
    properties: ['title', 'status', 'created_time'],
    groupBy: viewName.includes('status') ? 'status' : null
  };
}

function getViewDatabases(viewName) {
  const databaseMappings = {
    'active-projects': ['projects'],
    'pending-tasks': ['tasks'],
    'client-overview': ['clients'],
    'project-dashboard': ['projects', 'tasks'],
    'task-kanban': ['tasks'],
    'material-inventory': ['materials'],
    'vendor-directory': ['vendors'],
    'budget-tracking': ['budgets'],
    'portfolio-overview': ['portfolios', 'projects']
  };
  
  return databaseMappings[viewName] || ['projects'];
}

async function generateSampleData(tier, client) {
  console.log(`📝 Generating sample data for ${tier} tier...`);
  
  const sampleData = {
    projects: generateSampleProjects(tier, client),
    tasks: generateSampleTasks(tier),
    clients: generateSampleClients(tier, client),
    materials: tier !== 'starter' ? generateSampleMaterials(tier) : null,
    vendors: tier === 'enterprise' || tier === 'professional' ? generateSampleVendors(tier) : null
  };
  
  // Filter out null values
  Object.keys(sampleData).forEach(key => {
    if (sampleData[key] === null) {
      delete sampleData[key];
    }
  });
  
  console.log(`✅ Generated sample data for ${Object.keys(sampleData).length} categories`);
  return sampleData;
}

function generateSampleProjects(tier, client) {
  const projectCount = tier === 'starter' ? 2 : tier === 'professional' ? 5 : 8;
  const projects = [];
  
  for (let i = 1; i <= projectCount; i++) {
    projects.push({
      title: `${client} Project ${i}`,
      status: i === 1 ? 'In Progress' : i === 2 ? 'Planning' : 'Not Started',
      type: 'Commercial Construction',
      budget: 100000 * i,
      startDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Sample construction project ${i} for ${client}`
    });
  }
  
  return projects;
}

function generateSampleTasks(tier) {
  const taskCount = tier === 'starter' ? 10 : tier === 'professional' ? 25 : 40;
  const tasks = [];
  
  const taskTypes = ['Foundation', 'Framing', 'Electrical', 'Plumbing', 'Roofing', 'Finishing'];
  
  for (let i = 1; i <= taskCount; i++) {
    tasks.push({
      title: `${taskTypes[i % taskTypes.length]} - Task ${i}`,
      status: i % 3 === 0 ? 'Completed' : i % 3 === 1 ? 'In Progress' : 'Not Started',
      priority: i % 4 === 0 ? 'High' : 'Normal',
      dueDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }
  
  return tasks;
}

function generateSampleClients(tier, client) {
  return [
    {
      name: client,
      type: 'Primary Client',
      contact: 'project@example.com',
      phone: '(555) 123-4567',
      status: 'Active'
    }
  ];
}

function generateSampleMaterials(tier) {
  return [
    { name: 'Concrete', unit: 'cubic yards', cost: 120, supplier: 'ABC Concrete' },
    { name: 'Steel Rebar', unit: 'tons', cost: 800, supplier: 'Steel Supply Co' },
    { name: '2x4 Lumber', unit: 'board feet', cost: 0.75, supplier: 'Lumber Depot' }
  ];
}

function generateSampleVendors(tier) {
  return [
    { name: 'ABC Concrete', type: 'Material Supplier', contact: 'orders@abcconcrete.com' },
    { name: 'Steel Supply Co', type: 'Material Supplier', contact: 'sales@steelsupply.com' },
    { name: 'Elite Electrical', type: 'Subcontractor', contact: 'jobs@eliteelectric.com' }
  ];
}

async function buildIntegrationConfigs(tier) {
  // Integration configurations would go here
  return [];
}

async function generateDocumentation(options) {
  return {
    setup: `Setup guide for ${options.tier} tier construction template`,
    features: `Feature documentation for ${options.client}`,
    api: 'API integration documentation',
    troubleshooting: 'Common issues and solutions'
  };
}

async function saveBuildComponents(buildPackage) {
  // Save schemas
  await ensureDirectoryExists('dist/schemas');
  for (const schema of buildPackage.schemas) {
    await fs.writeFile(
      path.join('dist/schemas', `${schema.name}.json`),
      JSON.stringify(schema, null, 2)
    );
  }
  
  // Save documentation
  await ensureDirectoryExists('dist/docs');
  await fs.writeFile(
    path.join('dist/docs', 'README.md'),
    `# ${buildPackage.client} Construction Template\n\nTier: ${buildPackage.tier}\nBuilt: ${buildPackage.timestamp}`
  );
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

function getPackageVersion() {
  try {
    const packageJson = require('../package.json');
    return packageJson.version;
  } catch (error) {
    return '1.0.0';
  }
}

function generateDefaultSchemas(tier) {
  // Fallback schemas if files don't exist
  return [
    {
      name: 'projects',
      schema: {
        title: 'Projects',
        properties: {
          'Name': { type: 'title' },
          'Status': { type: 'select', options: ['Planning', 'In Progress', 'Completed'] },
          'Budget': { type: 'number', format: 'dollar' }
        }
      },
      tier
    }
  ];
}

// CLI setup
program
  .name('build-template')
  .description('Build construction template for deployment')
  .requiredOption('--tier <tier>', 'Template tier (starter|professional|enterprise)')
  .requiredOption('--client <client>', 'Client/company name')
  .option('--sample-data <boolean>', 'Include sample data', 'true')
  .action(async (options) => {
    try {
      const sampleData = options.sampleData === 'true';
      const result = await buildTemplate({
        tier: options.tier,
        client: options.client,
        sampleData
      });
      
      console.log('✅ Build completed successfully');
      if (process.env.CI) {
        console.log(`BUILD_ID=${result.buildId}`);
      }
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

module.exports = {
  buildTemplate,
  templateConfigs
};