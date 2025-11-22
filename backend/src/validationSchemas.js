const Joi = require('joi');

// Company info validation for creation (all required fields)
const companySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(), 
  industry: Joi.string().min(2).max(50).required(),
  size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').required(),
  email: Joi.string().email().required(),
  website: Joi.string().uri().optional(), 
  description: Joi.string().max(2000).optional(), 
  employeesCount: Joi.number().integer().min(1).optional(), 
  foundedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  officeAddress: Joi.object({
    street: Joi.string().optional(),
    ward: Joi.string().optional(),
    district: Joi.string().optional(),
    city: Joi.string().optional(),
    country: Joi.string().default('Vietnam').optional(),
  }).optional(),
}).unknown(false); // Reject unknown fields explicitly

// Company info validation for update (all fields optional for partial updates)
const companyUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(), 
  industry: Joi.string().min(2).max(50).optional(),
  size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').optional(),
  email: Joi.string().email().optional(),
  website: Joi.string().uri().optional(), 
  description: Joi.string().max(2000).optional(), 
  employeesCount: Joi.number().integer().min(1).optional(), 
  foundedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  officeAddress: Joi.object({
    street: Joi.string().optional(),
    ward: Joi.string().optional(),
    district: Joi.string().optional(),
    city: Joi.string().optional(),
    country: Joi.string().default('Vietnam').optional(),
  }).optional(),
}).unknown(false); // Reject unknown fields explicitly



// Business info schema for full validation (when creating new)
const businessInfoSchema = Joi.object({
  registrationNumber: Joi.string().required(),
  taxId: Joi.string().required(),
  issueDate: Joi.date().iso().required(),
  issuePlace: Joi.string().required(),
  address: Joi.object({
    street: Joi.string().required(),
    ward: Joi.string().required(),
    district: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().default('Vietnam'),
  }).required(),
});

// Business info schema for partial update (all fields optional)
const businessInfoUpdateSchema = Joi.object({
  registrationNumber: Joi.string().optional(),
  taxId: Joi.string().optional(),
  issueDate: Joi.date().iso().optional(),
  issuePlace: Joi.string().optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    ward: Joi.string().optional(),
    district: Joi.string().optional(),
    city: Joi.string().optional(),
    country: Joi.string().default('Vietnam').optional(),
  }).optional(),
});

// Legal representative validation
const legalRepresentativeSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  position: Joi.string().min(2).max(50).required(),
  phone: Joi.string().min(8).max(15).required(),
  email: Joi.string().email().required(),
  identityCard: Joi.string().optional(),
  address: Joi.string().optional(),
});

// Position validation
const positionSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  level: Joi.string().min(2).max(50).required(),
  department: Joi.string().min(2).max(100).required(),
});

// Contact validation
const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(8).max(15).required(),
  email: Joi.string().email().required(),
});

module.exports = {
  companySchema,
  companyUpdateSchema,
  businessInfoSchema,
  businessInfoUpdateSchema,
  legalRepresentativeSchema,
  positionSchema,
  contactSchema,
};
