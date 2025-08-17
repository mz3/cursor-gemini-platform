import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateServicesTable1755471775994 implements MigrationInterface {
    name = 'CreateServicesTable1755471775994'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_secrets_name_user"`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "displayName" character varying NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "type" character varying NOT NULL DEFAULT 'http', "endpoint" character varying, "config" jsonb, "status" character varying NOT NULL DEFAULT 'draft', "healthCheck" jsonb, "authentication" jsonb, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "secrets" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "secrets" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_3905389899d96c4f1b3619f68d5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_3905389899d96c4f1b3619f68d5"`);
        await queryRunner.query(`ALTER TABLE "secrets" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "secrets" ADD "description" text`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_secrets_name_user" ON "secrets" ("name", "userId") `);
    }

}
