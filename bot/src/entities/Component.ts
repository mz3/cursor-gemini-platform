import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Application } from './Application';

@Entity('components')
export class Component {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column('jsonb')
  config!: Record<string, any>;

  @Column('jsonb')
  props!: Record<string, any>;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Application, (application: Application) => application.id)
  application!: Application;

  @Column()
  applicationId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
