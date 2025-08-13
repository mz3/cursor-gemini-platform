import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureUuidExtension1754100800000 implements MigrationInterface {
  name = 'EnsureUuidExtension1754100800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Do not drop extension in down to avoid affecting shared DBs
  }
}
