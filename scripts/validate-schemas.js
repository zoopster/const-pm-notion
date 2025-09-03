#!/usr/bin/env node

/**
 * Schema Validation Script
 * Validates all database schemas for consistency and correctness
 */

const fs = require('fs').promises;
const path = require('path');
const Joi = require('joi');

// Schema validation rules
const notionPropertySchema = Joi.object({
  type: Joi.string().valid(
    'title', 'rich_text', 'number', 'select', 'multi_select',
    'date', 'people', 'files', 'checkbox', 'url', 'email',
    'phone_number', 'formula', 'relation', 'rollup', 'created_time',
    'created_by', 'last_edited_time', 'last_edited_by'
  ).required(),
  options: Joi.array().when('type', {
    is: Joi.string().valid('select', 'multi_select'),
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});

const databaseSchemaStructure = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  properties: Joi.object().pattern(
    Joi.string(),
    notionPropertySchema
  ).required(),
  tier: Joi.string().valid('starter', 'professional', 'enterprise').optional(),
  required: Joi.array().items(Joi.string()).optional(),
  relationships: Joi.array().items(Joi.object({
    target: Joi.string().required(),
    type: Joi.string().valid('one-to-many', 'many-to-many', 'one-to-one').required()
  })).optional()
});

async function validateSchemas() {
  console.log('🔍 Starting schema validation...');
  
  const schemasPath = path.join(process.cwd(), 'src', 'schemas', 'databases');
  let schemaFiles = [];
  let validationResults = {
    total: 0,
    valid: 0,
    invalid: 0,
    errors: []
  };
  
  try {
    // Get all schema files
    const files = await fs.readdir(schemasPath);
    schemaFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`📊 Found ${schemaFiles.length} schema files to validate`);
    
    // Validate each schema
    for (const file of schemaFiles) {
      const result = await validateSingleSchema(path.join(schemasPath, file));
      validationResults.total++;
      
      if (result.valid) {
        validationResults.valid++;
        console.log(`✅ ${file}: Valid`);
      } else {
        validationResults.invalid++;
        console.log(`❌ ${file}: Invalid`);
        validationResults.errors.push({
          file,
          errors: result.errors
        });
      }
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('⚠️ Schemas directory not found, validating default schemas...');
      await validateDefaultSchemas();
      return;
    }
    throw error;
  }
  
  // Validate relationships between schemas
  await validateSchemaRelationships(schemasPath, schemaFiles);
  
  // Print summary
  console.log('\n📋 Validation Summary:');
  console.log(`   Total schemas: ${validationResults.total}`);
  console.log(`   Valid: ${validationResults.valid}`);
  console.log(`   Invalid: ${validationResults.invalid}`);
  
  if (validationResults.errors.length > 0) {
    console.log('\n❌ Validation Errors:');
    validationResults.errors.forEach(error => {
      console.log(`\n   File: ${error.file}`);
      error.errors.forEach(err => {
        console.log(`     - ${err}`);
      });
    });
  }
  
  if (validationResults.invalid > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All schemas are valid!');
  }
  
  return validationResults;
}

async function validateSingleSchema(filePath) {
  const fileName = path.basename(filePath);
  const result = { valid: false, errors: [] };
  
  try {
    // Read and parse schema file
    const content = await fs.readFile(filePath, 'utf8');
    let schema;
    
    try {
      schema = JSON.parse(content);
    } catch (parseError) {
      result.errors.push(`Invalid JSON: ${parseError.message}`);
      return result;
    }
    
    // Validate against Joi schema
    const { error } = databaseSchemaStructure.validate(schema, { abortEarly: false });
    if (error) {
      error.details.forEach(detail => {
        result.errors.push(detail.message);
      });
      return result;
    }
    
    // Additional custom validations
    await performCustomValidations(schema, result, fileName);
    
    result.valid = result.errors.length === 0;
    return result;
    
  } catch (error) {
    result.errors.push(`File read error: ${error.message}`);
    return result;
  }
}

async function performCustomValidations(schema, result, fileName) {
  // Check for required construction fields
  if (fileName.includes('project')) {
    const requiredProjectFields = ['Name', 'Status', 'Budget', 'Start Date'];
    const schemaFields = Object.keys(schema.properties);
    
    requiredProjectFields.forEach(field => {
      if (!schemaFields.some(f => f.toLowerCase().includes(field.toLowerCase()))) {
        result.errors.push(`Missing required project field: ${field}`);
      }
    });
  }
  
  // Validate status field options for consistency
  Object.entries(schema.properties).forEach(([propName, propDef]) => {
    if (propName.toLowerCase().includes('status') && propDef.type === 'select') {
      const validStatuses = ['Not Started', 'Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
      if (propDef.options) {
        propDef.options.forEach(option => {
          if (!validStatuses.includes(option)) {
            result.errors.push(`Non-standard status option: ${option} in ${propName}`);
          }
        });
      }
    }
  });
  
  // Check for proper naming conventions
  Object.keys(schema.properties).forEach(propName => {
    if (propName !== propName.trim()) {
      result.errors.push(`Property name has leading/trailing whitespace: "${propName}"`);
    }
    
    if (propName.length > 50) {
      result.errors.push(`Property name too long (${propName.length} chars): ${propName}`);
    }
  });
}

async function validateSchemaRelationships(schemasPath, schemaFiles) {
  console.log('\n🔗 Validating schema relationships...');
  
  const schemas = {};
  
  // Load all schemas
  for (const file of schemaFiles) {
    const content = await fs.readFile(path.join(schemasPath, file), 'utf8');
    const schema = JSON.parse(content);
    const name = file.replace('.json', '');
    schemas[name] = schema;
  }
  
  // Check relationships
  Object.entries(schemas).forEach(([schemaName, schema]) => {
    if (schema.relationships) {
      schema.relationships.forEach(rel => {
        if (!schemas[rel.target]) {
          console.warn(`⚠️ ${schemaName}: Referenced schema "${rel.target}" not found`);
        } else {
          console.log(`✅ ${schemaName} -> ${rel.target}: Valid relationship`);
        }
      });
    }
  });
}

async function validateDefaultSchemas() {
  console.log('🔧 Validating built-in default schemas...');
  
  const defaultSchemas = {
    projects: {
      title: 'Projects',
      properties: {
        'Name': { type: 'title' },
        'Status': { 
          type: 'select', 
          options: ['Planning', 'In Progress', 'Completed', 'On Hold'] 
        },
        'Budget': { type: 'number' },
        'Start Date': { type: 'date' },
        'Client': { type: 'rich_text' }
      }
    },
    tasks: {
      title: 'Tasks',
      properties: {
        'Name': { type: 'title' },
        'Status': { 
          type: 'select', 
          options: ['Not Started', 'In Progress', 'Completed'] 
        },
        'Priority': { 
          type: 'select', 
          options: ['Low', 'Normal', 'High', 'Critical'] 
        },
        'Due Date': { type: 'date' },
        'Assigned To': { type: 'people' }
      }
    }
  };
  
  let allValid = true;
  
  Object.entries(defaultSchemas).forEach(([name, schema]) => {
    const { error } = databaseSchemaStructure.validate(schema);
    if (error) {
      console.log(`❌ Default schema ${name} is invalid:`, error.message);
      allValid = false;
    } else {
      console.log(`✅ Default schema ${name} is valid`);
    }
  });
  
  if (!allValid) {
    process.exit(1);
  }
}

async function validateConfigurationFiles() {
  console.log('\n⚙️ Validating configuration files...');
  
  const configPath = path.join(process.cwd(), 'configs');
  const tiers = ['starter', 'professional', 'enterprise'];
  
  for (const tier of tiers) {
    const configFile = path.join(configPath, `${tier}.json`);
    
    try {
      const content = await fs.readFile(configFile, 'utf8');
      const config = JSON.parse(content);
      
      // Validate configuration structure
      const requiredFields = ['databases', 'features', 'limits'];
      const missingFields = requiredFields.filter(field => !config[field]);
      
      if (missingFields.length > 0) {
        console.log(`❌ ${tier}.json missing fields: ${missingFields.join(', ')}`);
      } else {
        console.log(`✅ ${tier}.json is valid`);
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`⚠️ Configuration file not found: ${tier}.json`);
      } else {
        console.log(`❌ Error validating ${tier}.json: ${error.message}`);
      }
    }
  }
}

// Generate validation report
async function generateValidationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    schemas: {},
    summary: {
      totalSchemas: 0,
      validSchemas: 0,
      invalidSchemas: 0,
      warnings: []
    }
  };
  
  // This would be expanded to include detailed validation results
  await fs.writeFile(
    path.join(process.cwd(), 'validation-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('📄 Validation report saved to validation-report.json');
}

// CLI execution
if (require.main === module) {
  validateSchemas()
    .then(() => validateConfigurationFiles())
    .then(() => generateValidationReport())
    .catch(error => {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  validateSchemas,
  validateSingleSchema,
  validateConfigurationFiles
};