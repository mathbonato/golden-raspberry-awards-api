import fastify from 'fastify';
import cors from '@fastify/cors';
import { CalculateIntervalsUseCase } from '../../core/useCases/award/calculateIntervals.ts';
import { UploadMoviesUseCase } from '../../core/useCases/award/uploadMovies.ts';
import { ValidateCSVUseCase } from '../../core/useCases/award/validateCSV.ts';
import { MemoryMovieRepository } from '../database/memory/movieRepository.ts';
import { AwardController } from './controllers/awardController.ts';
import { awardRoutes } from './routes/awardRoutes.ts';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../../utils/logger.ts';

async function loadInitialCSV(
  validateCSVUseCase: ValidateCSVUseCase,
  uploadMoviesUseCase: UploadMoviesUseCase
) {
  const logger = Logger.getInstance();
  
  try {
    logger.info('Loading initial CSV file');
    const csvPath = join(process.cwd(), 'Movielist.csv');
    const fileContent = await readFile(csvPath);
    const records = await validateCSVUseCase.execute(fileContent);
    await uploadMoviesUseCase.execute(records);
    logger.info('Initial CSV file loaded successfully');
  } catch (error) {
    logger.error('Error loading initial CSV file', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function createServer() {
  const app = fastify();
  const logger = Logger.getInstance();

  await app.register(cors, { origin: true });

  const movieRepository = new MemoryMovieRepository();
  const uploadMoviesUseCase = new UploadMoviesUseCase(movieRepository);
  const calculateIntervalsUseCase = new CalculateIntervalsUseCase();
  const validateCSVUseCase = new ValidateCSVUseCase();

  const awardController = new AwardController(movieRepository, calculateIntervalsUseCase);

  await loadInitialCSV(validateCSVUseCase, uploadMoviesUseCase);

  await awardRoutes(app, awardController);

  return app;
}

const start = async () => {
  try {
    const app = await createServer();
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on port 3000');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start(); 