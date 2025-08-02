import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Relation } from 'typeorm';
import { User } from './User';
import { Model } from './Model';
import { Component } from './Component';

@Entity('applications')
export class Application {
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

  @Column({
    type: 'enum',
    enum: ['draft', 'building', 'built', 'failed', 'deployed'],
    default: 'draft'
  })
  status!: string;

  @ManyToOne(() => User, (user: User) => user.id)
  user!: Relation<User>;

  @Column()
  userId!: string;

  @ManyToOne(() => Model, (model: Model) => model.id)
  model!: Relation<Model>;

  @Column({ nullable: true })
  modelId?: string;

  @OneToMany(() => Component, (component: Component) => component.application)
  components!: Component[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
