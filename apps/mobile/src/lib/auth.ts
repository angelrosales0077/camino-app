/**
 * @camino/mobile - Supabase Auth REST helpers
 */

import * as SecureStore from 'expo-secure-store'
import env from '../config/env'
import type { AuthUser } from '../stores'

interface SupabaseAuthUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    full_name?: string
  }
}

export interface SupabaseSessionResponse {
  access_token: string
  refresh_token?: string
  user: SupabaseAuthUser
}

export interface SupabaseSignUpResponse {
  user: SupabaseAuthUser
  session: SupabaseSessionResponse | null
}

interface SupabaseAuthErrorBody {
  error?: string
  error_description?: string
  message?: string
  msg?: string
}

const SESSION_KEY = 'camino.auth.session'
const AUTH_CALLBACK_URL = 'camino://auth/callback'

function requireSupabaseConfig() {
  if (!env.supabaseUrl || !env.supabaseKey) {
    throw new Error('Supabase no esta configurado.')
  }

  return {
    url: env.supabaseUrl,
    key: env.supabaseKey,
  }
}

function toAuthUser(user: SupabaseAuthUser): AuthUser {
  const email = user.email || ''
  return {
    id: user.id,
    email,
    name: user.user_metadata?.name || user.user_metadata?.full_name || email.split('@')[0],
  }
}

async function authFetch(path: string, body: unknown) {
  const { url, key } = requireSupabaseConfig()
  const response = await fetch(`${url}${path}`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await response.json()

  if (!response.ok) {
    const errorBody = data as SupabaseAuthErrorBody
    const message = errorBody.message
      || errorBody.error_description
      || errorBody.msg
      || errorBody.error
      || 'No se pudo completar la autenticacion.'
    const error = new Error(message)
    error.name = errorBody.error || error.name
    throw Object.assign(error, { status: response.status, data })
  }

  return data
}

export async function signInWithPassword(email: string, password: string) {
  const session = await authFetch('/auth/v1/token?grant_type=password', {
    email,
    password,
  }) as SupabaseSessionResponse
  await saveSession(session)
  return session
}

export async function signUpWithPassword(email: string, password: string) {
  let data: unknown = null

  try {
    data = await authFetch('/auth/v1/signup', {
      email,
      password,
      options: {
        emailRedirectTo: AUTH_CALLBACK_URL,
      },
    })
    const signUp = normalizeSignUpResponse(data)

    logSignUpDebug({
      dataUserExists: Boolean(signUp.user),
      dataSessionExists: Boolean(signUp.session),
    })

    if (signUp.session) {
      await saveSession(signUp.session)
    }

    return signUp
  } catch (error) {
    logSignUpDebug({
      error,
      dataUserExists: hasUser(getAuthErrorData(error) || data),
      dataSessionExists: Boolean(getSignUpSession(getAuthErrorData(error) || data)),
    })
    throw error
  }
}

export async function refreshSession(refreshToken: string) {
  const session = await authFetch('/auth/v1/token?grant_type=refresh_token', {
    refresh_token: refreshToken,
  }) as SupabaseSessionResponse
  await saveSession(session)
  return session
}

export async function getUserWithAccessToken(accessToken: string) {
  const { url, key } = requireSupabaseConfig()
  const response = await fetch(`${url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await response.json()

  if (!response.ok || !hasUser(data)) {
    throw new Error('No se pudo validar la confirmacion de correo.')
  }

  if (isRecord(data) && isRecord(data.user) && typeof data.user.id === 'string') {
    return data.user as unknown as SupabaseAuthUser
  }

  return data as unknown as SupabaseAuthUser
}

export function getAuthCallbackUrl() {
  return AUTH_CALLBACK_URL
}

function normalizeSignUpResponse(data: unknown): SupabaseSignUpResponse {
  if (!isRecord(data)) {
    throw new Error('Respuesta invalida de Supabase Auth.')
  }

  const session = getSignUpSession(data)
  const user = getSignUpUser(data) || session?.user || null

  if (!user) {
    throw new Error('Supabase no devolvio usuario para la cuenta creada.')
  }

  return {
    user,
    session,
  }
}

function logSignUpDebug({
  error,
  dataUserExists,
  dataSessionExists,
}: {
  error?: unknown
  dataUserExists: boolean
  dataSessionExists: boolean
}) {
  if (!__DEV__) {
    return
  }

  const authError = error as Error & { status?: number }
  console.log('[Supabase Auth] signUpWithPassword', {
    hasSupabaseUrl: Boolean(env.supabaseUrl),
    hasSupabaseAnonKey: Boolean(env.supabaseKey),
    supabaseAnonKeyPrefix: env.supabaseKey ? env.supabaseKey.slice(0, 12) : null,
    errorMessage: authError?.message,
    errorStatus: authError?.status,
    errorName: authError?.name,
    hasDataUser: dataUserExists,
    hasDataSession: dataSessionExists,
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasUser(data: unknown): data is SupabaseAuthUser | SupabaseSessionResponse {
  if (!isRecord(data)) {
    return false
  }

  if (typeof data.id === 'string') {
    return true
  }

  return isRecord(data.user) && typeof data.user.id === 'string'
}

function hasSession(data: unknown): data is SupabaseSessionResponse {
  if (!isRecord(data)) {
    return false
  }

  return typeof data.access_token === 'string'
    && isRecord(data.user)
    && typeof data.user.id === 'string'
}

function getSignUpUser(data: unknown): SupabaseAuthUser | null {
  if (!isRecord(data)) {
    return null
  }

  if (isRecord(data.user) && typeof data.user.id === 'string') {
    return data.user as unknown as SupabaseAuthUser
  }

  if (typeof data.id === 'string') {
    return data as unknown as SupabaseAuthUser
  }

  return null
}

function getSignUpSession(data: unknown): SupabaseSessionResponse | null {
  if (!isRecord(data)) {
    return null
  }

  if (hasSession(data)) {
    return data
  }

  if (hasSession(data.session)) {
    return data.session
  }

  return null
}

function getAuthErrorData(error: unknown) {
  if (!isRecord(error)) {
    return null
  }

  return error.data || null
}

export async function saveSession(session: SupabaseSessionResponse) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session))
}

export async function loadSession() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY)
  if (!raw) {
    return null
  }

  const session = JSON.parse(raw) as SupabaseSessionResponse
  if (!session.access_token || !session.user) {
    return null
  }

  return session
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY)
}

export function getSessionCredentials(session: SupabaseSessionResponse) {
  return {
    user: toAuthUser(session.user),
    token: session.access_token,
    refreshToken: session.refresh_token || null,
  }
}
