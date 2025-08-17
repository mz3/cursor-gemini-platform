import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table, TableForeignKey } from "typeorm";

export class AddSecretsTable1755406200000 implements MigrationInterface {
  name = 'AddSecretsTable1755406200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'secrets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'key',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'encryptedValue',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            default: "'api_key'",
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'secrets',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Create unique index on name + userId to prevent duplicate secret names per user
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_secrets_name_user" ON "secrets" ("name", "userId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_secrets_name_user"`);
    await queryRunner.dropTable('secrets');
  }
}
