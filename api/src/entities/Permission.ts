import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, Relation } from 'typeorm';
import { Role } from './Role.js';

export enum PermissionResource {
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  SCHEMA = 'schema',
  ENTITY = 'entity',
  APPLICATION = 'application',
  BOT = 'bot',
  FEATURE = 'feature',
  WORKFLOW = 'workflow',
  PROMPT = 'prompt',
  TEMPLATE = 'template',
  ADMIN = 'admin',
  SYSTEM = 'system'
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  MANAGE = 'manage'
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  displayName!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PermissionResource
  })
  resource!: PermissionResource;

  @Column({
    type: 'enum',
    enum: PermissionAction
  })
  action!: PermissionAction;

  @Column({ default: false })
  isSystem!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToMany(() => Role, (role: Role) => role.permissions)
  roles!: Relation<Role>[];
}
