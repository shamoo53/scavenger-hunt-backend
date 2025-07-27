import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum BookmarkType {
  PUZZLE = 'puzzle',
  RESOURCE = 'resource',
}

@Entity('bookmarks')
@Index(['playerId', 'itemId', 'type'], { unique: true })
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  playerId: string;

  @Column({ type: 'uuid' })
  @Index()
  itemId: string;

  @Column({
    type: 'enum',
    enum: BookmarkType,
  })
  type: BookmarkType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}