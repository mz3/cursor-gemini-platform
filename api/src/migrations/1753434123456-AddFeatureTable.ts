import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeatureTable1753434123456 implements MigrationInterface {
    name = 'AddFeatureTable1753434123456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "features" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "displayName" character varying NOT NULL,
                "description" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "config" jsonb,
                "status" character varying NOT NULL DEFAULT 'draft',
                "userId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_features_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "application_features" (
                "featureId" uuid NOT NULL,
                "applicationId" uuid NOT NULL,
                CONSTRAINT "PK_application_features" PRIMARY KEY ("featureId", "applicationId")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "features"
            ADD CONSTRAINT "FK_features_userId"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "application_features"
            ADD CONSTRAINT "FK_application_features_featureId"
            FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "application_features"
            ADD CONSTRAINT "FK_application_features_applicationId"
            FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_features" DROP CONSTRAINT "FK_application_features_applicationId"`);
        await queryRunner.query(`ALTER TABLE "application_features" DROP CONSTRAINT "FK_application_features_featureId"`);
        await queryRunner.query(`ALTER TABLE "features" DROP CONSTRAINT "FK_features_userId"`);
        await queryRunner.query(`DROP TABLE "application_features"`);
        await queryRunner.query(`DROP TABLE "features"`);
    }
}
