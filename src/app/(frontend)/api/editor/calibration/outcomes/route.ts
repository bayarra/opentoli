import {
  CalibrationOutcomeError,
  parseCalibrationOutcomeFields,
  recordCalibrationOutcome,
} from '@/calibration/outcomes'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload } from 'payload'

const errorResponse = (error: unknown, payload: Awaited<ReturnType<typeof getPayload>>) => {
  if (error instanceof CalibrationOutcomeError) {
    return Response.json({ message: error.message }, { status: error.status })
  }

  payload.logger.error({ err: error, msg: 'Calibration outcome update failed.' })
  return Response.json({ message: 'Calibration outcome could not be saved.' }, { status: 500 })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ message: 'Sign in as an Editor.' }, { status: 401 })

  try {
    const outcome = await recordCalibrationOutcome({
      actor: user as User,
      fields: parseCalibrationOutcomeFields(await request.json()),
      payload,
    })

    return Response.json({
      outcome: outcome.outcome,
      outcomeId: outcome.id,
      reviewedAt: outcome.reviewedAt,
    })
  } catch (error) {
    return errorResponse(error, payload)
  }
}
