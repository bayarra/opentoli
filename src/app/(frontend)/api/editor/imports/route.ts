import { createImportBatch, ImportWorkflowError, parseCreateImportBatch } from '@/editor/imports'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

export async function POST(request: Request) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })
  try {
    const batch = await createImportBatch({ actor: user as User, fields: parseCreateImportBatch(await request.json()), payload })
    return Response.json({ batchId: batch.id, status: batch.status }, { status: 201 })
  } catch (error) {
    if (error instanceof ImportWorkflowError) return Response.json({ message: error.message }, { status: error.status })
    payload.logger.error({ err: error, msg: 'Import preparation failed.' })
    return Response.json({ message: 'Import batch could not be prepared.' }, { status: 500 })
  }
}
