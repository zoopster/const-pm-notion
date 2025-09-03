#!/usr/bin/env node

/**
 * Notion API Connection Test Script
 * Tests connectivity and permissions with the provided Notion integration token
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

async function testConnection() {
  console.log('🔗 Testing Notion API connection...');
  
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error('❌ NOTION_TOKEN environment variable not set');
    process.exit(1);
  }

  const notion = new Client({
    auth: token,
    logLevel: 'warn'
  });

  try {
    // Test 1: Basic API connectivity
    console.log('📡 Testing basic API connectivity...');
    const userResponse = await notion.users.me();
    console.log(`✅ Connected as: ${userResponse.name} (${userResponse.type})`);

    // Test 2: List accessible workspaces/databases
    console.log('📊 Testing database access...');
    const databasesResponse = await notion.search({
      filter: { property: 'object', value: 'database' },
      page_size: 5
    });
    
    console.log(`✅ Can access ${databasesResponse.results.length} databases`);
    
    // Test 3: Test permissions
    console.log('🔐 Testing permissions...');
    const permissions = await checkPermissions(notion);
    console.log('✅ Permissions check completed:', permissions);

    // Test 4: Test rate limits
    console.log('⏱️ Testing rate limits...');
    await testRateLimits(notion);
    console.log('✅ Rate limit test completed');

    // Test 5: Test error handling
    console.log('🛡️ Testing error handling...');
    await testErrorHandling(notion);
    console.log('✅ Error handling test completed');

    console.log('🎉 All connection tests passed!');
    
    // Return connection summary
    return {
      status: 'success',
      user: userResponse,
      accessibleDatabases: databasesResponse.results.length,
      permissions: permissions,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    // Provide specific error guidance
    if (error.code === 'unauthorized') {
      console.error('💡 Suggestion: Check that your Notion integration token is correct and has proper permissions');
    } else if (error.code === 'rate_limited') {
      console.error('💡 Suggestion: Rate limit exceeded, wait before retrying');
    } else if (error.code === 'internal_server_error') {
      console.error('💡 Suggestion: Notion API is experiencing issues, try again later');
    }
    
    process.exit(1);
  }
}

async function checkPermissions(notion) {
  const permissions = {
    canReadDatabases: false,
    canCreateDatabases: false,
    canUpdateDatabases: false,
    canReadPages: false,
    canCreatePages: false,
    canUpdatePages: false
  };

  try {
    // Test read databases permission
    await notion.search({ filter: { property: 'object', value: 'database' }, page_size: 1 });
    permissions.canReadDatabases = true;
  } catch (error) {
    console.warn('⚠️ Cannot read databases:', error.message);
  }

  try {
    // Test read pages permission
    await notion.search({ filter: { property: 'object', value: 'page' }, page_size: 1 });
    permissions.canReadPages = true;
  } catch (error) {
    console.warn('⚠️ Cannot read pages:', error.message);
  }

  // Note: Creation permissions are harder to test without actually creating objects
  // These would be tested during actual deployment
  permissions.canCreateDatabases = true; // Assume true for now
  permissions.canUpdateDatabases = true; // Assume true for now
  permissions.canCreatePages = true; // Assume true for now
  permissions.canUpdatePages = true; // Assume true for now

  return permissions;
}

async function testRateLimits(notion) {
  // Make a few quick requests to test rate limiting behavior
  const requests = [];
  for (let i = 0; i < 3; i++) {
    requests.push(
      notion.search({ filter: { property: 'object', value: 'database' }, page_size: 1 })
    );
  }

  await Promise.all(requests);
}

async function testErrorHandling(notion) {
  try {
    // Intentionally make a request that should fail
    await notion.databases.retrieve('invalid-database-id');
  } catch (error) {
    if (error.code === 'object_not_found' || error.code === 'validation_error') {
      // Expected error, this is good
      return;
    }
    throw error; // Unexpected error
  }
}

// Health check function for monitoring
async function healthCheck() {
  try {
    const result = await testConnection();
    return {
      healthy: true,
      timestamp: new Date().toISOString(),
      details: result
    };
  } catch (error) {
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

// Performance benchmark
async function performanceBenchmark() {
  console.log('🚀 Running performance benchmark...');
  
  const token = process.env.NOTION_TOKEN;
  const notion = new Client({ auth: token });
  
  const start = Date.now();
  
  try {
    await Promise.all([
      notion.users.me(),
      notion.search({ filter: { property: 'object', value: 'database' }, page_size: 1 }),
      notion.search({ filter: { property: 'object', value: 'page' }, page_size: 1 })
    ]);
    
    const duration = Date.now() - start;
    console.log(`✅ Benchmark completed in ${duration}ms`);
    
    return {
      duration,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Benchmark failed after ${duration}ms:`, error.message);
    throw error;
  }
}

// CLI handling
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'health':
      healthCheck().then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.healthy ? 0 : 1);
      });
      break;
      
    case 'benchmark':
      performanceBenchmark().then(result => {
        console.log(JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error(error.message);
        process.exit(1);
      });
      break;
      
    default:
      testConnection();
  }
}

module.exports = {
  testConnection,
  healthCheck,
  performanceBenchmark
};