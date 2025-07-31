import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBotModelField1753991065354 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bots"
      ADD COLUMN "model" VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-flash'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bots"
      DROP COLUMN "model"
    `);
  }
}