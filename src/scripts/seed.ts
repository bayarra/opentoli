import { getPayload } from 'payload'

import config from '../payload.config'

const categories = [
  ['Technology & Software', 'Технологи ба программ хангамж', 'technology-software'],
  [
    'Artificial Intelligence & Data Science',
    'Хиймэл оюун ухаан ба өгөгдлийн шинжлэх ухаан',
    'ai-data-science',
  ],
  ['Finance & Economics', 'Санхүү ба эдийн засаг', 'finance-economics'],
  ['Law & Government', 'Эрх зүй ба төрийн удирдлага', 'law-government'],
  ['Medicine & Health', 'Анагаах ухаан ба эрүүл мэнд', 'medicine-health'],
  ['Business & Management', 'Бизнес ба менежмент', 'business-management'],
  ['Education & Research', 'Боловсрол ба судалгаа', 'education-research'],
  ['Science & Engineering', 'Шинжлэх ухаан ба инженерчлэл', 'science-engineering'],
  [
    'Media, Marketing & Communication',
    'Хэвлэл мэдээлэл, маркетинг ба харилцаа',
    'media-marketing-communication',
  ],
  ['Modern Everyday Terms', 'Орчин үеийн өдөр тутмын нэр томьёо', 'modern-everyday'],
] as const

const payload = await getPayload({ config })

for (const [index, [nameEn, nameMn, slug]] of categories.entries()) {
  const existing = await payload.find({
    collection: 'categories',
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: slug } },
  })

  const data = {
    displayOrder: index + 1,
    isActive: true,
    nameEn,
    nameMn,
    slug,
  }

  if (existing.docs[0]) {
    await payload.update({
      id: existing.docs[0].id,
      collection: 'categories',
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({ collection: 'categories', data, overrideAccess: true })
  }
}

payload.logger.info(`Seeded ${categories.length} primary categories.`)
await payload.destroy()
