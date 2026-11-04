// Plain class, no validation decorators or ValidationPipe on purpose:
// validation cost would be identical for all approaches and only adds noise
export class CreateBookDto {
  title: string;
  author: string;
  categoryId: number;
  stock: number;
}