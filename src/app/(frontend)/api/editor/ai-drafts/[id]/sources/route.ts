import { addDraftSource, parseDraftSourceFields, SourceWorkflowError } from '@/editor/sources'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }

const draftIdFrom = async (params: RouteProps['params']) => {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) throw new SourceWorkflowError('Invalid AI draft ID.')
  return id
}

const errorResponse = (error: unknown, payload: Awaited<ReturnType<typeof getPayload>>) => {
  if (error instanceof SourceWorkflowError) {
    return Response.json({ message: error.message }, { status: error.status })
  }
  payload.logger.error({ err: error, msg: 'Draft source action failed.' })
  return Response.json({ message: 'Draft source could not be updated.' }, { status: 500 })
}

export async function POST(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const result = await addDraftSource({
      actor: user as User,
      draftId: await draftIdFrom(params),
      fields: parseDraftSourceFields(await request.json()),
      payload,
    })

    return Response.json({
      draftId: result.draft.id,
      sourceId: result.source.id,
    })
  } catch (error) {
    return errorResponse(error, payload)
  }
}
