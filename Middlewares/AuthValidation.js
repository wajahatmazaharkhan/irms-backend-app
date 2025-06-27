import Joi from 'joi';
import moment from 'moment';


// Signup Validation Middleware
export const signupValidation = (req, res, next) => {
  req.body.name = req.body.name?.trim();
  req.body.email = req.body.email?.trim();

  const schema = Joi.object({
    name: Joi.string().required().messages({
      'string.empty': 'Name is required',
    }),
    department: Joi.string()
      .valid('development', 'hr', 'research', 'communication')  // Restrict to only these values
      .required()  // Ensure the field is required
      .messages({
        'string.empty': 'Name is required',  // Custom message for empty field
        'any.only': 'Department must be one of [development, hr, research, communication]',  // Custom message for invalid department
      }),


    mnumber: Joi.string()
      .pattern(/^\+?\d{1,4}[3-9]\d{9}$/) // Allow numbers starting with 3, 6, 7, 8, or 9
      .required()
      .messages({
        'string.base': 'Mobile number must be a valid string',
        'string.pattern.base': 'Mobile number must be a valid 10-digit number starting with 3, 6, 7, 8, or 9, with an optional country code',
        'any.required': 'Mobile number is required',
      }),

    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),

    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),

    rpassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords must match',
      'any.required': 'Confirm password is required',
    }),

    role: Joi.string()
      .valid('admin', 'hr', 'intern')
      .default('intern')
      .messages({
        'any.only': 'Role must be one of admin, manager, or intern',
      }),

    startDate: Joi.custom((value, helpers) => {
      if (!value) {
        return new Date(); // Default to current date if no value provided
      }
      const date = moment(value, ['YYYY-MM-DD', 'DD-MM-YYYY'], true);
      if (!date.isValid()) {
        return helpers.error('date.base', { value });
      }
      return date.toDate();
    }).default(() => new Date()).messages({
      'date.base': 'Start date must be a valid date in YYYY-MM-DD or DD-MM-YYYY format',
    }),

    // Custom validation for 'endDate' with correct use of helpers
    EndDate: Joi.custom((value, helpers) => {
      if (!value) {
        return helpers.error('date.base', { value: 'End date is required' });
      }
      const date = moment(value, ['YYYY-MM-DD', 'DD-MM-YYYY'], true);
      if (!date.isValid()) {
        return helpers.error('date.base', { value });
      }

      // Compare endDate with startDate using helpers.state
      const { startDate } = helpers.state.ancestors[0];
      if (startDate && moment(value).isBefore(moment(startDate))) {
        return helpers.error('date.base', { value: 'End date must be after start date' });
      }

      return date.toDate();
    }).messages({
      'date.base': 'End date must be a valid date in YYYY-MM-DD or DD-MM-YYYY format and after the start date.',
    }),

  }).strict(); // Ensures that only the defined fields are allowed

  const { error } = schema.validate(req.body);
  if (error) {
    console.log(`Auth signup Validation Error: ${error}`);
    return res.status(400).json({ message: 'Bad request', error: error.details });
  }
  next();
};


// Login Validation Middleware
export const loginValidation = (req, res, next) => {
  // Trim the request body fields before validation
  req.body.email = req.body.email?.trim();

  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email must be a valid email address",
      "any.required": "Email is required",
    }),

    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
  }).strict(); // Ensures that only the defined fields are allowed

  const { error } = schema.validate(req.body);
  if (error) {
    console.log(`Auth login Validation Error: ${error}`);
    return res
      .status(400)
      .json({ message: "Bad request", error: error.details });
  }
  next();
};
