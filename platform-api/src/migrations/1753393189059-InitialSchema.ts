import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1753393189059 implements MigrationInterface {
    name = 'InitialSchema1753393189059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "models" DROP COLUMN "isActive"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "models" ADD "isActive" boolean NOT NULL DEFAULT true`);
    }

}
