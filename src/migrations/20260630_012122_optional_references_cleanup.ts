import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "calibration_outcomes" SET "outcome" = 'needs_regeneration' WHERE "outcome" = 'blocked_for_sources';
  ALTER TABLE "calibration_outcomes" ALTER COLUMN "outcome" SET DATA TYPE text;
  DROP TYPE "public"."enum_calibration_outcomes_outcome";
  CREATE TYPE "public"."enum_calibration_outcomes_outcome" AS ENUM('accepted_as_is', 'accepted_with_edits', 'needs_regeneration', 'duplicate', 'rejected');
  ALTER TABLE "calibration_outcomes" ALTER COLUMN "outcome" SET DATA TYPE "public"."enum_calibration_outcomes_outcome" USING "outcome"::"public"."enum_calibration_outcomes_outcome";
  DROP INDEX "sources_is_verified_idx";
  ALTER TABLE "sources" DROP COLUMN "is_verified";
  ALTER TABLE "calibration_outcomes" DROP COLUMN "source_assessment";
  DROP TYPE "public"."enum_calibration_outcomes_source_assessment";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_calibration_outcomes_source_assessment" AS ENUM('supported', 'needs_more_sources', 'unsupported', 'not_checked');
  ALTER TYPE "public"."enum_calibration_outcomes_outcome" ADD VALUE 'blocked_for_sources' BEFORE 'duplicate';
  ALTER TABLE "sources" ADD COLUMN "is_verified" boolean DEFAULT false;
  ALTER TABLE "calibration_outcomes" ADD COLUMN "source_assessment" "enum_calibration_outcomes_source_assessment" DEFAULT 'not_checked' NOT NULL;
  CREATE INDEX "sources_is_verified_idx" ON "sources" USING btree ("is_verified");`)
}
