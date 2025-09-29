const { positionSchema, contactSchema } = require('../validationSchemas');

// Middleware to validate position and contact in req.body
module.exports = function validateProfileFields(req, res, next) {
  const errors = [];
  if (req.body.position) {
    const { error } = positionSchema.validate(req.body.position);
    if (error) errors.push({ field: 'position', details: error.details });
  }
  if (req.body.contact) {
    const { error } = contactSchema.validate(req.body.contact);
    if (error) errors.push({ field: 'contact', details: error.details });
  }
  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ', details: errors });
  }
  next();
}
