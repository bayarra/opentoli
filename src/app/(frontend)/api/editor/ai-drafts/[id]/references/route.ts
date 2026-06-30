import {
  addDraftReference,
  parseDraftReferenceFields,
  ReferenceWorkflowError,
} from '@/editor/references'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }

const draftIdFrom = async (params: RouteProps['params']) => {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) throw new ReferenceWorkflowError('Invalid AI draft ID.')
  return id
}

const errorResponse = (error: unknown, payload: Awaited<ReturnType<typeof getPayload>>) => {
  if (error instanceof ReferenceWorkflowError) {
    return Response.json({ message: error.message }, { status: error.status })
  }
  payload.logger.error({ err: error, msg: 'Draft reference action failed.' })
  return Response.json({ message: 'Draft reference could not be updated.' }, { status: 500 })
}

export async function POST(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const result = await addDraftReference({
      actor: user as User,
      draftId: await draftIdFrom(params),
      fields: parseDraftReferenceFields(await request.json()),
      payload,
    })

    return Response.json({ draftId: result.draft.id, referenceId: result.reference.id })
  } catch (error) {
    return errorResponse(error, payload)
  }
}
