import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Relation } from 'typeorm';
import { User } from './User.js';
import { Model } from './Model.js';
import { Component } from './Component.js';

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

  @Column({ default: 'draft' })
  status!: string;

  @ManyToOne(() => User, (user: User) => user.id)
  user!: Relation<User>;

  @Column()
  userId!: string;

  @ManyToOne(() => Model, (model: Model) => model.id)
  model!: Relation<Model>;

  @Column()
  modelId!: string;

  @OneToMany(() => Component, (component: Component) => component.application)
  components!: Relation<Component>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
