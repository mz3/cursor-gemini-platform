import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { Application } from './Application.js';
import { Role } from './Role.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  roleId?: string;

  @ManyToOne(() => Role, (role: Role) => role.users)
  @JoinColumn({ name: 'roleId' })
  role?: Relation<Role>;

  // Legacy role field for backward compatibility during migration
  @Column({ default: 'user', nullable: true })
  legacyRole?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Application, application => application.user)
  applications!: Relation<Application>[];
}
