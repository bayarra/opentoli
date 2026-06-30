import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "reviews" SET "review_type" = 'editorial' WHERE "review_type" = 'source_validation';
  ALTER TABLE "reviews" ALTER COLUMN "review_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_reviews_review_type";
  CREATE TYPE "public"."enum_reviews_review_type" AS ENUM('linguistic', 'technical', 'editorial', 'final_approval');
  ALTER TABLE "reviews" ALTER COLUMN "review_type" SET DATA TYPE "public"."enum_reviews_review_type" USING "review_type"::"public"."enum_reviews_review_type";
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DATA TYPE text;
  UPDATE "comments" SET "comment_type" = 'reference_note' WHERE "comment_type" = 'source_note';
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DEFAULT 'general'::text;
  DROP TYPE "public"."enum_comments_comment_type";
  CREATE TYPE "public"."enum_comments_comment_type" AS ENUM('general', 'translation_suggestion', 'usage_question', 'reference_note');
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DEFAULT 'general'::"public"."enum_comments_comment_type";
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DATA TYPE "public"."enum_comments_comment_type" USING "comment_type"::"public"."enum_comments_comment_type";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_reviews_review_type" ADD VALUE 'source_validation' BEFORE 'final_approval';
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DATA TYPE text;
  UPDATE "comments" SET "comment_type" = 'source_note' WHERE "comment_type" = 'reference_note';
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DEFAULT 'general'::text;
  DROP TYPE "public"."enum_comments_comment_type";
  CREATE TYPE "public"."enum_comments_comment_type" AS ENUM('general', 'translation_suggestion', 'usage_question', 'source_note');
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DEFAULT 'general'::"public"."enum_comments_comment_type";
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DATA TYPE "public"."enum_comments_comment_type" USING "comment_type"::"public"."enum_comments_comment_type";`)
}
