import { apiOk } from '@/api/v1/http'
import { getPublicAIDrafts } from '@/lib/publicAIDrafts'

export const dynamic = 'force-dynamic'

export async function GET() {
  return apiOk({
    drafts: await getPublicAIDrafts(),
  })
}
