import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class DraftReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  draftId: number;

  @Column()
  reviewerId: number;

  @Column({ nullable: true })
  feedback: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';
}
