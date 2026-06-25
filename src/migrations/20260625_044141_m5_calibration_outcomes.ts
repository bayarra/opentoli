import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_calibration_outcomes_outcome" AS ENUM('accepted_as_is', 'accepted_with_edits', 'needs_regeneration', 'blocked_for_sources', 'duplicate', 'rejected');
  CREATE TYPE "public"."enum_calibration_outcomes_edit_level" AS ENUM('none', 'minor', 'major', 'rewrite', 'not_checked');
  CREATE TYPE "public"."enum_calibration_outcomes_source_assessment" AS ENUM('supported', 'needs_more_sources', 'unsupported', 'not_checked');
  CREATE TYPE "public"."enum_calibration_outcomes_language_assessment" AS ENUM('natural', 'minor_edits', 'major_edits', 'not_checked');
  CREATE TYPE "public"."enum_calibration_outcomes_domain_assessment" AS ENUM('accurate', 'needs_expert_review', 'incorrect', 'not_checked');
  CREATE TYPE "public"."enum_calibration_outcomes_go_no_go_recommendation" AS ENUM('continue', 'tune_prompt', 'pause_batch', 'not_ready');
  CREATE TABLE "calibration_outcomes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"milestone" varchar DEFAULT 'M5' NOT NULL,
  	"ai_draft_id" integer NOT NULL,
  	"generation_job_id" integer NOT NULL,
  	"term_id" integer,
  	"headword_en" varchar NOT NULL,
  	"outcome" "enum_calibration_outcomes_outcome" NOT NULL,
  	"edit_level" "enum_calibration_outcomes_edit_level" DEFAULT 'not_checked' NOT NULL,
  	"source_assessment" "enum_calibration_outcomes_source_assessment" DEFAULT 'not_checked' NOT NULL,
  	"language_assessment" "enum_calibration_outcomes_language_assessment" DEFAULT 'not_checked' NOT NULL,
  	"domain_assessment" "enum_calibration_outcomes_domain_assessment" DEFAULT 'not_checked' NOT NULL,
  	"go_no_go_recommendation" "enum_calibration_outcomes_go_no_go_recommendation",
  	"notes" varchar NOT NULL,
  	"reviewed_by_id" integer NOT NULL,
  	"reviewed_at" timestamp(3) with time zone NOT NULL,
  	"model_provider" varchar,
  	"model_name" varchar,
  	"prompt_version" varchar,
  	"schema_version" varchar,
  	"input_tokens" numeric,
  	"output_tokens" numeric,
  	"estimated_cost_usd" numeric,
  	"latency_ms" numeric,
  	"job_completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "calibration_outcomes_id" integer;
  ALTER TABLE "calibration_outcomes" ADD CONSTRAINT "calibration_outcomes_ai_draft_id_ai_drafts_id_fk" FOREIGN KEY ("ai_draft_id") REFERENCES "public"."ai_drafts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "calibration_outcomes" ADD CONSTRAINT "calibration_outcomes_generation_job_id_generation_jobs_id_fk" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "calibration_outcomes" ADD CONSTRAINT "calibration_outcomes_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "calibration_outcomes" ADD CONSTRAINT "calibration_outcomes_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "calibration_outcomes_milestone_idx" ON "calibration_outcomes" USING btree ("milestone");
  CREATE INDEX "calibration_outcomes_ai_draft_idx" ON "calibration_outcomes" USING btree ("ai_draft_id");
  CREATE INDEX "calibration_outcomes_generation_job_idx" ON "calibration_outcomes" USING btree ("generation_job_id");
  CREATE INDEX "calibration_outcomes_term_idx" ON "calibration_outcomes" USING btree ("term_id");
  CREATE INDEX "calibration_outcomes_headword_en_idx" ON "calibration_outcomes" USING btree ("headword_en");
  CREATE INDEX "calibration_outcomes_outcome_idx" ON "calibration_outcomes" USING btree ("outcome");
  CREATE INDEX "calibration_outcomes_reviewed_by_idx" ON "calibration_outcomes" USING btree ("reviewed_by_id");
  CREATE INDEX "calibration_outcomes_reviewed_at_idx" ON "calibration_outcomes" USING btree ("reviewed_at");
  CREATE INDEX "calibration_outcomes_updated_at_idx" ON "calibration_outcomes" USING btree ("updated_at");
  CREATE INDEX "calibration_outcomes_created_at_idx" ON "calibration_outcomes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_calibration_outcomes_fk" FOREIGN KEY ("calibration_outcomes_id") REFERENCES "public"."calibration_outcomes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_calibration_outcomes_id_idx" ON "payload_locked_documents_rels" USING btree ("calibration_outcomes_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_calibration_outcomes_fk";
  DROP INDEX "payload_locked_documents_rels_calibration_outcomes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "calibration_outcomes_id";
  ALTER TABLE "calibration_outcomes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "calibration_outcomes" CASCADE;
  DROP TYPE "public"."enum_calibration_outcomes_outcome";
  DROP TYPE "public"."enum_calibration_outcomes_edit_level";
  DROP TYPE "public"."enum_calibration_outcomes_source_assessment";
  DROP TYPE "public"."enum_calibration_outcomes_language_assessment";
  DROP TYPE "public"."enum_calibration_outcomes_domain_assessment";
  DROP TYPE "public"."enum_calibration_outcomes_go_no_go_recommendation";`)
}
