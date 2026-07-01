import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "comments"
    SET
      "status" = 'approved',
      "moderated_at" = NULL,
      "moderated_by_id" = NULL,
      "moderator_note" = NULL
    WHERE "status" = 'pending';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "comments"
    SET "status" = 'pending'
    WHERE
      "status" = 'approved'
      AND "moderated_at" IS NULL
      AND "moderated_by_id" IS NULL;
  `)
}
