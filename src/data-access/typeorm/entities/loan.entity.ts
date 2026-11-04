import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Book } from './book.entity';
import { LibraryUser } from './library-user.entity';

@Entity('loan')
export class Loan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'loaned_at', type: 'timestamp' })
  loanedAt!: Date;

  @Column({ name: 'returned_at', type: 'timestamp', nullable: true })
  returnedAt!: Date | null;

  // FK columns are mapped only through the relations
  @ManyToOne(() => Book)
  @JoinColumn({ name: 'book_id' })
  book!: Book;

  @ManyToOne(() => LibraryUser)
  @JoinColumn({ name: 'user_id' })
  user!: LibraryUser;
}