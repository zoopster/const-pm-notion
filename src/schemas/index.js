/**
 * Schema validation module
 * Contains Joi schemas for validating construction project data
 */

const Joi = require('joi');

// Project schema
const projectSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  startDate: Joi.date(),
  endDate: Joi.date(),
  status: Joi.string().valid('Planning', 'In Progress', 'On Hold', 'Completed'),
  budget: Joi.number().positive(),
  contractor: Joi.string(),
});

// Task schema
const taskSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  assignee: Joi.string(),
  dueDate: Joi.date(),
  status: Joi.string().valid('Not Started', 'In Progress', 'Completed'),
  priority: Joi.string().valid('Low', 'Medium', 'High'),
});

// Material schema
const materialSchema = Joi.object({
  name: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().required(),
  costPerUnit: Joi.number().positive(),
  supplier: Joi.string(),
});

module.exports = {
  projectSchema,
  taskSchema,
  materialSchema,
};