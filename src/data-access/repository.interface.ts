// Shared shapes: every approach must return exactly these fields
export interface BookDto {
  id: number;
  title: string;
  author: string;
  categoryId: number;
  stock: number;
}

export interface LoanDetailDto {
  id: number;
  bookTitle: string;
  userName: string;
  loanedAt: Date;
}

export interface BookStatDto {
  categoryId: number;
  totalBooks: number;
  totalStock: number;
}

export interface CreateBookInput {
  title: string;
  author: string;
  categoryId: number;
  stock: number;
}

// The contract that all four implementations must satisfy
export interface BookRepository {
  findBooks(limit: number): Promise<BookDto[]>;                 // Read
  createBook(input: CreateBookInput): Promise<BookDto>;         // Create
  findLoanDetails(limit: number): Promise<LoanDetailDto[]>;     // Join (loan + book + user)
  getBookStats(): Promise<BookStatDto[]>;                       // Group By
}

// Injection token (an interface does not exist at runtime)
export const BOOK_REPOSITORY = Symbol('BOOK_REPOSITORY');