import {
  parseDraftSourceFields,
  removeDraftSource,
  SourceWorkflowError,
  updateDraftSource,
} from '@/editor/sources'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string; sourceId: string }> }

const parseIds = async (params: RouteProps['params']) => {
  const { id, sourceId } = await params
  const draftId = Number(id)
  const parsedSourceId = Number(sourceId)
  if (!Number.isInteger(draftId) || draftId < 1) {
    throw new SourceWorkflowError('Invalid AI draft ID.')
  }
  if (!Number.isInteger(parsedSourceId) || parsedSourceId < 1) {
    throw new SourceWorkflowError('Invalid source ID.')
  }
  return { draftId, sourceId: parsedSourceId }
}

const errorResponse = (error: unknown, payload: Awaited<ReturnType<typeof getPayload>>) => {
  if (error instanceof SourceWorkflowError) {
    return Response.json({ message: error.message }, { status: error.status })
  }
  payload.logger.error({ err: error, msg: 'Draft source action failed.' })
  return Response.json({ message: 'Draft source could not be updated.' }, { status: 500 })
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const { draftId, sourceId } = await parseIds(params)
    const source = await updateDraftSource({
      actor: user as User,
      draftId,
      fields: parseDraftSourceFields(await request.json()),
      payload,
      sourceId,
    })

    return Response.json({ sourceId: source.id })
  } catch (error) {
    return errorResponse(error, payload)
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const { draftId, sourceId } = await parseIds(params)
    const result = await removeDraftSource({
      actor: user as User,
      draftId,
      payload,
      sourceId,
    })

    return Response.json({
      draftId: result.draft.id,
      publicVisibility: result.draft.publicVisibility,
      sourceId: result.sourceId,
    })
  } catch (error) {
    return errorResponse(error, payload)
  }
}
