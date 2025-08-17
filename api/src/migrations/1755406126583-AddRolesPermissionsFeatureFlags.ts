import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRolesPermissionsFeatureFlags1755406126583 implements MigrationInterface {
    name = 'AddRolesPermissionsFeatureFlags1755406126583'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "schemas" DROP CONSTRAINT "FK_bd0eee09c3dde57cc3b9ac1512a"`);
        await queryRunner.query(`ALTER TABLE "entities" DROP CONSTRAINT "FK_entities_schemaId"`);
        await queryRunner.query(`ALTER TABLE "entities" DROP CONSTRAINT "FK_entities_userId"`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_resource_enum" AS ENUM('user', 'role', 'permission', 'schema', 'entity', 'application', 'bot', 'feature', 'workflow', 'prompt', 'template', 'admin', 'system')`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_action_enum" AS ENUM('create', 'read', 'update', 'delete', 'execute', 'manage')`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "displayName" character varying NOT NULL, "description" character varying, "resource" "public"."permissions_resource_enum" NOT NULL, "action" "public"."permissions_action_enum" NOT NULL, "isSystem" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "displayName" character varying NOT NULL, "description" character varying, "isSystem" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."feature_flags_type_enum" AS ENUM('boolean', 'percentage', 'role_based', 'user_based')`);
        await queryRunner.query(`CREATE TABLE "feature_flags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "type" "public"."feature_flags_type_enum" NOT NULL DEFAULT 'boolean', "enabled" boolean NOT NULL DEFAULT false, "percentage" integer, "config" jsonb, "userIds" jsonb, "isSystem" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_36d0344370584b4d6a953c53a69" UNIQUE ("key"), CONSTRAINT "PK_db657d344e9caacfc9d5cf8bbac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("roleId" uuid NOT NULL, "permissionId" uuid NOT NULL, CONSTRAINT "PK_d430a02aad006d8a70f3acd7d03" PRIMARY KEY ("roleId", "permissionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b4599f8b8f548d35850afa2d12" ON "role_permissions" ("roleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_06792d0c62ce6b0203c03643cd" ON "role_permissions" ("permissionId") `);
        await queryRunner.query(`CREATE TABLE "feature_flag_roles" ("featureFlagId" uuid NOT NULL, "roleId" uuid NOT NULL, CONSTRAINT "PK_1a3eb3418594e45a0fff9a521e7" PRIMARY KEY ("featureFlagId", "roleId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_122e2bd09a2a13e687c70ea9b0" ON "feature_flag_roles" ("featureFlagId") `);
        await queryRunner.query(`CREATE INDEX "IDX_267a60d7715942ce2cbe001b9d" ON "feature_flag_roles" ("roleId") `);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "roleId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "legacyRole" character varying DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "entities" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "entities" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schemas" ADD CONSTRAINT "FK_c9506fb47af711a19de7dcf6e7d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entities" ADD CONSTRAINT "FK_b65a5540702e93e8a95dc265010" FOREIGN KEY ("schemaId") REFERENCES "schemas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entities" ADD CONSTRAINT "FK_d404a800aca47b69ceefa4e4220" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feature_flag_roles" ADD CONSTRAINT "FK_122e2bd09a2a13e687c70ea9b07" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "feature_flag_roles" ADD CONSTRAINT "FK_267a60d7715942ce2cbe001b9d8" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "feature_flag_roles" DROP CONSTRAINT "FK_267a60d7715942ce2cbe001b9d8"`);
        await queryRunner.query(`ALTER TABLE "feature_flag_roles" DROP CONSTRAINT "FK_122e2bd09a2a13e687c70ea9b07"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c"`);
        await queryRunner.query(`ALTER TABLE "entities" DROP CONSTRAINT "FK_d404a800aca47b69ceefa4e4220"`);
        await queryRunner.query(`ALTER TABLE "entities" DROP CONSTRAINT "FK_b65a5540702e93e8a95dc265010"`);
        await queryRunner.query(`ALTER TABLE "schemas" DROP CONSTRAINT "FK_c9506fb47af711a19de7dcf6e7d"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`);
        await queryRunner.query(`ALTER TABLE "entities" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "entities" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "legacyRole"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roleId"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_267a60d7715942ce2cbe001b9d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_122e2bd09a2a13e687c70ea9b0"`);
        await queryRunner.query(`DROP TABLE "feature_flag_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_06792d0c62ce6b0203c03643cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b4599f8b8f548d35850afa2d12"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "feature_flags"`);
        await queryRunner.query(`DROP TYPE "public"."feature_flags_type_enum"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_action_enum"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_resource_enum"`);
        await queryRunner.query(`ALTER TABLE "entities" ADD CONSTRAINT "FK_entities_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entities" ADD CONSTRAINT "FK_entities_schemaId" FOREIGN KEY ("schemaId") REFERENCES "schemas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schemas" ADD CONSTRAINT "FK_bd0eee09c3dde57cc3b9ac1512a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
