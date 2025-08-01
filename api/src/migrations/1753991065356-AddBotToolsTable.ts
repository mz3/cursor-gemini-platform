import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddBotToolsTable1753991065356 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for tool types
    await queryRunner.query(`
      CREATE TYPE "public"."bot_tool_type_enum" AS ENUM(
        'http_request',
        'database_query',
        'file_operation',
        'shell_command',
        'custom_script',
        'workflow_action'
      )
    `);

    // Create bot_tools table
    await queryRunner.createTable(
      new Table({
        name: 'bot_tools',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'displayName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'bot_tool_type_enum',
            isNullable: false,
          },
          {
            name: 'config',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'requiresAuth',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'botId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'bot_tools',
      new TableForeignKey({
        columnNames: ['botId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bots',
        onDelete: 'CASCADE',
      })
    );

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_bot_tools_botId" ON "bot_tools" ("botId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bot_tools_type" ON "bot_tools" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bot_tools_active" ON "bot_tools" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('bot_tools');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('botId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('bot_tools', foreignKey);
    }

    // Drop table
    await queryRunner.dropTable('bot_tools');

    // Drop enum
    await queryRunner.query(`DROP TYPE "public"."bot_tool_type_enum"`);
  }
}
