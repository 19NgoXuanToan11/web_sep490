/**
 * Environment configuration
 *
 * Centralized configuration for environment variables and app settings.
 * This provides type-safe access to environment variables.
 */

// Default values for development
const defaults = {
  // Production backend deployed on Render
  API_URL: 'https://iotfarm.onrender.com/api',
  ENV: 'production',
  ENABLE_MOCK_API: false,
  ENABLE_ANALYTICS: false,
} as const

export const env = {
  // API Configuration - ready for real backend integration
  API_URL: import.meta.env.VITE_API_URL || defaults.API_URL,

  // Environment
  ENV: import.meta.env.VITE_ENV || defaults.ENV,

  // Feature flags
  ENABLE_MOCK_API: import.meta.env.VITE_ENABLE_MOCK_API === 'true' || defaults.ENABLE_MOCK_API,
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || defaults.ENABLE_ANALYTICS,

  // Computed values
  get isDevelopment() {
    return this.ENV === 'development'
  },

  get isProduction() {
    return this.ENV === 'production'
  },

  get isTest() {
    return this.ENV === 'test'
  },
} as const

// Validate critical configuration
if (env.isDevelopment) {
  console.info('[Config] Running in development mode')
  console.info('[Config] API URL:', env.API_URL)
  console.info('[Config] Mock API enabled:', env.ENABLE_MOCK_API)
}
