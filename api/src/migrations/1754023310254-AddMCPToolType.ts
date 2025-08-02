import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddMCPToolType1754023310254 implements MigrationInterface {
    name = 'AddMCPToolType1754023310254'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "features" DROP CONSTRAINT "FK_features_userId"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_applications_model"`);
        await queryRunner.query(`ALTER TABLE "bots" DROP CONSTRAINT "FK_bots_userId"`);
        await queryRunner.query(`ALTER TABLE "bot_instances" DROP CONSTRAINT "FK_bot_instances_bot"`);
        await queryRunner.query(`ALTER TABLE "bot_instances" DROP CONSTRAINT "FK_bot_instances_user"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_bot_instance"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_user"`);
        await queryRunner.query(`ALTER TABLE "application_features" DROP CONSTRAINT "FK_application_features_featureId"`);
        await queryRunner.query(`ALTER TABLE "application_features" DROP CONSTRAINT "FK_application_features_applicationId"`);
        await queryRunner.query(`ALTER TABLE "bot_prompts" DROP CONSTRAINT "FK_bot_prompts_botId"`);
        await queryRunner.query(`ALTER TABLE "bot_prompts" DROP CONSTRAINT "FK_bot_prompts_promptId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bot_tools_botId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bot_tools_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bot_tools_active"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "modelId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "darkMode"`);
        await queryRunner.query(`ALTER TYPE "public"."bot_tool_type_enum" RENAME TO "bot_tool_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."bot_tools_type_enum" AS ENUM('http_request', 'database_query', 'file_operation', 'shell_command', 'custom_script', 'workflow_action', 'mcp_tool')`);
        await queryRunner.query(`ALTER TABLE "bot_tools" ALTER COLUMN "type" TYPE "public"."bot_tools_type_enum" USING "type"::"text"::"public"."bot_tools_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bot_tool_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "bot_tools" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "bot_tools" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "bots" DROP COLUMN "model"`);
        await queryRunner.query(`ALTER TABLE "bots" ADD "model" character varying NOT NULL DEFAULT 'gemini-2.5-flash'`);
        await queryRunner.query(`ALTER TYPE "public"."bot_instance_status_enum" RENAME TO "bot_instance_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."bot_instances_status_enum" AS ENUM('running', 'stopped', 'error', 'starting', 'stopping')`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ALTER COLUMN "status" TYPE "public"."bot_instances_status_enum" USING "status"::"text"::"public"."bot_instances_status_enum"`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ALTER COLUMN "status" SET DEFAULT 'stopped'`);
        await queryRunner.query(`DROP TYPE "public"."bot_instance_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."message_role_enum" RENAME TO "message_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."chat_messages_role_enum" AS ENUM('user', 'bot', 'system')`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ALTER COLUMN "role" TYPE "public"."chat_messages_role_enum" USING "role"::"text"::"public"."chat_messages_role_enum"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."message_role_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_5a90eea15350443c59b2ae7a55" ON "application_features" ("featureId") `);
        await queryRunner.query(`CREATE INDEX "IDX_59284e12d9bbaebaf3af8ce386" ON "application_features" ("applicationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6ca3092fc8129d2b1e6dbe7b9b" ON "bot_prompts" ("botId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e0d472c833d56d03a99db2eabc" ON "bot_prompts" ("promptId") `);
        await queryRunner.query(`ALTER TABLE "features" ADD CONSTRAINT "FK_9fdca9b234a2a506b123e0526b0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bots" ADD CONSTRAINT "FK_ce06dfaddfec7a65f8531b6218b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ADD CONSTRAINT "FK_23ec488cdc0072c8885ea89d8e4" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ADD CONSTRAINT "FK_2a73a9850dcfba04717e853d8b3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_a1ecd5a669794e40f406f59b201" FOREIGN KEY ("botInstanceId") REFERENCES "bot_instances"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_43d968962b9e24e1e3517c0fbff" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_features" ADD CONSTRAINT "FK_5a90eea15350443c59b2ae7a559" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "application_features" ADD CONSTRAINT "FK_59284e12d9bbaebaf3af8ce386f" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "bot_prompts" ADD CONSTRAINT "FK_6ca3092fc8129d2b1e6dbe7b9b4" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "bot_prompts" ADD CONSTRAINT "FK_e0d472c833d56d03a99db2eabcd" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bot_prompts" DROP CONSTRAINT "FK_e0d472c833d56d03a99db2eabcd"`);
        await queryRunner.query(`ALTER TABLE "bot_prompts" DROP CONSTRAINT "FK_6ca3092fc8129d2b1e6dbe7b9b4"`);
        await queryRunner.query(`ALTER TABLE "application_features" DROP CONSTRAINT "FK_59284e12d9bbaebaf3af8ce386f"`);
        await queryRunner.query(`ALTER TABLE "application_features" DROP CONSTRAINT "FK_5a90eea15350443c59b2ae7a559"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_43d968962b9e24e1e3517c0fbff"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_a1ecd5a669794e40f406f59b201"`);
        await queryRunner.query(`ALTER TABLE "bot_instances" DROP CONSTRAINT "FK_2a73a9850dcfba04717e853d8b3"`);
        await queryRunner.query(`ALTER TABLE "bot_instances" DROP CONSTRAINT "FK_23ec488cdc0072c8885ea89d8e4"`);
        await queryRunner.query(`ALTER TABLE "bots" DROP CONSTRAINT "FK_ce06dfaddfec7a65f8531b6218b"`);
        await queryRunner.query(`ALTER TABLE "features" DROP CONSTRAINT "FK_9fdca9b234a2a506b123e0526b0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e0d472c833d56d03a99db2eabc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ca3092fc8129d2b1e6dbe7b9b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59284e12d9bbaebaf3af8ce386"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a90eea15350443c59b2ae7a55"`);
        await queryRunner.query(`CREATE TYPE "public"."message_role_enum_old" AS ENUM('user', 'bot', 'system')`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ALTER COLUMN "role" TYPE "public"."message_role_enum_old" USING "role"::"text"::"public"."message_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."chat_messages_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."message_role_enum_old" RENAME TO "message_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."bot_instance_status_enum_old" AS ENUM('running', 'stopped', 'error', 'starting', 'stopping')`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ALTER COLUMN "status" TYPE "public"."bot_instance_status_enum_old" USING "status"::"text"::"public"."bot_instance_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ALTER COLUMN "status" SET DEFAULT 'stopped'`);
        await queryRunner.query(`DROP TYPE "public"."bot_instances_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."bot_instance_status_enum_old" RENAME TO "bot_instance_status_enum"`);
        await queryRunner.query(`ALTER TABLE "bots" DROP COLUMN "model"`);
        await queryRunner.query(`ALTER TABLE "bots" ADD "model" character varying(50) NOT NULL DEFAULT 'gemini-2.5-flash'`);
        await queryRunner.query(`ALTER TABLE "bot_tools" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "bot_tools" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."bot_tool_type_enum_old" AS ENUM('http_request', 'database_query', 'file_operation', 'shell_command', 'custom_script', 'workflow_action')`);
        await queryRunner.query(`ALTER TABLE "bot_tools" ALTER COLUMN "type" TYPE "public"."bot_tool_type_enum_old" USING "type"::"text"::"public"."bot_tool_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."bot_tools_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."bot_tool_type_enum_old" RENAME TO "bot_tool_type_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "darkMode" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "modelId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_bot_tools_active" ON "bot_tools" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_bot_tools_type" ON "bot_tools" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_bot_tools_botId" ON "bot_tools" ("botId") `);
        await queryRunner.query(`ALTER TABLE "bot_prompts" ADD CONSTRAINT "FK_bot_prompts_promptId" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bot_prompts" ADD CONSTRAINT "FK_bot_prompts_botId" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_features" ADD CONSTRAINT "FK_application_features_applicationId" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_features" ADD CONSTRAINT "FK_application_features_featureId" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_bot_instance" FOREIGN KEY ("botInstanceId") REFERENCES "bot_instances"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ADD CONSTRAINT "FK_bot_instances_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bot_instances" ADD CONSTRAINT "FK_bot_instances_bot" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bots" ADD CONSTRAINT "FK_bots_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_applications_model" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "features" ADD CONSTRAINT "FK_features_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
