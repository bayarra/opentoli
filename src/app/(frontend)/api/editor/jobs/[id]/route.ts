import { EditorJobError, retryEditorJobNow } from '@/editor/jobs'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }

const jobIdFrom = async (params: RouteProps['params']) => {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) throw new EditorJobError('Invalid generation job ID.')
  return id
}

const errorResponse = (error: unknown, payload: Awaited<ReturnType<typeof getPayload>>) => {
  if (error instanceof EditorJobError) {
    return Response.json({ message: error.message }, { status: error.status })
  }
  payload.logger.error({ err: error, msg: 'Generation job action failed.' })
  return Response.json({ message: 'Generation job could not be updated.' }, { status: 500 })
}

export async function POST(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const input = (await request.json()) as { action?: unknown }
    if (input.action !== 'retry-now') throw new EditorJobError('Choose a valid job action.')

    const job = await retryEditorJobNow({
      actor: user as User,
      jobId: await jobIdFrom(params),
      payload,
    })

    return Response.json({ job })
  } catch (error) {
    return errorResponse(error, payload)
  }
}
