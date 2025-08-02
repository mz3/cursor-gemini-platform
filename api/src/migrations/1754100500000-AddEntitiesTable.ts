import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table } from 'typeorm';

export class AddEntitiesTable1754100500000 implements MigrationInterface {
  name = 'AddEntitiesTable1754100500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'entities',
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
            length: '255',
          },
          {
            name: 'displayName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'modelId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'isSystem',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraints using raw SQL
    await queryRunner.query(`
      ALTER TABLE "entities" 
      ADD CONSTRAINT "FK_entities_modelId" 
      FOREIGN KEY ("modelId") 
      REFERENCES "models"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "entities" 
      ADD CONSTRAINT "FK_entities_userId" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "entities" DROP CONSTRAINT "FK_entities_modelId"`);
    await queryRunner.query(`ALTER TABLE "entities" DROP CONSTRAINT "FK_entities_userId"`);
    
    // Drop table
    await queryRunner.dropTable('entities');
  }
} 