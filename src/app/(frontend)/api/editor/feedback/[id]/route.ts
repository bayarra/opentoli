import { FeedbackModerationError, moderateFeedback } from '@/editor/feedback'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }

const commentIdFrom = async (params: RouteProps['params']) => {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) {
    throw new FeedbackModerationError('Invalid feedback ID.')
  }
  return id
}

const errorResponse = (error: unknown, payload: Awaited<ReturnType<typeof getPayload>>) => {
  if (error instanceof FeedbackModerationError) {
    return Response.json({ message: error.message }, { status: error.status })
  }

  payload.logger.error({ err: error, msg: 'Feedback moderation failed.' })
  return Response.json({ message: 'Feedback could not be moderated.' }, { status: 500 })
}

export async function POST(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const input = (await request.json()) as { moderatorNote?: unknown; status?: unknown }
    const result = await moderateFeedback({
      actor: user as User,
      commentId: await commentIdFrom(params),
      moderatorNote: typeof input.moderatorNote === 'string' ? input.moderatorNote : undefined,
      payload,
      status: input.status as 'approved' | 'rejected' | 'hidden',
    })

    return Response.json({
      feedbackId: result.id,
      moderatedAt: result.moderatedAt,
      status: result.status,
    })
  } catch (error) {
    return errorResponse(error, payload)
  }
}
