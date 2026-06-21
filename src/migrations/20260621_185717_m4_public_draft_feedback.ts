import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_drafts_public_visibility" AS ENUM('private', 'public');
  CREATE TYPE "public"."enum_comments_comment_type" AS ENUM('general', 'translation_suggestion', 'usage_question', 'source_note');
  CREATE TYPE "public"."enum_comments_status" AS ENUM('pending', 'approved', 'rejected', 'spam', 'hidden');
  CREATE TABLE "comments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"term_id" integer,
  	"ai_draft_id" integer,
  	"translation_id" integer,
  	"parent_comment_id" integer,
  	"user_id" integer NOT NULL,
  	"body" varchar NOT NULL,
  	"suggested_translation_mn" varchar,
  	"comment_type" "enum_comments_comment_type" DEFAULT 'general' NOT NULL,
  	"status" "enum_comments_status" DEFAULT 'pending' NOT NULL,
  	"moderator_note" varchar,
  	"moderated_by_id" integer,
  	"moderated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "ai_drafts" ADD COLUMN "public_visibility" "enum_ai_drafts_public_visibility" DEFAULT 'private' NOT NULL;
  ALTER TABLE "ai_drafts" ADD COLUMN "public_feedback_opened_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "comments_id" integer;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_ai_draft_id_ai_drafts_id_fk" FOREIGN KEY ("ai_draft_id") REFERENCES "public"."ai_drafts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_translation_id_translations_id_fk" FOREIGN KEY ("translation_id") REFERENCES "public"."translations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_moderated_by_id_users_id_fk" FOREIGN KEY ("moderated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "comments_term_idx" ON "comments" USING btree ("term_id");
  CREATE INDEX "comments_ai_draft_idx" ON "comments" USING btree ("ai_draft_id");
  CREATE INDEX "comments_translation_idx" ON "comments" USING btree ("translation_id");
  CREATE INDEX "comments_parent_comment_idx" ON "comments" USING btree ("parent_comment_id");
  CREATE INDEX "comments_user_idx" ON "comments" USING btree ("user_id");
  CREATE INDEX "comments_status_idx" ON "comments" USING btree ("status");
  CREATE INDEX "comments_moderated_by_idx" ON "comments" USING btree ("moderated_by_id");
  CREATE INDEX "comments_updated_at_idx" ON "comments" USING btree ("updated_at");
  CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comments_fk" FOREIGN KEY ("comments_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ai_drafts_public_visibility_idx" ON "ai_drafts" USING btree ("public_visibility");
  CREATE INDEX "payload_locked_documents_rels_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("comments_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_comments_fk";
  DROP INDEX "payload_locked_documents_rels_comments_id_idx";
  ALTER TABLE "comments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "comments" CASCADE;
  DROP INDEX "ai_drafts_public_visibility_idx";
  ALTER TABLE "ai_drafts" DROP COLUMN "public_visibility";
  ALTER TABLE "ai_drafts" DROP COLUMN "public_feedback_opened_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "comments_id";
  DROP TYPE "public"."enum_ai_drafts_public_visibility";
  DROP TYPE "public"."enum_comments_comment_type";
  DROP TYPE "public"."enum_comments_status";`)
}
