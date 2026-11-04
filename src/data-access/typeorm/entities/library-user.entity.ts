import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('library_user')
export class LibraryUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 150 })
  email!: string;
}