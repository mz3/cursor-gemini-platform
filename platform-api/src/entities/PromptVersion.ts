import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Prompt } from './Prompt';

@Entity('prompt_versions')
export class PromptVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('text')
  content!: string;

  @Column({
    type: 'enum',
    enum: ['llm', 'code_generation'],
    default: 'llm'
  })
  type!: string;

  @Column()
  version!: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Prompt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promptId' })
  prompt!: Prompt;

  @Column()
  promptId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
