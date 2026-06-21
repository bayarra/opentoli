import config from '@/payload.config'
import { getPayload } from 'payload'

const registrationError = (message: string, status: number) =>
  Response.json({ message }, { status })

const emailIsRegistered = async (email: string) => {
  const payload = await getPayload({ config: await config })
  const existing = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: email } },
  })
  return existing.docs.length > 0
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: await config })
  const existingUsers = await payload.count({ collection: 'users', overrideAccess: true })

  if (existingUsers.totalDocs === 0) {
    return registrationError('An administrator must initialize OpenToli first.', 503)
  }

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return registrationError('A valid JSON request body is required.', 400)
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return registrationError('Registration details are required.', 400)
  }

  const { email, name, password } = input as Record<string, unknown>
  if (
    typeof email !== 'string' ||
    typeof name !== 'string' ||
    typeof password !== 'string' ||
    name.trim().length < 2 ||
    name.trim().length > 100 ||
    password.length < 8
  ) {
    return registrationError(
      'Enter a valid name, email, and password of at least 8 characters.',
      400,
    )
  }

  const normalizedEmail = email.trim().toLocaleLowerCase('en-US')
  if (await emailIsRegistered(normalizedEmail)) {
    return registrationError('An account with this email already exists. Sign in instead.', 409)
  }

  try {
    const user = await payload.create({
      collection: 'users',
      context: { publicRegistration: true },
      data: {
        email: normalizedEmail,
        name: name.trim(),
        password,
        role: 'contributor',
      },
      overrideAccess: true,
    })

    return Response.json(
      { doc: { email: user.email, id: user.id, name: user.name } },
      { status: 201 },
    )
  } catch (error) {
    // Recheck after a failed insert to handle concurrent registrations without exposing a DB error.
    if (await emailIsRegistered(normalizedEmail)) {
      return registrationError('An account with this email already exists. Sign in instead.', 409)
    }
    payload.logger.warn({ err: error, msg: 'Public registration failed.' })
    return registrationError(
      'The account could not be created. Check the details and try again.',
      400,
    )
  }
}
