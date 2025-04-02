import { MovieData } from '../../../shared/types/index.ts';

export class Movie {
  constructor(
    public readonly year: number,
    public readonly title: string,
    public readonly studios: string,
    public readonly producers: string,
    public readonly winner: boolean,
    public readonly id?: number
  ) {}

  static create(
    year: number,
    title: string,
    studios: string,
    producers: string,
    winner: boolean = false
  ): Movie {
    return new Movie(year, title, studios, producers, winner);
  }

  static fromDatabase(data: MovieData): Movie {
    return new Movie(
      data.year,
      data.title,
      data.studios,
      data.producers,
      data.winner,
      data.id
    );
  }
} 