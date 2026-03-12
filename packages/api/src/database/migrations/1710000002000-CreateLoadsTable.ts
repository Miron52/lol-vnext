import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoadsTable1710000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "load_status" AS ENUM (
        'not_picked_up',
        'in_transit',
        'delivered',
        'completed',
        'cancelled'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "loads" (
        "id"                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "sylNumber"           varchar(50)    NOT NULL,
        "externalSource"      varchar(50)    NULL,
        "externalLoadKey"     varchar(255)   NULL,
        "weekId"              uuid           NOT NULL REFERENCES "weeks"("id"),
        "date"                date           NOT NULL,
        "unitId"              uuid           NULL,
        "driverId"            uuid           NULL,
        "dispatcherId"        uuid           NOT NULL REFERENCES "users"("id"),
        "businessName"        varchar(255)   NOT NULL,
        "brokerageId"         uuid           NULL,
        "netsuiteRef"         varchar(255)   NULL,
        "fromAddress"         varchar(500)   NOT NULL,
        "fromState"           varchar(10)    NOT NULL,
        "fromDate"            date           NOT NULL,
        "toAddress"           varchar(500)   NOT NULL,
        "toState"             varchar(10)    NOT NULL,
        "toDate"              date           NOT NULL,
        "miles"               numeric(10,2)  NOT NULL DEFAULT 0,
        "grossAmount"         numeric(12,2)  NOT NULL,
        "driverCostAmount"    numeric(12,2)  NOT NULL,
        "profitAmount"        numeric(12,2)  NOT NULL,
        "profitPercent"       numeric(6,2)   NOT NULL,
        "quickPayFlag"        boolean        NOT NULL DEFAULT false,
        "directPaymentFlag"   boolean        NOT NULL DEFAULT false,
        "factoringFlag"       boolean        NOT NULL DEFAULT false,
        "driverPaidFlag"      boolean        NOT NULL DEFAULT false,
        "loadStatus"          load_status    NOT NULL DEFAULT 'not_picked_up',
        "comment"             text           NULL,
        "createdAt"           timestamptz    NOT NULL DEFAULT now(),
        "updatedAt"           timestamptz    NOT NULL DEFAULT now(),
        "archivedAt"          timestamptz    NULL
      );
    `);

    // Unique: business identifier
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_loads_syl_number"
        ON "loads" ("sylNumber");
    `);

    // Composite unique for external dedup (partial — only when both non-null)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_loads_external_dedup"
        ON "loads" ("externalSource", "externalLoadKey")
        WHERE "externalSource" IS NOT NULL AND "externalLoadKey" IS NOT NULL;
    `);

    // Common query patterns
    await queryRunner.query(`
      CREATE INDEX "IDX_loads_week_id" ON "loads" ("weekId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_loads_dispatcher_id" ON "loads" ("dispatcherId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_loads_archived_at" ON "loads" ("archivedAt")
        WHERE "archivedAt" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "loads";`);
    await queryRunner.query(`DROP TYPE "load_status";`);
  }
}
