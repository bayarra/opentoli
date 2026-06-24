import { SourceWorkflowError, verifySource } from '@/editor/sources'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }

const sourceIdFrom = async (params: RouteProps['params']) => {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) throw new SourceWorkflowError('Invalid source ID.')
  return id
}

const errorResponse = (error: unknown, payload: Awaited<ReturnType<typeof getPayload>>) => {
  if (error instanceof SourceWorkflowError) {
    return Response.json({ message: error.message }, { status: error.status })
  }
  payload.logger.error({ err: error, msg: 'Source verification failed.' })
  return Response.json({ message: 'The source could not be verified.' }, { status: 500 })
}

export async function POST(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const input = (await request.json().catch(() => ({}))) as { action?: unknown }
    if (input.action !== 'verify') throw new SourceWorkflowError('Choose Verify source.')

    const source = await verifySource({
      actor: user as User,
      payload,
      sourceId: await sourceIdFrom(params),
    })

    return Response.json({
      sourceId: source.id,
      verified: source.isVerified,
      verifiedAt: source.updatedAt,
    })
  } catch (error) {
    return errorResponse(error, payload)
  }
}
