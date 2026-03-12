import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalaryAuditLogsTable1710000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "salary_audit_logs" (
        "id"              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "weekId"          uuid           NOT NULL REFERENCES "weeks"("id"),
        "action"          varchar(30)    NOT NULL,
        "performedById"   uuid           NOT NULL REFERENCES "users"("id"),
        "performedByName" varchar(200)   NOT NULL,
        "detail"          text           NOT NULL,
        "createdAt"       timestamptz    NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_salary_audit_logs_week" ON "salary_audit_logs" ("weekId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "salary_audit_logs";`);
  }
}
