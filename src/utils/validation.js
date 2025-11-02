import Joi from 'joi';

export const schemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }),

  createWallet: Joi.object({
    network: Joi.string()
      .valid('mainnet', 'sepolia', 'goerli')
      .default('sepolia')
  }),

  sendFunds: Joi.object({
    walletId: Joi.number().integer().positive().required(),
    toAddress: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Ethereum address format'
      }),
    amount: Joi.string()
      .pattern(/^\d+(\.\d+)?$/)
      .required()
      .messages({
        'string.pattern.base': 'Amount must be a valid number'
      })
  }),

  getBalance: Joi.object({
    walletId: Joi.number().integer().positive().required()
  }),

  getTransactions: Joi.object({
    walletId: Joi.number().integer().positive().required(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0)
  })
};

export function validate(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return { valid: false, errors, value: null };
  }

  return { valid: true, errors: null, value };
}

export function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTransactionHash(hash) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}
