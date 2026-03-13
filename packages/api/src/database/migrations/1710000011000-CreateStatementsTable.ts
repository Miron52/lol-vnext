import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateStatementsTable1710000011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'statements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'statementType',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'weekId',
            type: 'uuid',
          },
          {
            name: 'weekLabel',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'unitId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'generatedById',
            type: 'uuid',
          },
          {
            name: 'generatedByName',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'snapshot',
            type: 'jsonb',
          },
          {
            name: 'loadCount',
            type: 'int',
          },
          {
            name: 'totalGross',
            type: 'numeric',
            precision: 12,
            scale: 2,
          },
          {
            name: 'totalNetProfit',
            type: 'numeric',
            precision: 12,
            scale: 2,
          },
          {
            name: 'generatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['weekId'],
            referencedTableName: 'weeks',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          },
          {
            columnNames: ['generatedById'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'statements',
      new TableIndex({
        name: 'IDX_statements_week',
        columnNames: ['weekId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('statements', 'IDX_statements_week');
    await queryRunner.dropTable('statements');
  }
}
