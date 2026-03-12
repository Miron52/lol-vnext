import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalaryRecordsTable1710000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "salary_records" (
        "id"                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "dispatcherId"      uuid           NOT NULL REFERENCES "users"("id"),
        "dispatcherName"    varchar(200)   NOT NULL,
        "weekId"            uuid           NOT NULL REFERENCES "weeks"("id"),
        "weekLabel"         varchar(20)    NOT NULL,
        "snapshot"          jsonb          NOT NULL,
        "weeklyGrossProfit" numeric(12,2)  NOT NULL,
        "appliedPercent"    numeric(5,2)   NOT NULL,
        "baseSalary"        numeric(12,2)  NOT NULL,
        "totalOther"        numeric(12,2)  NOT NULL DEFAULT 0,
        "totalBonus"        numeric(12,2)  NOT NULL DEFAULT 0,
        "totalSalary"       numeric(12,2)  NOT NULL,
        "ruleVersion"       int            NOT NULL,
        "loadCount"         int            NOT NULL,
        "generatedById"     uuid           NOT NULL REFERENCES "users"("id"),
        "generatedByName"   varchar(200)   NOT NULL,
        "generatedAt"       timestamptz    NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_salary_records_dispatcher" ON "salary_records" ("dispatcherId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_salary_records_week" ON "salary_records" ("weekId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "salary_records";`);
  }
}
