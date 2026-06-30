import { acceptAllValidImportItems, ImportWorkflowError, queueImportBatch } from '@/editor/imports'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }
export async function POST(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })
  try {
    const id = Number((await params).id)
    if (!Number.isInteger(id) || id < 1) throw new ImportWorkflowError('Invalid import batch ID.')
    const input = await request.json() as { action?: unknown }
    if (input.action === 'accept-all') {
      const result = await acceptAllValidImportItems({ actor: user as User, batchId: id, payload })
      return Response.json({ batchId: result.batch.id, status: result.batch.status })
    }
    if (input.action === 'queue') return Response.json({ batchId: id, ...(await queueImportBatch({ actor: user as User, batchId: id, payload })) })
    throw new ImportWorkflowError('Choose accept-all or queue.')
  } catch (error) {
    if (error instanceof ImportWorkflowError) return Response.json({ message: error.message }, { status: error.status })
    payload.logger.error({ err: error, msg: 'Import batch action failed.' })
    return Response.json({ message: 'Import batch action failed.' }, { status: 500 })
  }
}
