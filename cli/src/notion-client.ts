import { Client } from '@notionhq/client';
import { TaskCreateOptions, NotionTask } from './types';

export class NotionClient {
  private client: Client;
  private databaseId: string;

  constructor(token: string, databaseId: string) {
    this.client = new Client({ auth: token });
    this.databaseId = databaseId;
  }

  async createTask(options: TaskCreateOptions): Promise<NotionTask> {
    const properties: any = {
      'Task': {
        title: [
          {
            text: {
              content: options.title
            }
          }
        ]
      },
      'Status': {
        status: {
          name: options.status || 'Backlog'
        }
      },
      'Priority': {
        select: {
          name: options.priority || 'Medium'
        }
      }
    };

    // Add tags if provided (we'll use Sprint field for now)
    if (options.tags && options.tags.length > 0) {
      properties['Sprint'] = {
        select: {
          name: options.tags[0] || 'Backlog'
        }
      };
    }

    try {
      const response = await this.client.pages.create({
        parent: {
          database_id: this.databaseId
        },
        properties
      });

      return {
        id: response.id,
        title: options.title,
        status: options.status || 'Backlog',
        priority: options.priority || 'Medium',
        tags: options.tags || [],
        createdTime: new Date().toISOString(), // Notion API doesn't return these in create response
        lastEditedTime: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDatabase(): Promise<any> {
    try {
      return await this.client.databases.retrieve({
        database_id: this.databaseId
      });
    } catch (error) {
      throw new Error(`Failed to retrieve database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDatabaseProperties(): Promise<any> {
    try {
      const database = await this.client.databases.retrieve({
        database_id: this.databaseId
      });
      return database.properties;
    } catch (error) {
      throw new Error(`Failed to retrieve database properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listTasks(): Promise<any[]> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databaseId,
        sorts: [
          {
            property: 'Status',
            direction: 'ascending'
          },
          {
            property: 'Priority',
            direction: 'descending'
          }
        ]
      });

      return response.results.map((page: any) => {
        const properties = page.properties;
        return {
          id: page.id,
          title: properties.Task?.title?.[0]?.plain_text || 'Untitled',
          status: properties.Status?.status?.name || 'No Status',
          priority: properties.Priority?.select?.name || 'No Priority',
          sprint: properties.Sprint?.select?.name || 'No Sprint',
          assignedTo: properties['Assigned To']?.people || [],
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time
        };
      });
    } catch (error) {
      throw new Error(`Failed to list tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTask(pageId: string, options: Partial<TaskCreateOptions>): Promise<NotionTask> {
    const properties: any = {};

    // Update title if provided
    if (options.title) {
      properties['Task'] = {
        title: [
          {
            text: {
              content: options.title
            }
          }
        ]
      };
    }

    // Update status if provided
    if (options.status) {
      properties['Status'] = {
        status: {
          name: options.status
        }
      };
    }

    // Update priority if provided
    if (options.priority) {
      properties['Priority'] = {
        select: {
          name: options.priority
        }
      };
    }

    // Update tags if provided
    if (options.tags !== undefined) {
      properties['Sprint'] = {
        select: {
          name: options.tags && options.tags.length > 0 ? options.tags[0] : 'Backlog'
        }
      };
    }

    try {
      await this.client.pages.update({
        page_id: pageId,
        properties
      });

      // Return updated task info
      return {
        id: pageId,
        title: options.title || '',
        status: options.status || 'Backlog',
        priority: options.priority || 'Medium',
        tags: options.tags || [],
        createdTime: new Date().toISOString(),
        lastEditedTime: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
