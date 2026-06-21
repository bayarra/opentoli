import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_generation_jobs_status" AS ENUM('queued', 'running', 'retry_scheduled', 'completed', 'failed', 'cancelled');
  CREATE TYPE "public"."enum_generation_jobs_stage" AS ENUM('research', 'generation', 'critique', 'validation', 'routing', 'complete');
  CREATE TYPE "public"."enum_ai_drafts_confidence_dimensions_concept_understanding" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_ai_drafts_confidence_dimensions_translation_naturalness" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_ai_drafts_confidence_dimensions_domain_accuracy" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_ai_drafts_confidence_dimensions_source_support" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_ai_drafts_confidence_dimensions_ambiguity" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_ai_drafts_risk_level" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_ai_drafts_review_route" AS ENUM('fast_review', 'language_review', 'domain_review', 'community_discussion', 'duplicate_review', 'blocked');
  CREATE TYPE "public"."enum_ai_drafts_status" AS ENUM('generated', 'editing', 'needs_review', 'accepted', 'partially_accepted', 'rejected');
  CREATE TYPE "public"."enum_ai_drafts_review_outcome" AS ENUM('accepted', 'modified', 'rejected');
  CREATE TABLE "generation_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"input_headword" varchar NOT NULL,
  	"category_id" integer NOT NULL,
  	"context_id" integer,
  	"import_batch_id" integer,
  	"status" "enum_generation_jobs_status" DEFAULT 'queued' NOT NULL,
  	"stage" "enum_generation_jobs_stage" DEFAULT 'research' NOT NULL,
  	"attempt_count" numeric DEFAULT 0 NOT NULL,
  	"max_attempts" numeric DEFAULT 3 NOT NULL,
  	"model_provider" varchar NOT NULL,
  	"model_name" varchar NOT NULL,
  	"research_prompt_version" varchar NOT NULL,
  	"generation_prompt_version" varchar NOT NULL,
  	"critique_prompt_version" varchar NOT NULL,
  	"schema_version" varchar DEFAULT '1.0.0' NOT NULL,
  	"input_payload" jsonb NOT NULL,
  	"source_input_snapshot" jsonb NOT NULL,
  	"research_raw_output" jsonb,
  	"generation_raw_output" jsonb,
  	"critique_raw_output" jsonb,
  	"validation_errors" jsonb,
  	"error_code" varchar,
  	"error_message" varchar,
  	"queued_at" timestamp(3) with time zone NOT NULL,
  	"started_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"next_retry_at" timestamp(3) with time zone,
  	"input_tokens" numeric,
  	"output_tokens" numeric,
  	"estimated_cost_usd" numeric,
  	"latency_ms" numeric,
  	"requested_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_drafts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"term_id" integer,
  	"generation_job_id" integer NOT NULL,
  	"input_headword" varchar NOT NULL,
  	"input_category_id" integer NOT NULL,
  	"input_context_id" integer,
  	"research_payload" jsonb NOT NULL,
  	"generated_payload" jsonb NOT NULL,
  	"critique_payload" jsonb NOT NULL,
  	"schema_version" varchar DEFAULT '1.0.0' NOT NULL,
  	"model_provider" varchar NOT NULL,
  	"model_name" varchar NOT NULL,
  	"prompt_version" varchar NOT NULL,
  	"confidence_dimensions_concept_understanding" "enum_ai_drafts_confidence_dimensions_concept_understanding" NOT NULL,
  	"confidence_dimensions_translation_naturalness" "enum_ai_drafts_confidence_dimensions_translation_naturalness" NOT NULL,
  	"confidence_dimensions_domain_accuracy" "enum_ai_drafts_confidence_dimensions_domain_accuracy" NOT NULL,
  	"confidence_dimensions_source_support" "enum_ai_drafts_confidence_dimensions_source_support" NOT NULL,
  	"confidence_dimensions_ambiguity" "enum_ai_drafts_confidence_dimensions_ambiguity" NOT NULL,
  	"risk_level" "enum_ai_drafts_risk_level" NOT NULL,
  	"review_route" "enum_ai_drafts_review_route" NOT NULL,
  	"status" "enum_ai_drafts_status" DEFAULT 'generated' NOT NULL,
  	"generated_by" varchar NOT NULL,
  	"reviewed_by_id" integer,
  	"review_outcome" "enum_ai_drafts_review_outcome",
  	"accepted_fields" jsonb,
  	"modified_fields" jsonb,
  	"rejection_reasons" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_drafts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"sources_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "generation_jobs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_drafts_id" integer;
  ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_context_id_contexts_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."contexts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_generation_job_id_generation_jobs_id_fk" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_input_category_id_categories_id_fk" FOREIGN KEY ("input_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_input_context_id_contexts_id_fk" FOREIGN KEY ("input_context_id") REFERENCES "public"."contexts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_drafts_rels" ADD CONSTRAINT "ai_drafts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ai_drafts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_drafts_rels" ADD CONSTRAINT "ai_drafts_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "generation_jobs_idempotency_key_idx" ON "generation_jobs" USING btree ("idempotency_key");
  CREATE INDEX "generation_jobs_input_headword_idx" ON "generation_jobs" USING btree ("input_headword");
  CREATE INDEX "generation_jobs_category_idx" ON "generation_jobs" USING btree ("category_id");
  CREATE INDEX "generation_jobs_context_idx" ON "generation_jobs" USING btree ("context_id");
  CREATE INDEX "generation_jobs_import_batch_idx" ON "generation_jobs" USING btree ("import_batch_id");
  CREATE INDEX "generation_jobs_status_idx" ON "generation_jobs" USING btree ("status");
  CREATE INDEX "generation_jobs_stage_idx" ON "generation_jobs" USING btree ("stage");
  CREATE INDEX "generation_jobs_requested_by_idx" ON "generation_jobs" USING btree ("requested_by_id");
  CREATE INDEX "generation_jobs_updated_at_idx" ON "generation_jobs" USING btree ("updated_at");
  CREATE INDEX "generation_jobs_created_at_idx" ON "generation_jobs" USING btree ("created_at");
  CREATE INDEX "ai_drafts_term_idx" ON "ai_drafts" USING btree ("term_id");
  CREATE UNIQUE INDEX "ai_drafts_generation_job_idx" ON "ai_drafts" USING btree ("generation_job_id");
  CREATE INDEX "ai_drafts_input_headword_idx" ON "ai_drafts" USING btree ("input_headword");
  CREATE INDEX "ai_drafts_input_category_idx" ON "ai_drafts" USING btree ("input_category_id");
  CREATE INDEX "ai_drafts_input_context_idx" ON "ai_drafts" USING btree ("input_context_id");
  CREATE INDEX "ai_drafts_risk_level_idx" ON "ai_drafts" USING btree ("risk_level");
  CREATE INDEX "ai_drafts_review_route_idx" ON "ai_drafts" USING btree ("review_route");
  CREATE INDEX "ai_drafts_status_idx" ON "ai_drafts" USING btree ("status");
  CREATE INDEX "ai_drafts_reviewed_by_idx" ON "ai_drafts" USING btree ("reviewed_by_id");
  CREATE INDEX "ai_drafts_updated_at_idx" ON "ai_drafts" USING btree ("updated_at");
  CREATE INDEX "ai_drafts_created_at_idx" ON "ai_drafts" USING btree ("created_at");
  CREATE INDEX "ai_drafts_rels_order_idx" ON "ai_drafts_rels" USING btree ("order");
  CREATE INDEX "ai_drafts_rels_parent_idx" ON "ai_drafts_rels" USING btree ("parent_id");
  CREATE INDEX "ai_drafts_rels_path_idx" ON "ai_drafts_rels" USING btree ("path");
  CREATE INDEX "ai_drafts_rels_sources_id_idx" ON "ai_drafts_rels" USING btree ("sources_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_generation_jobs_fk" FOREIGN KEY ("generation_jobs_id") REFERENCES "public"."generation_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_drafts_fk" FOREIGN KEY ("ai_drafts_id") REFERENCES "public"."ai_drafts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_generation_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("generation_jobs_id");
  CREATE INDEX "payload_locked_documents_rels_ai_drafts_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_drafts_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "generation_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_drafts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_drafts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_generation_jobs_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_drafts_fk";
  DROP INDEX "payload_locked_documents_rels_generation_jobs_id_idx";
  DROP INDEX "payload_locked_documents_rels_ai_drafts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "generation_jobs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_drafts_id";
  DROP TABLE "ai_drafts_rels" CASCADE;
  DROP TABLE "ai_drafts" CASCADE;
  DROP TABLE "generation_jobs" CASCADE;
  DROP TYPE "public"."enum_generation_jobs_status";
  DROP TYPE "public"."enum_generation_jobs_stage";
  DROP TYPE "public"."enum_ai_drafts_confidence_dimensions_concept_understanding";
  DROP TYPE "public"."enum_ai_drafts_confidence_dimensions_translation_naturalness";
  DROP TYPE "public"."enum_ai_drafts_confidence_dimensions_domain_accuracy";
  DROP TYPE "public"."enum_ai_drafts_confidence_dimensions_source_support";
  DROP TYPE "public"."enum_ai_drafts_confidence_dimensions_ambiguity";
  DROP TYPE "public"."enum_ai_drafts_risk_level";
  DROP TYPE "public"."enum_ai_drafts_review_route";
  DROP TYPE "public"."enum_ai_drafts_status";
  DROP TYPE "public"."enum_ai_drafts_review_outcome";`)
}
