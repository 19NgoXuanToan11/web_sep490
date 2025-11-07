
const defaults = {

  API_URL: 'https://iotfarm.onrender.com/api',
  ENV: 'production',
  ENABLE_MOCK_API: false,
  ENABLE_ANALYTICS: false,
} as const

export const env = {

  API_URL: import.meta.env.VITE_API_URL || defaults.API_URL,

  ENV: import.meta.env.VITE_ENV || defaults.ENV,

  ENABLE_MOCK_API: import.meta.env.VITE_ENABLE_MOCK_API === 'true' || defaults.ENABLE_MOCK_API,
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || defaults.ENABLE_ANALYTICS,

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

if (env.isDevelopment) {
      }
