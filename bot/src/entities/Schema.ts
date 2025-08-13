import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Relation } from 'typeorm';
import { User } from './User.js';

@Entity('schemas')
export class Schema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column('jsonb')
  schema!: Record<string, any>;

  @Column({ default: false })
  isSystem!: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: Relation<User>;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
