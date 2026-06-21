import * as migration_20260621_010549_initial from './20260621_010549_initial'
import * as migration_20260621_012620_editorial_core from './20260621_012620_editorial_core'
import * as migration_20260621_021151_m3_ai_foundation from './20260621_021151_m3_ai_foundation'
import * as migration_20260621_185717_m4_public_draft_feedback from './20260621_185717_m4_public_draft_feedback'

export const migrations = [
  {
    up: migration_20260621_010549_initial.up,
    down: migration_20260621_010549_initial.down,
    name: '20260621_010549_initial',
  },
  {
    up: migration_20260621_012620_editorial_core.up,
    down: migration_20260621_012620_editorial_core.down,
    name: '20260621_012620_editorial_core',
  },
  {
    up: migration_20260621_021151_m3_ai_foundation.up,
    down: migration_20260621_021151_m3_ai_foundation.down,
    name: '20260621_021151_m3_ai_foundation',
  },
  {
    up: migration_20260621_185717_m4_public_draft_feedback.up,
    down: migration_20260621_185717_m4_public_draft_feedback.down,
    name: '20260621_185717_m4_public_draft_feedback',
  },
]
