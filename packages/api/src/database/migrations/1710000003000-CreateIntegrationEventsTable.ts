import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIntegrationEventsTable1710000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "integration_event_status" AS ENUM (
        'pending',
        'processed',
        'duplicate',
        'failed'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "integration_event_result" AS ENUM (
        'created',
        'updated',
        'skipped',
        'failed'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "integration_events" (
        "id"                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "sourceSystem"      varchar(50)                NOT NULL,
        "externalEventId"   varchar(255)               NULL,
        "eventType"         varchar(100)               NOT NULL,
        "payloadHash"       varchar(64)                NOT NULL,
        "payloadJson"       jsonb                      NOT NULL,
        "processingStatus"  integration_event_status   NOT NULL DEFAULT 'pending',
        "processingResult"  integration_event_result   NULL,
        "processingError"   text                       NULL,
        "loadId"            uuid                       NULL REFERENCES "loads"("id"),
        "receivedAt"        timestamptz                NOT NULL DEFAULT now(),
        "processedAt"       timestamptz                NULL
      );
    `);

    // Dedup by payload hash within a source system
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_integration_events_payload_hash"
        ON "integration_events" ("sourceSystem", "payloadHash");
    `);

    // Dedup by external event id within a source system (when present)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_integration_events_external_event_id"
        ON "integration_events" ("sourceSystem", "externalEventId")
        WHERE "externalEventId" IS NOT NULL;
    `);

    // Common query patterns
    await queryRunner.query(`
      CREATE INDEX "IDX_integration_events_status"
        ON "integration_events" ("processingStatus");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_integration_events_load_id"
        ON "integration_events" ("loadId")
        WHERE "loadId" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_integration_events_received_at"
        ON "integration_events" ("receivedAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "integration_events";`);
    await queryRunner.query(`DROP TYPE "integration_event_result";`);
    await queryRunner.query(`DROP TYPE "integration_event_status";`);
  }
}
