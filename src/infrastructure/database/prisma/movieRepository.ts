import { PrismaClient } from '@prisma/client';
import { MovieRepository } from '../../../core/domain/repositories/movieRepository.ts';
import { Movie } from '../../../core/domain/entities/movie.ts';


export class PrismaMovieRepository implements MovieRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async clearAndLoadMovies(movies: Movie[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.movie.deleteMany(),
      ...movies.map(movie =>
        this.prisma.movie.create({
          data: {
            year: movie.year,
            title: movie.title,
            studios: movie.studios,
            producers: movie.producers,
            winner: movie.winner
          }
        })
      )
    ]);
  }

  async getWinners(): Promise<Movie[]> {
    const winners = await this.prisma.movie.findMany({
      where: { winner: true },
      orderBy: { year: 'asc' }
    });

    return winners.map(Movie.fromDatabase);
  }
} 