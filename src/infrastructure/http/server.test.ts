import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { join } from 'path';
import fetch from 'node-fetch';
import { readFile } from 'fs/promises';
import { createServer } from './server.ts';
import { UploadMoviesUseCase } from '../../core/useCases/award/uploadMovies.ts';
import { ValidateCSVUseCase } from '../../core/useCases/award/validateCSV.ts';
import { MemoryMovieRepository } from '../database/memory/movieRepository.ts';

interface AwardIntervals {
  min: Array<{
    producer: string;
    interval: number;
    previousWin: number;
    followingWin: number;
  }>;
  max: Array<{
    producer: string;
    interval: number;
    previousWin: number;
    followingWin: number;
  }>;
}

describe('Awards API', () => {
  let app: any;
  let movieRepository: MemoryMovieRepository;

  beforeAll(async () => {
    app = await createServer();
  }, 60000);

  beforeEach(async () => {
    movieRepository = new MemoryMovieRepository();
    
    const csvPath = join(process.cwd(), 'Movielist.csv');
    const fileContent = await readFile(csvPath);
    const validateCSVUseCase = new ValidateCSVUseCase();
    const uploadMoviesUseCase = new UploadMoviesUseCase(movieRepository);
    
    const records = await validateCSVUseCase.execute(fileContent);
    await uploadMoviesUseCase.execute(records);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return the correct producers with minimum intervals', async () => {
    const intervalsResponse = await fetch('http://localhost:3000/awards/intervals');
    const intervalsData = await intervalsResponse.json() as AwardIntervals;

    expect(intervalsData.min).toContainEqual({
      producer: 'Joel Silver',
      interval: 1,
      previousWin: 1990,
      followingWin: 1991
    });

    const minIntervals = intervalsData.min.map(p => p.interval);
    expect(new Set(minIntervals).size).toBe(1);
    expect(minIntervals[0]).toBe(1);
  });

  it('should return the correct producers with maximum intervals', async () => {
    const intervalsResponse = await fetch('http://localhost:3000/awards/intervals');
    const intervalsData = await intervalsResponse.json() as AwardIntervals;

    expect(intervalsData.max).toContainEqual({
      producer: 'Matthew Vaughn',
      interval: 13,
      previousWin: 2002,
      followingWin: 2015
    });

    const maxIntervals = intervalsData.max.map(p => p.interval);
    expect(new Set(maxIntervals).size).toBe(1);
    expect(maxIntervals[0]).toBe(13);
  });
}); 