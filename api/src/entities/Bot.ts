import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, OneToMany, JoinTable, Relation } from 'typeorm';
import { User } from './User.js';
import { Prompt } from './Prompt.js';
import { BotTool } from './BotTool.js';

@Entity('bots')
export class Bot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 'gemini-2.5-flash' })
  model!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: Relation<User>;

  @Column()
  userId!: string;

  @ManyToMany(() => Prompt, { cascade: true })
  @JoinTable({
    name: 'bot_prompts',
    joinColumn: {
      name: 'botId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'promptId',
      referencedColumnName: 'id'
    }
  })
  prompts!: Relation<Prompt>[];

  @OneToMany(() => BotTool, (tool: BotTool) => tool.bot)
  tools!: Relation<BotTool>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
