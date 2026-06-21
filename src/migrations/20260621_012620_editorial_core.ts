import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_terms_part_of_speech" AS ENUM('noun', 'verb', 'adjective', 'adverb', 'phrase', 'acronym', 'other');
  CREATE TYPE "public"."enum_terms_workflow_status" AS ENUM('draft', 'needs_review', 'needs_discussion', 'reviewed', 'approved', 'archived');
  CREATE TYPE "public"."enum_terms_review_status" AS ENUM('not_reviewed', 'ai_draft', 'community_reviewed', 'human_reviewed', 'expert_reviewed');
  CREATE TYPE "public"."enum_terms_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__terms_v_version_part_of_speech" AS ENUM('noun', 'verb', 'adjective', 'adverb', 'phrase', 'acronym', 'other');
  CREATE TYPE "public"."enum__terms_v_version_workflow_status" AS ENUM('draft', 'needs_review', 'needs_discussion', 'reviewed', 'approved', 'archived');
  CREATE TYPE "public"."enum__terms_v_version_review_status" AS ENUM('not_reviewed', 'ai_draft', 'community_reviewed', 'human_reviewed', 'expert_reviewed');
  CREATE TYPE "public"."enum__terms_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_translations_translation_type" AS ENUM('recommended', 'alternative', 'context_specific', 'formal', 'informal', 'literal', 'rejected', 'deprecated');
  CREATE TYPE "public"."enum_translations_register" AS ENUM('general', 'formal', 'informal', 'technical', 'academic', 'legal', 'medical', 'business');
  CREATE TYPE "public"."enum_translations_status" AS ENUM('draft', 'needs_review', 'approved', 'rejected', 'deprecated');
  CREATE TYPE "public"."enum_translations_review_status" AS ENUM('not_reviewed', 'ai_draft', 'community_reviewed', 'human_reviewed', 'expert_reviewed');
  CREATE TYPE "public"."enum_sources_source_type" AS ENUM('government', 'standards_body', 'official_documentation', 'academic', 'dictionary', 'textbook', 'professional_usage', 'news', 'community_discussion', 'other');
  CREATE TYPE "public"."enum_examples_status" AS ENUM('draft', 'needs_review', 'approved', 'rejected');
  CREATE TYPE "public"."enum_examples_review_status" AS ENUM('not_reviewed', 'ai_draft', 'community_reviewed', 'human_reviewed', 'expert_reviewed');
  CREATE TYPE "public"."enum_reviews_review_type" AS ENUM('linguistic', 'technical', 'editorial', 'source_validation', 'final_approval');
  CREATE TYPE "public"."enum_reviews_decision" AS ENUM('approved', 'changes_requested', 'rejected');
  CREATE TYPE "public"."enum_import_batches_status" AS ENUM('pending', 'validating', 'processing', 'completed', 'completed_with_errors', 'failed');
  CREATE TABLE "terms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"headword_en" varchar,
  	"normalized_headword_en" varchar,
  	"slug" varchar,
  	"part_of_speech" "enum_terms_part_of_speech",
  	"pronunciation" varchar,
  	"short_definition_en" varchar,
  	"explanation_en" varchar,
  	"explanation_mn" varchar,
  	"usage_note_en" varchar,
  	"usage_note_mn" varchar,
  	"workflow_status" "enum_terms_workflow_status" DEFAULT 'draft',
  	"review_status" "enum_terms_review_status" DEFAULT 'not_reviewed',
  	"recommended_translation_id" integer,
  	"created_by_id" integer,
  	"reviewed_by_id" integer,
  	"approved_by_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_terms_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "terms_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"contexts_id" integer,
  	"terms_id" integer
  );
  
  CREATE TABLE "_terms_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_headword_en" varchar,
  	"version_normalized_headword_en" varchar,
  	"version_slug" varchar,
  	"version_part_of_speech" "enum__terms_v_version_part_of_speech",
  	"version_pronunciation" varchar,
  	"version_short_definition_en" varchar,
  	"version_explanation_en" varchar,
  	"version_explanation_mn" varchar,
  	"version_usage_note_en" varchar,
  	"version_usage_note_mn" varchar,
  	"version_workflow_status" "enum__terms_v_version_workflow_status" DEFAULT 'draft',
  	"version_review_status" "enum__terms_v_version_review_status" DEFAULT 'not_reviewed',
  	"version_recommended_translation_id" integer,
  	"version_created_by_id" integer,
  	"version_reviewed_by_id" integer,
  	"version_approved_by_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__terms_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_terms_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"contexts_id" integer,
  	"terms_id" integer
  );
  
  CREATE TABLE "translations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"term_id" integer NOT NULL,
  	"translation_mn" varchar NOT NULL,
  	"translation_type" "enum_translations_translation_type" DEFAULT 'alternative' NOT NULL,
  	"context_id" integer,
  	"register" "enum_translations_register" DEFAULT 'general' NOT NULL,
  	"explanation_en" varchar,
  	"explanation_mn" varchar,
  	"usage_note" varchar,
  	"status" "enum_translations_status" DEFAULT 'draft' NOT NULL,
  	"review_status" "enum_translations_review_status" DEFAULT 'not_reviewed' NOT NULL,
  	"vote_score" numeric DEFAULT 0,
  	"created_by_id" integer,
  	"reviewed_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"term_id" integer NOT NULL,
  	"translation_id" integer,
  	"title" varchar NOT NULL,
  	"publisher" varchar NOT NULL,
  	"author" varchar,
  	"url" varchar NOT NULL,
  	"publication_date" timestamp(3) with time zone,
  	"accessed_date" timestamp(3) with time zone,
  	"source_type" "enum_sources_source_type" NOT NULL,
  	"license_note" varchar,
  	"excerpt_note" varchar,
  	"is_verified" boolean DEFAULT false,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "examples" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"term_id" integer NOT NULL,
  	"translation_id" integer,
  	"example_en" varchar NOT NULL,
  	"example_mn" varchar NOT NULL,
  	"context_id" integer,
  	"source_id" integer,
  	"status" "enum_examples_status" DEFAULT 'draft' NOT NULL,
  	"review_status" "enum_examples_review_status" DEFAULT 'not_reviewed' NOT NULL,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"term_id" integer NOT NULL,
  	"translation_id" integer,
  	"reviewer_id" integer NOT NULL,
  	"review_type" "enum_reviews_review_type" NOT NULL,
  	"decision" "enum_reviews_decision" NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "import_batches" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"source_title" varchar NOT NULL,
  	"source_url" varchar,
  	"category_id" integer,
  	"status" "enum_import_batches_status" DEFAULT 'pending' NOT NULL,
  	"prompt_version" varchar,
  	"model_name" varchar,
  	"schema_version" varchar,
  	"total_rows" numeric DEFAULT 0,
  	"accepted_rows" numeric DEFAULT 0,
  	"rejected_rows" numeric DEFAULT 0,
  	"duplicate_rows" numeric DEFAULT 0,
  	"validation_report" jsonb,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "terms_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "translations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sources_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "examples_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "import_batches_id" integer;
  ALTER TABLE "terms" ADD CONSTRAINT "terms_recommended_translation_id_translations_id_fk" FOREIGN KEY ("recommended_translation_id") REFERENCES "public"."translations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "terms" ADD CONSTRAINT "terms_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "terms" ADD CONSTRAINT "terms_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "terms" ADD CONSTRAINT "terms_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "terms_rels" ADD CONSTRAINT "terms_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "terms_rels" ADD CONSTRAINT "terms_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "terms_rels" ADD CONSTRAINT "terms_rels_contexts_fk" FOREIGN KEY ("contexts_id") REFERENCES "public"."contexts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "terms_rels" ADD CONSTRAINT "terms_rels_terms_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_terms_v" ADD CONSTRAINT "_terms_v_parent_id_terms_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_terms_v" ADD CONSTRAINT "_terms_v_version_recommended_translation_id_translations_id_fk" FOREIGN KEY ("version_recommended_translation_id") REFERENCES "public"."translations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_terms_v" ADD CONSTRAINT "_terms_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_terms_v" ADD CONSTRAINT "_terms_v_version_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_terms_v" ADD CONSTRAINT "_terms_v_version_approved_by_id_users_id_fk" FOREIGN KEY ("version_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_terms_v_rels" ADD CONSTRAINT "_terms_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_terms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_terms_v_rels" ADD CONSTRAINT "_terms_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_terms_v_rels" ADD CONSTRAINT "_terms_v_rels_contexts_fk" FOREIGN KEY ("contexts_id") REFERENCES "public"."contexts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_terms_v_rels" ADD CONSTRAINT "_terms_v_rels_terms_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "translations" ADD CONSTRAINT "translations_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "translations" ADD CONSTRAINT "translations_context_id_contexts_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."contexts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "translations" ADD CONSTRAINT "translations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "translations" ADD CONSTRAINT "translations_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sources" ADD CONSTRAINT "sources_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sources" ADD CONSTRAINT "sources_translation_id_translations_id_fk" FOREIGN KEY ("translation_id") REFERENCES "public"."translations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sources" ADD CONSTRAINT "sources_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "examples" ADD CONSTRAINT "examples_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "examples" ADD CONSTRAINT "examples_translation_id_translations_id_fk" FOREIGN KEY ("translation_id") REFERENCES "public"."translations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "examples" ADD CONSTRAINT "examples_context_id_contexts_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."contexts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "examples" ADD CONSTRAINT "examples_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "examples" ADD CONSTRAINT "examples_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_translation_id_translations_id_fk" FOREIGN KEY ("translation_id") REFERENCES "public"."translations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "terms_headword_en_idx" ON "terms" USING btree ("headword_en");
  CREATE UNIQUE INDEX "terms_normalized_headword_en_idx" ON "terms" USING btree ("normalized_headword_en");
  CREATE UNIQUE INDEX "terms_slug_idx" ON "terms" USING btree ("slug");
  CREATE INDEX "terms_workflow_status_idx" ON "terms" USING btree ("workflow_status");
  CREATE INDEX "terms_review_status_idx" ON "terms" USING btree ("review_status");
  CREATE INDEX "terms_recommended_translation_idx" ON "terms" USING btree ("recommended_translation_id");
  CREATE INDEX "terms_created_by_idx" ON "terms" USING btree ("created_by_id");
  CREATE INDEX "terms_reviewed_by_idx" ON "terms" USING btree ("reviewed_by_id");
  CREATE INDEX "terms_approved_by_idx" ON "terms" USING btree ("approved_by_id");
  CREATE INDEX "terms_published_at_idx" ON "terms" USING btree ("published_at");
  CREATE INDEX "terms_updated_at_idx" ON "terms" USING btree ("updated_at");
  CREATE INDEX "terms_created_at_idx" ON "terms" USING btree ("created_at");
  CREATE INDEX "terms__status_idx" ON "terms" USING btree ("_status");
  CREATE INDEX "terms_rels_order_idx" ON "terms_rels" USING btree ("order");
  CREATE INDEX "terms_rels_parent_idx" ON "terms_rels" USING btree ("parent_id");
  CREATE INDEX "terms_rels_path_idx" ON "terms_rels" USING btree ("path");
  CREATE INDEX "terms_rels_categories_id_idx" ON "terms_rels" USING btree ("categories_id");
  CREATE INDEX "terms_rels_contexts_id_idx" ON "terms_rels" USING btree ("contexts_id");
  CREATE INDEX "terms_rels_terms_id_idx" ON "terms_rels" USING btree ("terms_id");
  CREATE INDEX "_terms_v_parent_idx" ON "_terms_v" USING btree ("parent_id");
  CREATE INDEX "_terms_v_version_version_headword_en_idx" ON "_terms_v" USING btree ("version_headword_en");
  CREATE INDEX "_terms_v_version_version_normalized_headword_en_idx" ON "_terms_v" USING btree ("version_normalized_headword_en");
  CREATE INDEX "_terms_v_version_version_slug_idx" ON "_terms_v" USING btree ("version_slug");
  CREATE INDEX "_terms_v_version_version_workflow_status_idx" ON "_terms_v" USING btree ("version_workflow_status");
  CREATE INDEX "_terms_v_version_version_review_status_idx" ON "_terms_v" USING btree ("version_review_status");
  CREATE INDEX "_terms_v_version_version_recommended_translation_idx" ON "_terms_v" USING btree ("version_recommended_translation_id");
  CREATE INDEX "_terms_v_version_version_created_by_idx" ON "_terms_v" USING btree ("version_created_by_id");
  CREATE INDEX "_terms_v_version_version_reviewed_by_idx" ON "_terms_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "_terms_v_version_version_approved_by_idx" ON "_terms_v" USING btree ("version_approved_by_id");
  CREATE INDEX "_terms_v_version_version_published_at_idx" ON "_terms_v" USING btree ("version_published_at");
  CREATE INDEX "_terms_v_version_version_updated_at_idx" ON "_terms_v" USING btree ("version_updated_at");
  CREATE INDEX "_terms_v_version_version_created_at_idx" ON "_terms_v" USING btree ("version_created_at");
  CREATE INDEX "_terms_v_version_version__status_idx" ON "_terms_v" USING btree ("version__status");
  CREATE INDEX "_terms_v_created_at_idx" ON "_terms_v" USING btree ("created_at");
  CREATE INDEX "_terms_v_updated_at_idx" ON "_terms_v" USING btree ("updated_at");
  CREATE INDEX "_terms_v_latest_idx" ON "_terms_v" USING btree ("latest");
  CREATE INDEX "_terms_v_rels_order_idx" ON "_terms_v_rels" USING btree ("order");
  CREATE INDEX "_terms_v_rels_parent_idx" ON "_terms_v_rels" USING btree ("parent_id");
  CREATE INDEX "_terms_v_rels_path_idx" ON "_terms_v_rels" USING btree ("path");
  CREATE INDEX "_terms_v_rels_categories_id_idx" ON "_terms_v_rels" USING btree ("categories_id");
  CREATE INDEX "_terms_v_rels_contexts_id_idx" ON "_terms_v_rels" USING btree ("contexts_id");
  CREATE INDEX "_terms_v_rels_terms_id_idx" ON "_terms_v_rels" USING btree ("terms_id");
  CREATE INDEX "translations_term_idx" ON "translations" USING btree ("term_id");
  CREATE INDEX "translations_translation_mn_idx" ON "translations" USING btree ("translation_mn");
  CREATE INDEX "translations_context_idx" ON "translations" USING btree ("context_id");
  CREATE INDEX "translations_status_idx" ON "translations" USING btree ("status");
  CREATE INDEX "translations_created_by_idx" ON "translations" USING btree ("created_by_id");
  CREATE INDEX "translations_reviewed_by_idx" ON "translations" USING btree ("reviewed_by_id");
  CREATE INDEX "translations_updated_at_idx" ON "translations" USING btree ("updated_at");
  CREATE INDEX "translations_created_at_idx" ON "translations" USING btree ("created_at");
  CREATE INDEX "sources_term_idx" ON "sources" USING btree ("term_id");
  CREATE INDEX "sources_translation_idx" ON "sources" USING btree ("translation_id");
  CREATE INDEX "sources_is_verified_idx" ON "sources" USING btree ("is_verified");
  CREATE INDEX "sources_created_by_idx" ON "sources" USING btree ("created_by_id");
  CREATE INDEX "sources_updated_at_idx" ON "sources" USING btree ("updated_at");
  CREATE INDEX "sources_created_at_idx" ON "sources" USING btree ("created_at");
  CREATE INDEX "examples_term_idx" ON "examples" USING btree ("term_id");
  CREATE INDEX "examples_translation_idx" ON "examples" USING btree ("translation_id");
  CREATE INDEX "examples_context_idx" ON "examples" USING btree ("context_id");
  CREATE INDEX "examples_source_idx" ON "examples" USING btree ("source_id");
  CREATE INDEX "examples_status_idx" ON "examples" USING btree ("status");
  CREATE INDEX "examples_created_by_idx" ON "examples" USING btree ("created_by_id");
  CREATE INDEX "examples_updated_at_idx" ON "examples" USING btree ("updated_at");
  CREATE INDEX "examples_created_at_idx" ON "examples" USING btree ("created_at");
  CREATE INDEX "reviews_term_idx" ON "reviews" USING btree ("term_id");
  CREATE INDEX "reviews_translation_idx" ON "reviews" USING btree ("translation_id");
  CREATE INDEX "reviews_reviewer_idx" ON "reviews" USING btree ("reviewer_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "import_batches_category_idx" ON "import_batches" USING btree ("category_id");
  CREATE INDEX "import_batches_status_idx" ON "import_batches" USING btree ("status");
  CREATE INDEX "import_batches_created_by_idx" ON "import_batches" USING btree ("created_by_id");
  CREATE INDEX "import_batches_updated_at_idx" ON "import_batches" USING btree ("updated_at");
  CREATE INDEX "import_batches_created_at_idx" ON "import_batches" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_terms_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_translations_fk" FOREIGN KEY ("translations_id") REFERENCES "public"."translations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_examples_fk" FOREIGN KEY ("examples_id") REFERENCES "public"."examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_import_batches_fk" FOREIGN KEY ("import_batches_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_terms_id_idx" ON "payload_locked_documents_rels" USING btree ("terms_id");
  CREATE INDEX "payload_locked_documents_rels_translations_id_idx" ON "payload_locked_documents_rels" USING btree ("translations_id");
  CREATE INDEX "payload_locked_documents_rels_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("sources_id");
  CREATE INDEX "payload_locked_documents_rels_examples_id_idx" ON "payload_locked_documents_rels" USING btree ("examples_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_import_batches_id_idx" ON "payload_locked_documents_rels" USING btree ("import_batches_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "terms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "terms_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_terms_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_terms_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "translations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "import_batches" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "terms" CASCADE;
  DROP TABLE "terms_rels" CASCADE;
  DROP TABLE "_terms_v" CASCADE;
  DROP TABLE "_terms_v_rels" CASCADE;
  DROP TABLE "translations" CASCADE;
  DROP TABLE "sources" CASCADE;
  DROP TABLE "examples" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "import_batches" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_terms_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_translations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sources_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_examples_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_import_batches_fk";
  
  DROP INDEX "payload_locked_documents_rels_terms_id_idx";
  DROP INDEX "payload_locked_documents_rels_translations_id_idx";
  DROP INDEX "payload_locked_documents_rels_sources_id_idx";
  DROP INDEX "payload_locked_documents_rels_examples_id_idx";
  DROP INDEX "payload_locked_documents_rels_reviews_id_idx";
  DROP INDEX "payload_locked_documents_rels_import_batches_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "terms_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "translations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sources_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "examples_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reviews_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "import_batches_id";
  DROP TYPE "public"."enum_terms_part_of_speech";
  DROP TYPE "public"."enum_terms_workflow_status";
  DROP TYPE "public"."enum_terms_review_status";
  DROP TYPE "public"."enum_terms_status";
  DROP TYPE "public"."enum__terms_v_version_part_of_speech";
  DROP TYPE "public"."enum__terms_v_version_workflow_status";
  DROP TYPE "public"."enum__terms_v_version_review_status";
  DROP TYPE "public"."enum__terms_v_version_status";
  DROP TYPE "public"."enum_translations_translation_type";
  DROP TYPE "public"."enum_translations_register";
  DROP TYPE "public"."enum_translations_status";
  DROP TYPE "public"."enum_translations_review_status";
  DROP TYPE "public"."enum_sources_source_type";
  DROP TYPE "public"."enum_examples_status";
  DROP TYPE "public"."enum_examples_review_status";
  DROP TYPE "public"."enum_reviews_review_type";
  DROP TYPE "public"."enum_reviews_decision";
  DROP TYPE "public"."enum_import_batches_status";`)
}
