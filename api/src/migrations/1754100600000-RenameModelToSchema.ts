import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameModelToSchema1754100600000 implements MigrationInterface {
  name = 'RenameModelToSchema1754100600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename the models table to schemas
    await queryRunner.query(`ALTER TABLE "models" RENAME TO "schemas"`);

    // Rename the modelId column to schemaId in entities table
    await queryRunner.query(`ALTER TABLE "entities" RENAME COLUMN "modelId" TO "schemaId"`);

    // Drop the existing foreign key constraint
    await queryRunner.query(`ALTER TABLE "entities" DROP CONSTRAINT "FK_entities_modelId"`);

    // Add the new foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "entities"
      ADD CONSTRAINT "FK_entities_schemaId"
      FOREIGN KEY ("schemaId")
      REFERENCES "schemas"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new foreign key constraint
    await queryRunner.query(`ALTER TABLE "entities" DROP CONSTRAINT "FK_entities_schemaId"`);

    // Rename the schemaId column back to modelId in entities table
    await queryRunner.query(`ALTER TABLE "entities" RENAME COLUMN "schemaId" TO "modelId"`);

    // Rename the schemas table back to models
    await queryRunner.query(`ALTER TABLE "schemas" RENAME TO "models"`);

    // Add back the original foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "entities"
      ADD CONSTRAINT "FK_entities_modelId"
      FOREIGN KEY ("modelId")
      REFERENCES "models"("id")
      ON DELETE CASCADE
    `);
  }
}
