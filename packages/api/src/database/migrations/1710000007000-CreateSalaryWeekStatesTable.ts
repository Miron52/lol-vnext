import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalaryWeekStatesTable1710000007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "salary_week_states" (
        "weekId"          uuid PRIMARY KEY REFERENCES "weeks"("id"),
        "status"          varchar(20)    NOT NULL DEFAULT 'open',
        "generatedAt"     timestamptz    NULL,
        "generatedById"   uuid           NULL REFERENCES "users"("id"),
        "generatedByName" varchar(200)   NULL,
        "frozenAt"        timestamptz    NULL,
        "frozenById"      uuid           NULL REFERENCES "users"("id"),
        "frozenByName"    varchar(200)   NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "salary_week_states";`);
  }
}
