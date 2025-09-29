const Joi = require('joi');

// Company info validation
const companySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(), 
  industry: Joi.string().min(2).max(50).required(),
  size: Joi.string().valid('small', 'medium', 'large').required(),
  email: Joi.string().email().required(),
  website: Joi.string().uri().optional(), 
  description: Joi.string().max(500).optional(), 
  employeesCount: Joi.number().integer().min(1).optional(), 
  foundedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(), 
});

// Business info validation
const businessInfoSchema = Joi.object({
  registrationNumber: Joi.string().min(5).max(50).required(), 
  taxId: Joi.string().min(5).max(50).required(),
  address: Joi.object({
    street: Joi.string().required(),
    ward: Joi.string().required(),
    district: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  establishedDate: Joi.date().optional(), 
  registrationDate: Joi.date().optional(), 
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
  businessInfoSchema,
  legalRepresentativeSchema,
  positionSchema,
  contactSchema,
};
