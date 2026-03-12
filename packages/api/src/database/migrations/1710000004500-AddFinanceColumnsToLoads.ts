import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinanceColumnsToLoads1710000004500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add otrAmount and netProfitAmount if they don't exist
    const table = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'loads' AND column_name = 'otrAmount';
    `);

    if (table.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "loads"
          ADD COLUMN "otrAmount" numeric(12,2) NOT NULL DEFAULT 0,
          ADD COLUMN "netProfitAmount" numeric(12,2) NOT NULL DEFAULT 0;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "loads"
        DROP COLUMN IF EXISTS "otrAmount",
        DROP COLUMN IF EXISTS "netProfitAmount";
    `);
  }
}
