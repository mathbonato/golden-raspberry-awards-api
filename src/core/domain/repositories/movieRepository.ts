import { Movie } from '../entities/movie.ts';

export interface MovieRepository {
  loadMovies(movies: Movie[]): Promise<void>;
  getWinners(): Promise<Movie[]>;
} 