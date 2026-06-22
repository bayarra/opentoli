import {
  decideAIDraft,
  parseAIDraftDecisionInput,
  ReviewDecisionError,
} from '@/review/decideAIDraft'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in to review AI drafts.' }, { status: 401 })

  const draftId = Number((await params).id)
  if (!Number.isInteger(draftId) || draftId < 1) {
    return Response.json({ message: 'Invalid AI draft ID.' }, { status: 400 })
  }

  try {
    const result = await decideAIDraft({
      actorId: (user as User).id,
      draftId,
      input: parseAIDraftDecisionInput(await request.json()),
      payload,
    })
    return Response.json({
      decisionId: result.decision.id,
      draftId: result.draft.id,
      termId: result.term?.id,
    })
  } catch (error) {
    if (error instanceof ReviewDecisionError) {
      return Response.json({ message: error.message }, { status: error.status })
    }
    payload.logger.error({ err: error, msg: `AI draft ${draftId} decision failed.` })
    return Response.json(
      { message: 'The review decision could not be completed.' },
      { status: 500 },
    )
  }
}
