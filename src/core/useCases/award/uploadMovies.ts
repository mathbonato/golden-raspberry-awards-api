import { Movie } from '../../domain/entities/movie.ts';
import { MovieRepository } from '../../domain/repositories/movieRepository.ts';
import { MovieRecord } from '../../../shared/types/index.ts';
import { AppError } from '../../../shared/errors/appError.ts';
import { Logger } from '../../../utils/logger.ts';

export class UploadMoviesUseCase {
  private readonly logger = Logger.getInstance();

  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(records: MovieRecord[]): Promise<void> {
    try {
      this.logger.info('Starting movies upload', { recordCount: records.length });
      
      const movies = records.map(record => {
        this.logger.debug('Converting record to Movie entity', { record });
        return Movie.create(
          parseInt(record.year),
          record.title,
          record.studios,
          record.producers,
          record.winner === 'yes'
        );
      });

      this.logger.info('Records converted to Movie entities', { 
        movieCount: movies.length,
        winners: movies.filter(m => m.winner).length
      });

      await this.movieRepository.clearAndLoadMovies(movies);
      this.logger.info('Movies loaded successfully into repository');
    } catch (error) {
      this.logger.error('Error uploading movies', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new AppError('Error uploading movies', 500);
    }
  }
} 