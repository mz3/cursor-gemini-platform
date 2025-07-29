export interface TaskCreateOptions {
  title: string;
  status?: 'Backlog' | 'In Progress' | 'Review' | 'Done';
  priority?: 'Low' | 'Medium' | 'High';
  tags?: string[];
}

export interface NotionConfig {
  token: string;
  databaseId: string;
  defaultStatus: string;
  defaultPriority: string;
}

export interface NotionTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  tags: string[];
  createdTime: string;
  lastEditedTime: string;
}
