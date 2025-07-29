import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBotTable1753434011982 implements MigrationInterface {
    name = 'AddBotTable1753434011982'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "bots" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "displayName" character varying NOT NULL,
                "description" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "userId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bots_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "bot_prompts" (
                "botId" uuid NOT NULL,
                "promptId" uuid NOT NULL,
                CONSTRAINT "PK_bot_prompts" PRIMARY KEY ("botId", "promptId")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "bots"
            ADD CONSTRAINT "FK_bots_userId"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "bot_prompts"
            ADD CONSTRAINT "FK_bot_prompts_botId"
            FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "bot_prompts"
            ADD CONSTRAINT "FK_bot_prompts_promptId"
            FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bot_prompts" DROP CONSTRAINT "FK_bot_prompts_promptId"`);
        await queryRunner.query(`ALTER TABLE "bot_prompts" DROP CONSTRAINT "FK_bot_prompts_botId"`);
        await queryRunner.query(`ALTER TABLE "bots" DROP CONSTRAINT "FK_bots_userId"`);
        await queryRunner.query(`DROP TABLE "bot_prompts"`);
        await queryRunner.query(`DROP TABLE "bots"`);
    }
}
