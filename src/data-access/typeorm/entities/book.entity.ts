import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('book')
export class Book {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 100 })
  author!: string;

  @Column({ name: 'category_id', type: 'int' })
  categoryId!: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;
}