import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum PromptType {
  LLM = 'llm',
  CODE_GENERATION = 'code_generation'
}

@Entity('prompts')
export class Prompt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('text')
  content!: string;

  @Column({
    type: 'enum',
    enum: PromptType,
    default: PromptType.LLM
  })
  type!: PromptType;

  @Column()
  version!: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  isActive!: boolean;

  @Column({ nullable: true })
  parentPromptId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
