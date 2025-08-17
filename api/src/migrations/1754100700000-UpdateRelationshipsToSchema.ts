import type { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateRelationshipsToSchema1754100700000 implements MigrationInterface {
  name = 'UpdateRelationshipsToSchema1754100700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'relationships';

    const hasSourceModelId = await queryRunner.hasColumn(tableName, 'sourceModelId');
    const hasTargetModelId = await queryRunner.hasColumn(tableName, 'targetModelId');

    if (hasSourceModelId) {
      await queryRunner.query(`ALTER TABLE "${tableName}" RENAME COLUMN "sourceModelId" TO "sourceSchemaId"`);
    }

    if (hasTargetModelId) {
      await queryRunner.query(`ALTER TABLE "${tableName}" RENAME COLUMN "targetModelId" TO "targetSchemaId"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'relationships';

    const hasSourceSchemaId = await queryRunner.hasColumn(tableName, 'sourceSchemaId');
    const hasTargetSchemaId = await queryRunner.hasColumn(tableName, 'targetSchemaId');

    if (hasSourceSchemaId) {
      await queryRunner.query(`ALTER TABLE "${tableName}" RENAME COLUMN "sourceSchemaId" TO "sourceModelId"`);
    }

    if (hasTargetSchemaId) {
      await queryRunner.query(`ALTER TABLE "${tableName}" RENAME COLUMN "targetSchemaId" TO "targetModelId"`);
    }
  }
}
