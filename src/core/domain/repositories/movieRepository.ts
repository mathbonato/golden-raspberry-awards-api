import { Movie } from '../entities/movie.ts';

export interface MovieRepository {
  clearAndLoadMovies(movies: Movie[]): Promise<void>;
  getWinners(): Promise<Movie[]>;
} 