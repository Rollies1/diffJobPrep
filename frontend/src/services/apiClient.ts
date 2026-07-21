/**
 * Legacy re-export — the whole app now uses a SINGLE axios instance
 * (from `./api.ts`) with one token store and one refresh interceptor.
 *
 * This file exists so existing `import apiClient from './apiClient'` calls
 * keep working without a mass rename. New code should import { api } from
 * './api' directly.
 */
export { api as default, api, BASE_URL } from './api'
