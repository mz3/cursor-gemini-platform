import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Model } from './Model.js';
import { User } from './User.js';

@TypeOrmEntity('entities')
export class Entity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: Record<string, any>;

  @Column({ type: 'uuid' })
  modelId!: string;

  @ManyToOne(() => Model, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modelId' })
  model!: Model;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'boolean', default: false })
  isSystem!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 