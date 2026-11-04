import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('book_category')
export class BookCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;
}