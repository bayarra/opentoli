import { ImportWorkflowError, reviewImportItem } from '@/editor/imports'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }
export async function PATCH(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })
  try {
    const id = Number((await params).id)
    if (!Number.isInteger(id) || id < 1) throw new ImportWorkflowError('Invalid import row ID.')
    const input = await request.json() as { status?: unknown }
    if (input.status !== 'accepted' && input.status !== 'rejected') throw new ImportWorkflowError('Choose accept or reject.')
    const item = await reviewImportItem({ actor: user as User, itemId: id, payload, status: input.status })
    return Response.json({ itemId: item.id, status: item.status })
  } catch (error) {
    if (error instanceof ImportWorkflowError) return Response.json({ message: error.message }, { status: error.status })
    payload.logger.error({ err: error, msg: 'Import row review failed.' })
    return Response.json({ message: 'Import row could not be updated.' }, { status: 500 })
  }
}
