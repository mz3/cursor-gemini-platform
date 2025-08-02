import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, Relation } from 'typeorm';
import { User } from './User.js';
import { Application } from './Application.js';

@Entity('features')
export class Feature {
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

  @Column({ type: 'jsonb', nullable: true })
  config?: any;

  @Column({ default: 'draft' })
  status!: string; // draft, active, deprecated

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: Relation<User>;

  @Column()
  userId!: string;

  @ManyToMany(() => Application, { cascade: true })
  @JoinTable({
    name: 'application_features',
    joinColumn: {
      name: 'featureId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'applicationId',
      referencedColumnName: 'id'
    }
  })
  applications!: Relation<Application>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
