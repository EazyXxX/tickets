import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { prisma } from './db';

export interface Context {
  prisma: PrismaClient;
  user: any | null;
}

export async function context({ req }: { req: Request }): Promise<Context> {
  const auth = req?.headers?.authorization;
  let user = null;

  if (auth) {
    const token = auth.replace('Bearer ', '');
    try {
      const { userId } = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      user = await prisma.user.findUnique({ where: { id: userId } });
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  return {
    prisma,
    user,
  };
}