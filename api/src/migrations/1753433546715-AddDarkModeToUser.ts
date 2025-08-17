import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddDarkModeToUser1753433546715 implements MigrationInterface {
    name = 'AddDarkModeToUser1753433546715'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "darkMode" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "darkMode"`);
    }

}
