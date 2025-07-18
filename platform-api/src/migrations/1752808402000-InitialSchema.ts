import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1752808402000 implements MigrationInterface {
    name = 'InitialSchema1752808402000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if tables already exist and create them only if they don't
        const tablesExist = await queryRunner.hasTable("users");
        
        if (!tablesExist) {
            // Create users table
            await queryRunner.query(`
                CREATE TABLE "users" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "email" character varying NOT NULL,
                    "password" character varying NOT NULL,
                    "name" character varying,
                    "role" character varying NOT NULL DEFAULT 'user',
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
                )
            `);

            // Create models table
            await queryRunner.query(`
                CREATE TABLE "models" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying NOT NULL,
                    "description" character varying,
                    "type" character varying NOT NULL,
                    "config" jsonb,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "userId" uuid,
                    CONSTRAINT "PK_28d23f5ebf7733685b6495e6a8b" PRIMARY KEY ("id")
                )
            `);

            // Create applications table
            await queryRunner.query(`
                CREATE TABLE "applications" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying NOT NULL,
                    "description" character varying,
                    "type" character varying NOT NULL,
                    "config" jsonb,
                    "status" character varying NOT NULL DEFAULT 'draft',
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "userId" uuid,
                    CONSTRAINT "PK_938c0a27255637bde1ae3fafb7c" PRIMARY KEY ("id")
                )
            `);

            // Create workflows table
            await queryRunner.query(`
                CREATE TABLE "workflows" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying NOT NULL,
                    "description" character varying,
                    "type" character varying NOT NULL,
                    "config" jsonb,
                    "status" character varying NOT NULL DEFAULT 'draft',
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "userId" uuid,
                    CONSTRAINT "PK_8b6d3f9ae234f137d707b98f3f8" PRIMARY KEY ("id")
                )
            `);

            // Create workflow_actions table
            await queryRunner.query(`
                CREATE TABLE "workflow_actions" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying NOT NULL,
                    "type" character varying NOT NULL,
                    "config" jsonb,
                    "order" integer NOT NULL,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "workflowId" uuid,
                    CONSTRAINT "PK_8b6d3f9ae234f137d707b98f3f9" PRIMARY KEY ("id")
                )
            `);

            // Create components table
            await queryRunner.query(`
                CREATE TABLE "components" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying NOT NULL,
                    "type" character varying NOT NULL,
                    "config" jsonb,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "applicationId" uuid,
                    CONSTRAINT "PK_9a0e2c92d56e8d403e71e2c3a9e" PRIMARY KEY ("id")
                )
            `);

            // Create templates table
            await queryRunner.query(`
                CREATE TABLE "templates" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying NOT NULL,
                    "description" character varying,
                    "type" character varying NOT NULL,
                    "config" jsonb,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "userId" uuid,
                    CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id")
                )
            `);

            // Create code_templates table
            await queryRunner.query(`
                CREATE TABLE "code_templates" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying NOT NULL,
                    "description" character varying,
                    "language" character varying NOT NULL,
                    "code" text NOT NULL,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "userId" uuid,
                    CONSTRAINT "PK_8b6d3f9ae234f137d707b98f3f0" PRIMARY KEY ("id")
                )
            `);

            // Create relationships table
            await queryRunner.query(`
                CREATE TABLE "relationships" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying NOT NULL,
                    "type" character varying NOT NULL,
                    "config" jsonb,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "modelId" uuid,
                    CONSTRAINT "PK_8b6d3f9ae234f137d707b98f3f1" PRIMARY KEY ("id")
                )
            `);

            // Create prompts table
            await queryRunner.query(`
                CREATE TABLE "prompts" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying NOT NULL,
                    "description" character varying,
                    "type" character varying NOT NULL,
                    "config" jsonb,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "userId" uuid,
                    CONSTRAINT "PK_8b6d3f9ae234f137d707b98f3f2" PRIMARY KEY ("id")
                )
            `);

            // Create prompt_versions table
            await queryRunner.query(`
                CREATE TABLE "prompt_versions" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "version" integer NOT NULL,
                    "content" text NOT NULL,
                    "config" jsonb,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "promptId" uuid,
                    CONSTRAINT "PK_8b6d3f9ae234f137d707b98f3f3" PRIMARY KEY ("id")
                )
            `);

            // Add foreign key constraints
            await queryRunner.query(`
                ALTER TABLE "models" ADD CONSTRAINT "FK_28d23f5ebf7733685b6495e6a8b" 
                FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            await queryRunner.query(`
                ALTER TABLE "applications" ADD CONSTRAINT "FK_938c0a27255637bde1ae3fafb7c" 
                FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            await queryRunner.query(`
                ALTER TABLE "workflows" ADD CONSTRAINT "FK_8b6d3f9ae234f137d707b98f3f8" 
                FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            await queryRunner.query(`
                ALTER TABLE "workflow_actions" ADD CONSTRAINT "FK_8b6d3f9ae234f137d707b98f3f9" 
                FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            await queryRunner.query(`
                ALTER TABLE "components" ADD CONSTRAINT "FK_9a0e2c92d56e8d403e71e2c3a9e" 
                FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            await queryRunner.query(`
                ALTER TABLE "templates" ADD CONSTRAINT "FK_515948649ce0bbbe391de702ae5" 
                FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            await queryRunner.query(`
                ALTER TABLE "code_templates" ADD CONSTRAINT "FK_8b6d3f9ae234f137d707b98f3f0" 
                FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            await queryRunner.query(`
                ALTER TABLE "relationships" ADD CONSTRAINT "FK_8b6d3f9ae234f137d707b98f3f1" 
                FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            await queryRunner.query(`
                ALTER TABLE "prompts" ADD CONSTRAINT "FK_8b6d3f9ae234f137d707b98f3f2" 
                FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            await queryRunner.query(`
                ALTER TABLE "prompt_versions" ADD CONSTRAINT "FK_8b6d3f9ae234f137d707b98f3f3" 
                FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);

            // Create indexes for better performance
            await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
            await queryRunner.query(`CREATE INDEX "IDX_models_userId" ON "models" ("userId")`);
            await queryRunner.query(`CREATE INDEX "IDX_applications_userId" ON "applications" ("userId")`);
            await queryRunner.query(`CREATE INDEX "IDX_workflows_userId" ON "workflows" ("userId")`);
            await queryRunner.query(`CREATE INDEX "IDX_workflow_actions_workflowId" ON "workflow_actions" ("workflowId")`);
            await queryRunner.query(`CREATE INDEX "IDX_components_applicationId" ON "components" ("applicationId")`);
            await queryRunner.query(`CREATE INDEX "IDX_templates_userId" ON "templates" ("userId")`);
            await queryRunner.query(`CREATE INDEX "IDX_code_templates_userId" ON "code_templates" ("userId")`);
            await queryRunner.query(`CREATE INDEX "IDX_relationships_modelId" ON "relationships" ("modelId")`);
            await queryRunner.query(`CREATE INDEX "IDX_prompts_userId" ON "prompts" ("userId")`);
            await queryRunner.query(`CREATE INDEX "IDX_prompt_versions_promptId" ON "prompt_versions" ("promptId")`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "prompt_versions" DROP CONSTRAINT IF EXISTS "FK_8b6d3f9ae234f137d707b98f3f3"`);
        await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT IF EXISTS "FK_8b6d3f9ae234f137d707b98f3f2"`);
        await queryRunner.query(`ALTER TABLE "relationships" DROP CONSTRAINT IF EXISTS "FK_8b6d3f9ae234f137d707b98f3f1"`);
        await queryRunner.query(`ALTER TABLE "code_templates" DROP CONSTRAINT IF EXISTS "FK_8b6d3f9ae234f137d707b98f3f0"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "FK_515948649ce0bbbe391de702ae5"`);
        await queryRunner.query(`ALTER TABLE "components" DROP CONSTRAINT IF EXISTS "FK_9a0e2c92d56e8d403e71e2c3a9e"`);
        await queryRunner.query(`ALTER TABLE "workflow_actions" DROP CONSTRAINT IF EXISTS "FK_8b6d3f9ae234f137d707b98f3f9"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP CONSTRAINT IF EXISTS "FK_8b6d3f9ae234f137d707b98f3f8"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "FK_938c0a27255637bde1ae3fafb7c"`);
        await queryRunner.query(`ALTER TABLE "models" DROP CONSTRAINT IF EXISTS "FK_28d23f5ebf7733685b6495e6a8b"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "prompt_versions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "prompts"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "relationships"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "code_templates"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "templates"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "components"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workflow_actions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workflows"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "applications"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "models"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    }
} 