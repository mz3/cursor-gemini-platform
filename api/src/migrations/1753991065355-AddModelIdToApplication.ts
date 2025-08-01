import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelIdToApplication1753991065355 implements MigrationInterface {
    name = 'AddModelIdToApplication1753991065355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "applications" ADD "modelId" uuid`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_applications_model" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_applications_model"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "modelId"`);
    }
}
