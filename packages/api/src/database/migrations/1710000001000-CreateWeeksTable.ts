import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeeksTable1710000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "weeks" (
        "id"         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "label"      varchar(20)  NOT NULL,
        "isoYear"    int          NOT NULL,
        "isoWeek"    int          NOT NULL,
        "startDate"  date         NOT NULL,
        "endDate"    date         NOT NULL,
        "createdAt"  timestamptz  NOT NULL DEFAULT now(),

        CONSTRAINT "UQ_weeks_label"       UNIQUE ("label"),
        CONSTRAINT "UQ_weeks_year_week"   UNIQUE ("isoYear", "isoWeek"),
        CONSTRAINT "CHK_weeks_iso_week"   CHECK ("isoWeek" BETWEEN 1 AND 53)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_weeks_year_week" ON "weeks" ("isoYear" DESC, "isoWeek" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "weeks";`);
  }
}
