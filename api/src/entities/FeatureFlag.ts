import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, Relation } from 'typeorm';
import { Role } from './Role.js';

export enum FeatureFlagType {
  BOOLEAN = 'boolean',
  PERCENTAGE = 'percentage',
  ROLE_BASED = 'role_based',
  USER_BASED = 'user_based'
}

@Entity('feature_flags')
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: FeatureFlagType,
    default: FeatureFlagType.BOOLEAN
  })
  type!: FeatureFlagType;

  @Column({ default: false })
  enabled!: boolean;

  // For percentage-based flags (0-100)
  @Column({ type: 'int', nullable: true })
  percentage?: number;

  // JSON configuration for complex flag logic
  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, any>;

  // Specific user IDs (for user-based flags)
  @Column({ type: 'jsonb', nullable: true })
  userIds?: string[];

  @Column({ default: false })
  isSystem!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // For role-based flags
  @ManyToMany(() => Role, { cascade: false })
  @JoinTable({
    name: 'feature_flag_roles',
    joinColumn: { name: 'featureFlagId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' }
  })
  roles!: Relation<Role>[];
}
