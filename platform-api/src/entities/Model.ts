import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User';
import { Application } from './Application';

@Entity('models')
export class Model {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column({ nullable: true })
  description?: string;

  @Column('jsonb')
  schema!: Record<string, any>;

  @Column({ default: false })
  isSystem!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => User, user => user.id)
  user!: User;

  @Column()
  userId!: string;

  @OneToMany(() => Application, application => application.model)
  applications!: Application[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
