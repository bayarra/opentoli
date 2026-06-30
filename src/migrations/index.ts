import * as migration_20260621_010549_initial from './20260621_010549_initial';
import * as migration_20260621_012620_editorial_core from './20260621_012620_editorial_core';
import * as migration_20260621_021151_m3_ai_foundation from './20260621_021151_m3_ai_foundation';
import * as migration_20260621_185717_m4_public_draft_feedback from './20260621_185717_m4_public_draft_feedback';
import * as migration_20260621_193929_m4_reviewer_workspace from './20260621_193929_m4_reviewer_workspace';
import * as migration_20260625_044141_m5_calibration_outcomes from './20260625_044141_m5_calibration_outcomes';
import * as migration_20260630_012122_optional_references_cleanup from './20260630_012122_optional_references_cleanup';
import * as migration_20260630_012522_reference_enums from './20260630_012522_reference_enums';
import * as migration_20260630_021449_expanded_proposal_moderation from './20260630_021449_expanded_proposal_moderation';

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
  {
    up: migration_20260621_193929_m4_reviewer_workspace.up,
    down: migration_20260621_193929_m4_reviewer_workspace.down,
    name: '20260621_193929_m4_reviewer_workspace',
  },
  {
    up: migration_20260625_044141_m5_calibration_outcomes.up,
    down: migration_20260625_044141_m5_calibration_outcomes.down,
    name: '20260625_044141_m5_calibration_outcomes',
  },
  {
    up: migration_20260630_012122_optional_references_cleanup.up,
    down: migration_20260630_012122_optional_references_cleanup.down,
    name: '20260630_012122_optional_references_cleanup',
  },
  {
    up: migration_20260630_012522_reference_enums.up,
    down: migration_20260630_012522_reference_enums.down,
    name: '20260630_012522_reference_enums',
  },
  {
    up: migration_20260630_021449_expanded_proposal_moderation.up,
    down: migration_20260630_021449_expanded_proposal_moderation.down,
    name: '20260630_021449_expanded_proposal_moderation'
  },
];
