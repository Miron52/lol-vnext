import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('admin', 'dispatcher', 'assistant', 'accountant');
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "email"         varchar(255) NOT NULL UNIQUE,
        "firstName"     varchar(100) NOT NULL,
        "lastName"      varchar(100) NOT NULL,
        "passwordHash"  varchar(255) NOT NULL,
        "role"          user_role NOT NULL DEFAULT 'dispatcher',
        "createdAt"     timestamptz NOT NULL DEFAULT now(),
        "updatedAt"     timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users";`);
    await queryRunner.query(`DROP TYPE "user_role";`);
  }
}
