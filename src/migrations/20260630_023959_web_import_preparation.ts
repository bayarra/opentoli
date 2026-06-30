import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_import_batches_input_mode" AS ENUM('manual', 'csv', 'manifest');
  CREATE TYPE "public"."enum_import_batch_items_status" AS ENUM('pending', 'accepted', 'rejected', 'duplicate', 'queued');
  ALTER TYPE "public"."enum_import_batches_status" ADD VALUE 'reviewing' BEFORE 'processing';
  ALTER TYPE "public"."enum_import_batches_status" ADD VALUE 'ready' BEFORE 'processing';
  ALTER TYPE "public"."enum_import_batches_status" ADD VALUE 'queued' BEFORE 'processing';
  CREATE TABLE "import_batch_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"import_batch_id" integer NOT NULL,
  	"row_number" numeric NOT NULL,
  	"headword_en" varchar NOT NULL,
  	"normalized_headword_en" varchar NOT NULL,
  	"context_note" varchar,
  	"status" "enum_import_batch_items_status" DEFAULT 'pending' NOT NULL,
  	"validation_messages" jsonb,
  	"term_id" integer,
  	"generation_job_id" integer,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"created_by_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "import_batches" ADD COLUMN "input_mode" "enum_import_batches_input_mode" DEFAULT 'manual' NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "import_batch_items_id" integer;
  ALTER TABLE "import_batch_items" ADD CONSTRAINT "import_batch_items_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "import_batch_items" ADD CONSTRAINT "import_batch_items_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "import_batch_items" ADD CONSTRAINT "import_batch_items_generation_job_id_generation_jobs_id_fk" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "import_batch_items" ADD CONSTRAINT "import_batch_items_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "import_batch_items" ADD CONSTRAINT "import_batch_items_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "import_batch_items_import_batch_idx" ON "import_batch_items" USING btree ("import_batch_id");
  CREATE INDEX "import_batch_items_headword_en_idx" ON "import_batch_items" USING btree ("headword_en");
  CREATE INDEX "import_batch_items_normalized_headword_en_idx" ON "import_batch_items" USING btree ("normalized_headword_en");
  CREATE INDEX "import_batch_items_status_idx" ON "import_batch_items" USING btree ("status");
  CREATE INDEX "import_batch_items_term_idx" ON "import_batch_items" USING btree ("term_id");
  CREATE INDEX "import_batch_items_generation_job_idx" ON "import_batch_items" USING btree ("generation_job_id");
  CREATE INDEX "import_batch_items_reviewed_by_idx" ON "import_batch_items" USING btree ("reviewed_by_id");
  CREATE INDEX "import_batch_items_created_by_idx" ON "import_batch_items" USING btree ("created_by_id");
  CREATE INDEX "import_batch_items_updated_at_idx" ON "import_batch_items" USING btree ("updated_at");
  CREATE INDEX "import_batch_items_created_at_idx" ON "import_batch_items" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_import_batch_items_fk" FOREIGN KEY ("import_batch_items_id") REFERENCES "public"."import_batch_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_import_batch_items_id_idx" ON "payload_locked_documents_rels" USING btree ("import_batch_items_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "import_batches" SET "status" = 'pending' WHERE "status" IN ('reviewing', 'ready');
  UPDATE "import_batches" SET "status" = 'processing' WHERE "status" = 'queued';
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_import_batch_items_fk";
  DROP INDEX "payload_locked_documents_rels_import_batch_items_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "import_batch_items_id";
  ALTER TABLE "import_batch_items" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "import_batch_items" CASCADE;
  
  ALTER TABLE "import_batches" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "import_batches" ALTER COLUMN "status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_import_batches_status";
  CREATE TYPE "public"."enum_import_batches_status" AS ENUM('pending', 'validating', 'processing', 'completed', 'completed_with_errors', 'failed');
  ALTER TABLE "import_batches" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_import_batches_status";
  ALTER TABLE "import_batches" ALTER COLUMN "status" SET DATA TYPE "public"."enum_import_batches_status" USING "status"::"public"."enum_import_batches_status";
  ALTER TABLE "import_batches" DROP COLUMN "input_mode";
  DROP TYPE "public"."enum_import_batches_input_mode";
  DROP TYPE "public"."enum_import_batch_items_status";`)
}
