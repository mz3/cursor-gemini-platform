import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDescriptionToModel1752808401774 implements MigrationInterface {
    name = 'AddDescriptionToModel1752808401774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "models" ADD "description" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "models" DROP COLUMN "description"`);
    }
}
