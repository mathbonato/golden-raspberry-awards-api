import { Movie } from '../../../core/domain/entities/movie.ts';
import { MovieRepository } from '../../../core/domain/repositories/movieRepository.ts';
import { Logger } from '../../../utils/logger.ts';

export class MemoryMovieRepository implements MovieRepository {
  private movies: Movie[] = [];
  private readonly logger = Logger.getInstance();

  async loadMovies(movies: Movie[]): Promise<void> {
    try {
      this.logger.info('Loading movies', { count: movies.length });
      this.movies = [...movies];
      this.logger.info('Movies loaded successfully');
    } catch (error) {
      this.logger.error('Error loading movies', { error });
      throw error;
    }
  }

  async getWinners(): Promise<Movie[]> {
    try {
      this.logger.info('Getting winners');
      const winners = this.movies.filter(movie => movie.winner);
      this.logger.info('Winners retrieved successfully', { count: winners.length });
      return winners;
    } catch (error) {
      this.logger.error('Error getting winners', { error });
      throw error;
    }
  }
} 