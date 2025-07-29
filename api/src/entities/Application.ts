import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Relation,
} from 'typeorm';
import { User } from './User.js';
import { Component } from './Component.js';
import { Feature } from './Feature.js';

@Entity('applications')
export class Application {
  /**
   * Unique identifier for the application.
   * @example "b7e8c2a1-4f2d-4e3a-9c1a-2d3e4f5a6b7c"
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Internal name of the application (slug or code-friendly).
   * @example "crm_dashboard"
   */
  @Column()
  name!: string;

  /**
   * Human-readable display name for the application.
   * @example "CRM Dashboard"
   */
  @Column()
  displayName!: string;

  /**
   * Description of the application.
   * @example "A dashboard for managing customer relationships and sales pipelines."
   */
  @Column('text')
  description!: string;

  /**
   * JSON configuration object for the application.
   * @example { "theme": "dark", "features": ["analytics", "notifications"] }
   */
  @Column('jsonb')
  config!: Record<string, any>;

  /**
   * Status of the application (e.g., draft, published, archived).
   * @example "draft"
   */
  @Column({ default: 'draft' })
  status!: string;

  /**
   * The user who owns this application.
   * @example { id: "user-123", name: "Alice" }
   */
  @ManyToOne(() => User, (user: User) => user.id)
  user!: Relation<User>;

  /**
   * Foreign key for the user who owns this application.
   * @example "user-123"
   */
  @Column()
  userId!: string;

  /**
   * Components that belong to this application.
   * @example [ { id: "comp-1", name: "Header" }, { id: "comp-2", name: "Footer" } ]
   */
  @OneToMany(() => Component, (component: Component) => component.application)
  components!: Relation<Component>[];

  /**
   * Features associated with this application.
   * @example [ { id: "feat-1", name: "Analytics" }, { id: "feat-2", name: "Notifications" } ]
   */
  @ManyToMany(() => Feature, (feature: Feature) => feature.applications)
  features!: Relation<Feature>[];

  /**
   * Timestamp when the application was created.
   * @example new Date("2024-06-01T12:00:00.000Z")
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Timestamp when the application was last updated.
   * @example new Date("2024-06-02T15:30:00.000Z")
   */
  @UpdateDateColumn()
  updatedAt!: Date;
}
