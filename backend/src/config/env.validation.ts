import Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
  // Comma-separated list of allowed origins (overrides FRONTEND_URL when set)
  ALLOWED_ORIGINS: Joi.string().optional(),
  // Comma-separated list of allowed email domains for registration (optional)
  // Example: "universidad.edu,alumnos.universidad.edu"
  ALLOWED_EMAIL_DOMAINS: Joi.string().optional(),
  FIREBASE_PROJECT_ID: Joi.string().required(),
  FIREBASE_CLIENT_EMAIL: Joi.string().email().required(),
  FIREBASE_PRIVATE_KEY: Joi.string().required(),
  FIREBASE_WEB_API_KEY: Joi.string().required(),
  // TURN server for WebRTC (optional — STUN-only fallback when absent)
  TURN_URLS: Joi.string().optional(),
  TURN_USERNAME: Joi.string().optional(),
  TURN_CREDENTIAL: Joi.string().optional(),
});
