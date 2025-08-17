import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Relation } from 'typeorm';
import { User } from './User.js';

@Entity('services')
export class Service {
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

  @Column({ default: 'http' })
  type!: string; // http, grpc, websocket, etc.

  @Column({ nullable: true })
  endpoint?: string;

  @Column({ type: 'jsonb', nullable: true })
  config?: any; // Service-specific configuration

  @Column({ default: 'draft' })
  status!: string; // draft, active, deprecated, error

  @Column({ type: 'jsonb', nullable: true })
  healthCheck?: any; // Health check configuration

  @Column({ type: 'jsonb', nullable: true })
  authentication?: any; // Auth configuration

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: Relation<User>;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
