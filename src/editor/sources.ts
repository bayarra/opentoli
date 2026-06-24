import type { Source, User } from '@/payload-types'
import { createLocalReq, type Payload } from 'payload'

import { isEditorUser } from './permissions'

export class SourceWorkflowError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'SourceWorkflowError'
  }
}

const assertSafePublicUrl = (value: string) => {
  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') return
  } catch {
    // Fall through to the shared error below.
  }
  throw new SourceWorkflowError('Only http and https source URLs can be verified.')
}

export const verifySource = async ({
  actor,
  payload,
  sourceId,
}: {
  actor: User
  payload: Payload
  sourceId: number
}): Promise<Source> => {
  if (!isEditorUser(actor)) throw new SourceWorkflowError('Editor access is required.', 403)

  const source = await payload
    .findByID({
      collection: 'sources',
      depth: 0,
      id: sourceId,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!source) throw new SourceWorkflowError('Source not found.', 404)
  assertSafePublicUrl(source.url)

  if (source.isVerified) return source

  const req = await createLocalReq({ user: actor }, payload)
  return payload.update({
    collection: 'sources',
    data: { isVerified: true },
    id: source.id,
    overrideAccess: false,
    req,
  })
}
