// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    database: {
      url: process.env.NUXT_DATABASE_URL || 'file:server/database.sqlite'
    },
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || (process.env.NODE_ENV === 'development' ? 'dev-secret-password-must-be-at-least-32-characters-long' : '')
    }
  },

  routeRules: {
    '/': { prerender: false }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
