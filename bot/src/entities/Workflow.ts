import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Relation } from 'typeorm';
import { WorkflowAction } from './WorkflowAction.js';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column('text')
  description!: string;

  @Column('jsonb')
  config!: Record<string, any>;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => WorkflowAction, (action: WorkflowAction) => action.workflow)
  actions!: Relation<WorkflowAction>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
