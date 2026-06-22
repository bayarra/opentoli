import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_draft_decisions_action" AS ENUM('accept', 'modify', 'reject', 'reroute', 'merge');
  CREATE TYPE "public"."enum_ai_draft_decisions_previous_status" AS ENUM('generated', 'editing', 'needs_review', 'accepted', 'partially_accepted', 'rejected');
  CREATE TYPE "public"."enum_ai_draft_decisions_new_status" AS ENUM('generated', 'editing', 'needs_review', 'accepted', 'partially_accepted', 'rejected');
  CREATE TYPE "public"."enum_ai_draft_decisions_previous_review_route" AS ENUM('fast_review', 'language_review', 'domain_review', 'community_discussion', 'duplicate_review', 'blocked');
  CREATE TYPE "public"."enum_ai_draft_decisions_new_review_route" AS ENUM('fast_review', 'language_review', 'domain_review', 'community_discussion', 'duplicate_review', 'blocked');
  CREATE TYPE "public"."enum_ai_draft_decisions_risk_level" AS ENUM('low', 'medium', 'high');
  ALTER TYPE "public"."enum_ai_drafts_review_outcome" ADD VALUE 'merged';
  CREATE TABLE "ai_draft_decisions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ai_draft_id" integer NOT NULL,
  	"actor_id" integer NOT NULL,
  	"action" "enum_ai_draft_decisions_action" NOT NULL,
  	"previous_status" "enum_ai_draft_decisions_previous_status" NOT NULL,
  	"new_status" "enum_ai_draft_decisions_new_status" NOT NULL,
  	"previous_review_route" "enum_ai_draft_decisions_previous_review_route" NOT NULL,
  	"new_review_route" "enum_ai_draft_decisions_new_review_route" NOT NULL,
  	"risk_level" "enum_ai_draft_decisions_risk_level" NOT NULL,
  	"selected_translation_mn" varchar,
  	"accepted_fields" jsonb,
  	"modified_fields" jsonb,
  	"rejection_reasons" jsonb,
  	"notes" varchar NOT NULL,
  	"resulting_term_id" integer,
  	"resulting_translation_id" integer,
  	"merge_target_term_id" integer,
  	"decision_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "ai_drafts" ADD COLUMN "decided_at" timestamp(3) with time zone;
  ALTER TABLE "ai_drafts" ADD COLUMN "merged_into_term_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_draft_decisions_id" integer;
  ALTER TABLE "ai_draft_decisions" ADD CONSTRAINT "ai_draft_decisions_ai_draft_id_ai_drafts_id_fk" FOREIGN KEY ("ai_draft_id") REFERENCES "public"."ai_drafts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_draft_decisions" ADD CONSTRAINT "ai_draft_decisions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_draft_decisions" ADD CONSTRAINT "ai_draft_decisions_resulting_term_id_terms_id_fk" FOREIGN KEY ("resulting_term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_draft_decisions" ADD CONSTRAINT "ai_draft_decisions_resulting_translation_id_translations_id_fk" FOREIGN KEY ("resulting_translation_id") REFERENCES "public"."translations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_draft_decisions" ADD CONSTRAINT "ai_draft_decisions_merge_target_term_id_terms_id_fk" FOREIGN KEY ("merge_target_term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ai_draft_decisions_ai_draft_idx" ON "ai_draft_decisions" USING btree ("ai_draft_id");
  CREATE INDEX "ai_draft_decisions_actor_idx" ON "ai_draft_decisions" USING btree ("actor_id");
  CREATE INDEX "ai_draft_decisions_action_idx" ON "ai_draft_decisions" USING btree ("action");
  CREATE INDEX "ai_draft_decisions_resulting_term_idx" ON "ai_draft_decisions" USING btree ("resulting_term_id");
  CREATE INDEX "ai_draft_decisions_resulting_translation_idx" ON "ai_draft_decisions" USING btree ("resulting_translation_id");
  CREATE INDEX "ai_draft_decisions_merge_target_term_idx" ON "ai_draft_decisions" USING btree ("merge_target_term_id");
  CREATE INDEX "ai_draft_decisions_decision_at_idx" ON "ai_draft_decisions" USING btree ("decision_at");
  CREATE INDEX "ai_draft_decisions_updated_at_idx" ON "ai_draft_decisions" USING btree ("updated_at");
  CREATE INDEX "ai_draft_decisions_created_at_idx" ON "ai_draft_decisions" USING btree ("created_at");
  ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_merged_into_term_id_terms_id_fk" FOREIGN KEY ("merged_into_term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_draft_decisions_fk" FOREIGN KEY ("ai_draft_decisions_id") REFERENCES "public"."ai_draft_decisions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ai_drafts_merged_into_term_idx" ON "ai_drafts" USING btree ("merged_into_term_id");
  CREATE INDEX "payload_locked_documents_rels_ai_draft_decisions_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_draft_decisions_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_draft_decisions_fk";
  DROP INDEX "payload_locked_documents_rels_ai_draft_decisions_id_idx";
  ALTER TABLE "ai_draft_decisions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_draft_decisions" CASCADE;
  ALTER TABLE "ai_drafts" DROP CONSTRAINT "ai_drafts_merged_into_term_id_terms_id_fk";
  ALTER TABLE "ai_drafts" ALTER COLUMN "review_outcome" SET DATA TYPE text;
  UPDATE "ai_drafts" SET "review_outcome" = 'rejected' WHERE "review_outcome" = 'merged';
  DROP TYPE "public"."enum_ai_drafts_review_outcome";
  CREATE TYPE "public"."enum_ai_drafts_review_outcome" AS ENUM('accepted', 'modified', 'rejected');
  ALTER TABLE "ai_drafts" ALTER COLUMN "review_outcome" SET DATA TYPE "public"."enum_ai_drafts_review_outcome" USING "review_outcome"::"public"."enum_ai_drafts_review_outcome";
  DROP INDEX "ai_drafts_merged_into_term_idx";
  ALTER TABLE "ai_drafts" DROP COLUMN "decided_at";
  ALTER TABLE "ai_drafts" DROP COLUMN "merged_into_term_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_draft_decisions_id";
  DROP TYPE "public"."enum_ai_draft_decisions_action";
  DROP TYPE "public"."enum_ai_draft_decisions_previous_status";
  DROP TYPE "public"."enum_ai_draft_decisions_new_status";
  DROP TYPE "public"."enum_ai_draft_decisions_previous_review_route";
  DROP TYPE "public"."enum_ai_draft_decisions_new_review_route";
  DROP TYPE "public"."enum_ai_draft_decisions_risk_level";`)
}
