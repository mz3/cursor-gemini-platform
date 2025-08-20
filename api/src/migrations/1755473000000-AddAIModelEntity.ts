import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table, TableColumn, TableForeignKey } from "typeorm";

export class AddAIModelEntity1755473000000 implements MigrationInterface {
    name = 'AddAIModelEntity1755473000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ai_models table
        await queryRunner.createTable(new Table({
            name: "ai_models",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "name",
                    type: "varchar",
                    isNullable: false
                },
                {
                    name: "displayName",
                    type: "varchar",
                    isNullable: false
                },
                {
                    name: "description",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "provider",
                    type: "enum",
                    enum: ["gemini", "openai", "anthropic", "deepseek", "local"],
                    default: "'gemini'"
                },
                {
                    name: "modelId",
                    type: "varchar",
                    isNullable: false
                },
                {
                    name: "apiVersion",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "baseUrl",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "capabilities",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "configuration",
                    type: "json",
                    isNullable: true
                },
                {
                    name: "isActive",
                    type: "boolean",
                    default: true
                },
                {
                    name: "isDefault",
                    type: "boolean",
                    default: false
                },
                {
                    name: "userId",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "secretId",
                    type: "uuid",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Create foreign key for user
        await queryRunner.createForeignKey("ai_models", new TableForeignKey({
            columnNames: ["userId"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE"
        }));

        // Create foreign key for secret
        await queryRunner.createForeignKey("ai_models", new TableForeignKey({
            columnNames: ["secretId"],
            referencedColumnNames: ["id"],
            referencedTableName: "secrets",
            onDelete: "SET NULL"
        }));

        // Add aiModelId column to bots table
        await queryRunner.addColumn("bots", new TableColumn({
            name: "aiModelId",
            type: "uuid",
            isNullable: true
        }));

        // Create foreign key for aiModel in bots table
        await queryRunner.createForeignKey("bots", new TableForeignKey({
            columnNames: ["aiModelId"],
            referencedColumnNames: ["id"],
            referencedTableName: "ai_models",
            onDelete: "SET NULL"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key from bots table
        const botTable = await queryRunner.getTable("bots");
        const aiModelForeignKey = botTable!.foreignKeys.find(fk => fk.columnNames.indexOf("aiModelId") !== -1);
        if (aiModelForeignKey) {
            await queryRunner.dropForeignKey("bots", aiModelForeignKey);
        }

        // Drop aiModelId column from bots table
        await queryRunner.dropColumn("bots", "aiModelId");

        // Drop foreign keys from ai_models table
        const aiModelsTable = await queryRunner.getTable("ai_models");
        const userForeignKey = aiModelsTable!.foreignKeys.find(fk => fk.columnNames.indexOf("userId") !== -1);
        const secretForeignKey = aiModelsTable!.foreignKeys.find(fk => fk.columnNames.indexOf("secretId") !== -1);

        if (userForeignKey) {
            await queryRunner.dropForeignKey("ai_models", userForeignKey);
        }
        if (secretForeignKey) {
            await queryRunner.dropForeignKey("ai_models", secretForeignKey);
        }

        // Drop ai_models table
        await queryRunner.dropTable("ai_models");
    }
}
