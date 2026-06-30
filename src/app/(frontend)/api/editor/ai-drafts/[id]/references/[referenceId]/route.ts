import {
  parseDraftReferenceFields,
  ReferenceWorkflowError,
  removeDraftReference,
  updateDraftReference,
} from '@/editor/references'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string; referenceId: string }> }

const parseIds = async (params: RouteProps['params']) => {
  const { id, referenceId } = await params
  const draftId = Number(id)
  const parsedReferenceId = Number(referenceId)
  if (!Number.isInteger(draftId) || draftId < 1) {
    throw new ReferenceWorkflowError('Invalid AI draft ID.')
  }
  if (!Number.isInteger(parsedReferenceId) || parsedReferenceId < 1) {
    throw new ReferenceWorkflowError('Invalid reference ID.')
  }
  return { draftId, referenceId: parsedReferenceId }
}

const errorResponse = (error: unknown, payload: Awaited<ReturnType<typeof getPayload>>) => {
  if (error instanceof ReferenceWorkflowError) {
    return Response.json({ message: error.message }, { status: error.status })
  }
  payload.logger.error({ err: error, msg: 'Draft reference action failed.' })
  return Response.json({ message: 'Draft reference could not be updated.' }, { status: 500 })
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const { draftId, referenceId } = await parseIds(params)
    const reference = await updateDraftReference({
      actor: user as User,
      draftId,
      fields: parseDraftReferenceFields(await request.json()),
      payload,
      referenceId,
    })
    return Response.json({ referenceId: reference.id })
  } catch (error) {
    return errorResponse(error, payload)
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const { draftId, referenceId } = await parseIds(params)
    const result = await removeDraftReference({
      actor: user as User,
      draftId,
      payload,
      referenceId,
    })
    return Response.json({ draftId: result.draft.id, referenceId: result.referenceId })
  } catch (error) {
    return errorResponse(error, payload)
  }
}
