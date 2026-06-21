import config from '@/payload.config'
import type { User } from '@/payload-types'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export const getCurrentUser = async (): Promise<User | null> => {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  return (user as User | null) || null
}
