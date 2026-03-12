import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalaryRulesTable1710000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "salary_rules" (
        "id"              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "name"            varchar(100)   NOT NULL,
        "version"         int            NOT NULL DEFAULT 1,
        "isActive"        boolean        NOT NULL DEFAULT false,
        "effectiveFrom"   date           NOT NULL,
        "applicationMode" varchar(20)    NOT NULL DEFAULT 'flat_rate',
        "salaryBase"      varchar(20)    NOT NULL DEFAULT 'gross_profit',
        "tiers"           jsonb          NOT NULL,
        "createdById"     uuid           NOT NULL REFERENCES "users"("id"),
        "createdByName"   varchar(200)   NOT NULL,
        "createdAt"       timestamptz    NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_salary_rules_active" ON "salary_rules" ("isActive");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "salary_rules";`);
  }
}
