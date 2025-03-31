import { Movie } from '../../domain/entities/movie.ts';
import { MovieRepository } from '../../domain/repositories/movieRepository.ts';
import { MovieRecord } from '../../../shared/types/index.ts';
import { AppError } from '../../../shared/errors/appError.ts';

export class UploadMoviesUseCase {
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(records: MovieRecord[]): Promise<void> {
    try {
      const movies = records.map(record => 
        Movie.create(
          parseInt(record.year),
          record.title,
          record.studios,
          record.producers,
          record.winner === 'yes'
        )
      );

      await this.movieRepository.clearAndLoadMovies(movies);
    } catch (error) {
      throw new AppError('Error uploading movies', 500);
    }
  }
} 