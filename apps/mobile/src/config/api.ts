/**
 * @camino/mobile - API Client Configuration
 */

import { type ApiResponse } from '@camino/shared'
import env from './env'

const API_BASE_URL = env.apiUrl

export const buildApiUrl = (baseUrl: string, path: string) => {
  const base = baseUrl.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`

  // Avoid common `/api/api` footgun when:
  // - EXPO_PUBLIC_API_URL is set to `https://.../api`
  // - API_ENDPOINTS are still prefixed with `/api/...`
  if (base.endsWith('/api') && p.startsWith('/api/')) {
    return `${base}${p.slice('/api'.length)}`
  }

  return `${base}${p}`
}

export const apiClient = {
  async get<T>(path: string, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = buildApiUrl(API_BASE_URL, path)

    if (env.enableApiDiagnostics) {
      console.log('[api:get]', { baseUrl: API_BASE_URL, path, url })
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      if (env.enableApiDiagnostics) {
        console.log('[api:get:fail]', {
          url,
          status: response.status,
          statusText: response.statusText,
        })
      }
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data
  },

  async post<T>(
    path: string,
    body: unknown,
    token?: string
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = buildApiUrl(API_BASE_URL, path)

    if (env.enableApiDiagnostics) {
      console.log('[api:post]', { baseUrl: API_BASE_URL, path, url, hasToken: Boolean(token) })
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      if (env.enableApiDiagnostics) {
        console.log('[api:post:fail]', {
          url,
          status: response.status,
          statusText: response.statusText,
        })
      }
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data
  },

  async put<T>(
    path: string,
    body: unknown,
    token?: string
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = buildApiUrl(API_BASE_URL, path)

    if (env.enableApiDiagnostics) {
      console.log('[api:put]', { baseUrl: API_BASE_URL, path, url, hasToken: Boolean(token) })
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      if (env.enableApiDiagnostics) {
        console.log('[api:put:fail]', {
          url,
          status: response.status,
          statusText: response.statusText,
        })
      }
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data
  },

  async patch<T>(
    path: string,
    body: unknown,
    token?: string
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = buildApiUrl(API_BASE_URL, path)

    if (env.enableApiDiagnostics) {
      console.log('[api:patch]', { baseUrl: API_BASE_URL, path, url, hasToken: Boolean(token) })
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      if (env.enableApiDiagnostics) {
        console.log('[api:patch:fail]', {
          url,
          status: response.status,
          statusText: response.statusText,
        })
      }
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data
  },

  async delete<T>(path: string, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = buildApiUrl(API_BASE_URL, path)

    if (env.enableApiDiagnostics) {
      console.log('[api:delete]', { baseUrl: API_BASE_URL, path, url, hasToken: Boolean(token) })
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      if (env.enableApiDiagnostics) {
        console.log('[api:delete:fail]', {
          url,
          status: response.status,
          statusText: response.statusText,
        })
      }
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data
  },
}
