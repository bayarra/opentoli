import { parsePublishedTermFields, PublishedTermWorkflowError, updatePublishedTerm } from '@/editor/terms'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

type RouteProps = { params: Promise<{ id: string }> }

const termIdFrom = async (params: RouteProps['params']) => {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) throw new PublishedTermWorkflowError('Invalid term ID.')
  return id
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const term = await updatePublishedTerm({
      actor: user as User,
      fields: parsePublishedTermFields(await request.json()),
      payload,
      termId: await termIdFrom(params),
    })
    return Response.json({ slug: term.slug, termId: term.id, updatedAt: term.updatedAt })
  } catch (error) {
    if (error instanceof PublishedTermWorkflowError) {
      return Response.json({ message: error.message }, { status: error.status })
    }
    payload.logger.error({ err: error, msg: 'Published term update failed.' })
    return Response.json({ message: 'Published term could not be saved.' }, { status: 500 })
  }
}
