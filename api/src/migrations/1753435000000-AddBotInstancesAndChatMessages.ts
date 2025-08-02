import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddBotInstancesAndChatMessages1753435000000 implements MigrationInterface {
    name = 'AddBotInstancesAndChatMessages1753435000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create bot_instance_status enum
        await queryRunner.query(`
            CREATE TYPE "public"."bot_instance_status_enum" AS ENUM('running', 'stopped', 'error', 'starting', 'stopping')
        `);

        // Create bot_instances table
        await queryRunner.query(`
            CREATE TABLE "bot_instances" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "botId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "status" "public"."bot_instance_status_enum" NOT NULL DEFAULT 'stopped',
                "lastStartedAt" TIMESTAMP,
                "lastStoppedAt" TIMESTAMP,
                "errorMessage" character varying,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bot_instances" PRIMARY KEY ("id")
            )
        `);

        // Create message_role enum
        await queryRunner.query(`
            CREATE TYPE "public"."message_role_enum" AS ENUM('user', 'bot', 'system')
        `);

        // Create chat_messages table
        await queryRunner.query(`
            CREATE TABLE "chat_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "botInstanceId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "role" "public"."message_role_enum" NOT NULL DEFAULT 'user',
                "content" text NOT NULL,
                "metadata" jsonb,
                "responseTime" integer,
                "tokensUsed" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "bot_instances" 
            ADD CONSTRAINT "FK_bot_instances_bot" 
            FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "bot_instances" 
            ADD CONSTRAINT "FK_bot_instances_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_messages" 
            ADD CONSTRAINT "FK_chat_messages_bot_instance" 
            FOREIGN KEY ("botInstanceId") REFERENCES "bot_instances"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_messages" 
            ADD CONSTRAINT "FK_chat_messages_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_user"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_bot_instance"`);
        await queryRunner.query(`ALTER TABLE "bot_instances" DROP CONSTRAINT "FK_bot_instances_user"`);
        await queryRunner.query(`ALTER TABLE "bot_instances" DROP CONSTRAINT "FK_bot_instances_bot"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`DROP TABLE "bot_instances"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE "public"."message_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bot_instance_status_enum"`);
    }
} 