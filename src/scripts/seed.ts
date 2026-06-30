import 'dotenv/config'

import { getPayload } from 'payload'

const requiredEnvironmentVariables = ['DATABASE_URL', 'PAYLOAD_SECRET'] as const
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => !process.env[name],
)

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(', ')}. ` +
      'Create .env from .env.example before running the seed.',
  )
}

const { default: config } = await import('../payload.config')

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

try {
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

  const technologyCategory = await payload.find({
    collection: 'categories',
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: 'technology-software' } },
  })
  const category = technologyCategory.docs[0]

  if (!category) throw new Error('Technology & Software category was not seeded.')

  const existingContext = await payload.find({
    collection: 'contexts',
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: 'software-security' } },
  })
  const contextData = {
    category: category.id,
    descriptionEn: 'Identity and access security in software systems.',
    descriptionMn: 'Программ хангамжийн системийн таних болон хандалтын аюулгүй байдал.',
    nameEn: 'Software security',
    nameMn: 'Программ хангамжийн аюулгүй байдал',
    slug: 'software-security',
  }
  const context = existingContext.docs[0]
    ? await payload.update({
        id: existingContext.docs[0].id,
        collection: 'contexts',
        data: contextData,
        overrideAccess: true,
      })
    : await payload.create({ collection: 'contexts', data: contextData, overrideAccess: true })

  const termData = {
    categories: [category.id],
    contexts: [context.id],
    explanationEn:
      'Authentication verifies that a user, device, or system is the identity it claims to be.',
    explanationMn:
      'Танин баталгаажуулалт нь хэрэглэгч, төхөөрөмж эсвэл систем өөрийн мэдүүлж буй мөн чанартайгаа таарч байгаа эсэхийг шалгах үйл явц юм.',
    headwordEn: 'authentication',
    normalizedHeadwordEn: 'authentication',
    partOfSpeech: 'noun' as const,
    reviewStatus: 'human_reviewed' as const,
    shortDefinitionEn: 'The process of verifying a claimed identity.',
    slug: 'authentication',
    usageNoteEn: 'Development reference entry. Re-review before production launch.',
    usageNoteMn: 'Хөгжүүлэлтийн жишиг бичлэг. Үйлдвэрлэлийн орчинд нийтлэхээс өмнө дахин хянана.',
    workflowStatus: 'approved' as const,
  }
  const existingTerm = await payload.find({
    collection: 'terms',
    draft: true,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: 'authentication' } },
  })
  const term = existingTerm.docs[0]
    ? await payload.update({
        id: existingTerm.docs[0].id,
        collection: 'terms',
        data: termData,
        draft: true,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'terms',
        data: termData,
        draft: true,
        overrideAccess: true,
      })

  const translationFixtures = [
    {
      explanationEn: 'A concise technical noun form.',
      explanationMn: 'Техникийн хэрэглээнд тохирох товч нэр үгийн хэлбэр.',
      register: 'technical' as const,
      reviewStatus: 'human_reviewed' as const,
      status: 'approved' as const,
      translationMn: 'танин баталгаажуулалт',
      translationType: 'recommended' as const,
    },
    {
      explanationEn: 'A descriptive phrase used for sign-in and access flows.',
      explanationMn: 'Нэвтрэх болон хандалтын үйл явцыг тайлбарласан хэллэг.',
      register: 'general' as const,
      reviewStatus: 'human_reviewed' as const,
      status: 'approved' as const,
      translationMn: 'нэвтрэлтийг баталгаажуулах',
      translationType: 'alternative' as const,
    },
  ]

  let recommendedTranslationId: number | undefined
  for (const translationData of translationFixtures) {
    const existingTranslation = await payload.find({
      collection: 'translations',
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { term: { equals: term.id } },
          { translationMn: { equals: translationData.translationMn } },
        ],
      },
    })
    const translation = existingTranslation.docs[0]
      ? await payload.update({
          id: existingTranslation.docs[0].id,
          collection: 'translations',
          data: { ...translationData, context: context.id, term: term.id },
          overrideAccess: true,
        })
      : await payload.create({
          collection: 'translations',
          data: { ...translationData, context: context.id, term: term.id },
          overrideAccess: true,
        })

    if (translation.translationType === 'recommended') recommendedTranslationId = translation.id
  }

  if (!recommendedTranslationId) throw new Error('Recommended translation was not seeded.')

  const existingSource = await payload.find({
    collection: 'sources',
    limit: 1,
    overrideAccess: true,
    where: {
      and: [{ term: { equals: term.id } }, { title: { equals: 'NIST Authentication Glossary' } }],
    },
  })
  const sourceData = {
    accessedDate: new Date().toISOString(),
    excerptNote: 'Used to verify the canonical English concept; the Mongolian wording is editorial.',
    publisher: 'National Institute of Standards and Technology',
    sourceType: 'government' as const,
    term: term.id,
    title: 'NIST Authentication Glossary',
    url: 'https://csrc.nist.gov/glossary/term/authentication',
  }
  const source = existingSource.docs[0]
    ? await payload.update({
        id: existingSource.docs[0].id,
        collection: 'sources',
        data: sourceData,
        overrideAccess: true,
      })
    : await payload.create({ collection: 'sources', data: sourceData, overrideAccess: true })

  const exampleEn = 'The application requires two-factor authentication.'
  const existingExample = await payload.find({
    collection: 'examples',
    limit: 1,
    overrideAccess: true,
    where: { and: [{ term: { equals: term.id } }, { exampleEn: { equals: exampleEn } }] },
  })
  const exampleData = {
    context: context.id,
    exampleEn,
    exampleMn: 'Уг аппликейшн хоёр хүчин зүйлт танин баталгаажуулалт шаарддаг.',
    reviewStatus: 'human_reviewed' as const,
    source: source.id,
    status: 'approved' as const,
    term: term.id,
  }
  if (existingExample.docs[0]) {
    await payload.update({
      id: existingExample.docs[0].id,
      collection: 'examples',
      data: exampleData,
      overrideAccess: true,
    })
  } else {
    await payload.create({ collection: 'examples', data: exampleData, overrideAccess: true })
  }

  await payload.update({
    id: term.id,
    collection: 'terms',
    context: { trustedSeed: true },
    data: {
      recommendedTranslation: recommendedTranslationId,
      reviewStatus: 'human_reviewed',
      workflowStatus: 'approved',
      _status: 'published',
    },
    draft: false,
    overrideAccess: true,
  })

  payload.logger.info(`Seeded ${categories.length} primary categories and the authentication reference term.`)
} finally {
  await payload.destroy()
}
