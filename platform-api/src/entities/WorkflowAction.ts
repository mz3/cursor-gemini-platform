import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Workflow } from './Workflow';

@Entity('workflow_actions')
export class WorkflowAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column('jsonb')
  config!: Record<string, any>;

  @Column({ default: 0 })
  order!: number;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Workflow, (workflow: Workflow) => workflow.id)
  workflow!: Workflow;

  @Column()
  workflowId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
