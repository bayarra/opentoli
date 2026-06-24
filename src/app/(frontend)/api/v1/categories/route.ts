import { apiOk } from '@/api/v1/http'
import { categoryResource } from '@/api/v1/serialize'
import config from '@/payload.config'
import type { Category } from '@/payload-types'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config: await config })
  const categories = await payload.find({
    collection: 'categories',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    sort: 'displayOrder',
    where: { isActive: { equals: true } },
  })

  return apiOk({
    categories: (categories.docs as Category[]).map(categoryResource),
  })
}
