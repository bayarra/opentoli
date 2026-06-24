import { isEditorUser } from '@/editor/permissions'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'

export const apiMeta = { apiVersion: 'v1' } as const

export type ApiErrorCode =
  | 'forbidden'
  | 'invalid_request'
  | 'not_found'
  | 'server_error'
  | 'unauthenticated'

export const apiOk = <T>(data: T, init?: ResponseInit) =>
  Response.json({ data, meta: apiMeta }, init)

export const apiError = (code: ApiErrorCode, message: string, status: number) =>
  Response.json({ error: { code, message }, meta: apiMeta }, { status })

export const apiNotFound = (message = 'The requested resource was not found.') =>
  apiError('not_found', message, 404)

export const parsePositiveInteger = (value: string, label: string): number => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid ${label}.`)
  }
  return parsed
}

export type EditorApiAuth =
  | {
      payload: Payload
      user: User
    }
  | {
      response: Response
    }

export const requireEditor = async (request: Request): Promise<EditorApiAuth> => {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return {
      response: apiError('unauthenticated', 'Sign in as an Editor.', 401),
    }
  }

  if (!isEditorUser(user as User)) {
    return {
      response: apiError('forbidden', 'Editor access is required.', 403),
    }
  }

  return { payload, user: user as User }
}
