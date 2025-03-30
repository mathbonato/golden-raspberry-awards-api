import { PrismaClient } from '@prisma/client';
import { MovieRecord } from '../types.js';

export class MovieRepository {
  constructor(private prisma: PrismaClient) {}

  async clearAndLoadMovies(records: MovieRecord[]): Promise<void> {
    try {
      await this.prisma.movie.deleteMany();

      for (const record of records) {
        await this.prisma.movie.create({
          data: {
            year: parseInt(record.year),
            title: record.title,
            studios: record.studios,
            producers: record.producers,
            winner: record.winner === 'yes'
          }
        });
      }
    } catch (error) {
      throw new Error(`Erro ao carregar dados no banco: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async getWinners(): Promise<{ year: number; producers: string }[]> {
    try {
      return await this.prisma.movie.findMany({
        where: { winner: true },
        orderBy: { year: 'asc' },
        select: {
          year: true,
          producers: true
        }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar vencedores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
} 