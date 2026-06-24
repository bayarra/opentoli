import { apiError, apiNotFound, apiOk, parsePositiveInteger } from '@/api/v1/http'
import { getPublicAIDraftById } from '@/lib/publicAIDrafts'

type RouteProps = { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: RouteProps) {
  let id: number
  try {
    id = parsePositiveInteger((await params).id, 'draft ID')
  } catch {
    return apiError('invalid_request', 'Invalid draft ID.', 400)
  }

  const draft = await getPublicAIDraftById(id)
  if (!draft) return apiNotFound('Public AI draft was not found.')

  return apiOk({ draft })
}
