import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Relation } from 'typeorm';

@Entity('relationships')
export class Relationship {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column()
  type!: string; // one-to-one, one-to-many, many-to-one, many-to-many

  @Column()
  sourceSchemaId!: string;

  @Column()
  targetSchemaId!: string;

  @Column()
  sourceField!: string;

  @Column()
  targetField!: string;

  @Column({ default: false })
  cascade!: boolean;

  @Column({ default: true })
  nullable!: boolean;

  @Column({ nullable: true })
  description?: string;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
