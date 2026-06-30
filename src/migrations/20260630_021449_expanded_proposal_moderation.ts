import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_comments_comment_type" ADD VALUE 'example_suggestion' BEFORE 'usage_question';
  ALTER TABLE "comments" ADD COLUMN "suggested_example_en" varchar;
  ALTER TABLE "comments" ADD COLUMN "suggested_example_mn" varchar;
  ALTER TABLE "comments" ADD COLUMN "suggested_reference_title" varchar;
  ALTER TABLE "comments" ADD COLUMN "suggested_reference_url" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DATA TYPE text;
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DEFAULT 'general'::text;
  DROP TYPE "public"."enum_comments_comment_type";
  CREATE TYPE "public"."enum_comments_comment_type" AS ENUM('general', 'translation_suggestion', 'usage_question', 'reference_note');
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DEFAULT 'general'::"public"."enum_comments_comment_type";
  ALTER TABLE "comments" ALTER COLUMN "comment_type" SET DATA TYPE "public"."enum_comments_comment_type" USING "comment_type"::"public"."enum_comments_comment_type";
  ALTER TABLE "comments" DROP COLUMN "suggested_example_en";
  ALTER TABLE "comments" DROP COLUMN "suggested_example_mn";
  ALTER TABLE "comments" DROP COLUMN "suggested_reference_title";
  ALTER TABLE "comments" DROP COLUMN "suggested_reference_url";`)
}
