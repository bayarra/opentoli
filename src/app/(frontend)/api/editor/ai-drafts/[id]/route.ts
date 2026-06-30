import {
  CalibrationOutcomeError,
  parseDraftQualityFields,
} from '@/calibration/outcomes'
import {
  EditorWorkflowError,
  hideEditorDraft,
  parseEditorDraftFields,
  publishEditorDraft,
  saveEditorDraft,
  updateEditorDraftVisibility,
} from '@/editor/drafts'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }

const draftIdFrom = async (params: RouteProps['params']) => {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) throw new EditorWorkflowError('Invalid AI draft ID.')
  return id
}

const errorResponse = (error: unknown, payload: Awaited<ReturnType<typeof getPayload>>) => {
  if (error instanceof EditorWorkflowError) {
    return Response.json({ message: error.message }, { status: error.status })
  }
  if (error instanceof CalibrationOutcomeError) {
    return Response.json({ message: error.message }, { status: error.status })
  }
  payload.logger.error({ err: error, msg: 'Simple editor workflow failed.' })
  return Response.json({ message: 'The draft could not be updated.' }, { status: 500 })
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const draft = await saveEditorDraft({
      actorId: (user as User).id,
      draftId: await draftIdFrom(params),
      fields: parseEditorDraftFields(await request.json()),
      payload,
    })
    return Response.json({ draftId: draft.id, savedAt: draft.updatedAt })
  } catch (error) {
    return errorResponse(error, payload)
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const input = (await request.json()) as {
      action?: unknown
      qualityNotes?: unknown
      qualityRating?: unknown
    }
    const draftId = await draftIdFrom(params)
    const calibrationOutcome = input.qualityRating
      ? parseDraftQualityFields(input, draftId, input.action === 'hide' ? 'hide' : 'publish')
      : undefined
    if (input.action === 'hide') {
      const result = await hideEditorDraft({
        actorId: (user as User).id,
        calibrationOutcome,
        draftId,
        payload,
      })
      return Response.json({ draftId: result.draft.id, hidden: true })
    }
    if (input.action === 'open-public-feedback' || input.action === 'close-public-feedback') {
      const visibility = input.action === 'open-public-feedback' ? 'public' : 'private'
      const draft = await updateEditorDraftVisibility({
        actorId: (user as User).id,
        draftId,
        payload,
        visibility,
      })
      return Response.json({
        draftId: draft.id,
        publicVisibility: draft.publicVisibility,
      })
    }
    if (input.action !== 'publish') throw new EditorWorkflowError('Choose Publish or Hide.')

    const result = await publishEditorDraft({
      actorId: (user as User).id,
      calibrationOutcome,
      draftId,
      payload,
    })
    return Response.json({
      draftId: result.draft.id,
      slug: result.term.slug,
      termId: result.term.id,
    })
  } catch (error) {
    return errorResponse(error, payload)
  }
}
