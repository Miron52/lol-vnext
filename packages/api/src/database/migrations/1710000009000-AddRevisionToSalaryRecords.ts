import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevisionToSalaryRecords1710000009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add revision and isCurrent columns if they don't exist
    const cols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'salary_records' AND column_name = 'revision';
    `);

    if (cols.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "salary_records"
          ADD COLUMN "revision" int NOT NULL DEFAULT 1,
          ADD COLUMN "isCurrent" boolean NOT NULL DEFAULT true;
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_salary_records_current" ON "salary_records" ("isCurrent")
          WHERE "isCurrent" = true;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_salary_records_current";`);
    await queryRunner.query(`
      ALTER TABLE "salary_records"
        DROP COLUMN IF EXISTS "revision",
        DROP COLUMN IF EXISTS "isCurrent";
    `);
  }
}
