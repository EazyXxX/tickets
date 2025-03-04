import { z } from 'zod';

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  year: z.number().int().min(0).max(new Date().getFullYear()),
  genre: z.string().min(1),
  isbn: z.string().regex(/^(?:\d{10}|\d{13}|(?:\d{3}-\d{10}))$/),
  description: z.string().min(1),
  pages: z.number().int().positive(),
  language: z.string().min(1),
  rating: z.number().min(0).max(5),
  status: z.enum(['available', 'borrowed', 'reserved']),
  coverUrl: z.string().url().optional(),
});

const partialBookSchema = bookSchema.partial();

export function validateBook(data: unknown, isUpdate = false): any {
  const schema = isUpdate ? partialBookSchema : bookSchema;
  return schema.parse(data);
}