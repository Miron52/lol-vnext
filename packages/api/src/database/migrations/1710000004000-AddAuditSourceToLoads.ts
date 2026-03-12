import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditSourceToLoads1710000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "loads"
        ADD COLUMN "auditSource" varchar(20) NOT NULL DEFAULT 'manual';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "loads" DROP COLUMN "auditSource";
    `);
  }
}
