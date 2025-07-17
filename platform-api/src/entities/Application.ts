import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
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

  @Column({ default: 'draft' })
  status!: string;

  @ManyToOne(() => User, (user: User) => user.id)
  user!: User;

  @Column()
  userId!: string;

  @ManyToOne(() => Model, (model: Model) => model.id)
  model!: Model;

  @Column()
  modelId!: string;

  @OneToMany(() => Component, (component: Component) => component.application)
  components!: Component[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
