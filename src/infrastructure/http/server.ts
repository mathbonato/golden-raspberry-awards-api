import fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import { CalculateIntervalsUseCase } from '../../core/useCases/award/calculateIntervals.ts';
import { UploadMoviesUseCase } from '../../core/useCases/award/uploadMovies.ts';
import { ValidateCSVUseCase } from '../../core/useCases/award/validateCSV.ts';
import { PrismaMovieRepository } from '../database/prisma/movieRepository.ts';
import { AwardController } from './controllers/awardController.ts';
import { MovieController } from './controllers/movieController.ts';
import { awardRoutes } from './routes/awardRoutes.ts';
import { movieRoutes } from './routes/movieRoutes.ts';

export async function createServer() {
  const prisma = new PrismaClient();
  const app = fastify();

  await app.register(cors, { origin: true });

  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 }
  });

  const movieRepository = new PrismaMovieRepository(prisma);
  const calculateIntervalsUseCase = new CalculateIntervalsUseCase();
  const uploadMoviesUseCase = new UploadMoviesUseCase(movieRepository);
  const validateCSVUseCase = new ValidateCSVUseCase();

  const awardController = new AwardController(movieRepository, calculateIntervalsUseCase);
  const movieController = new MovieController(uploadMoviesUseCase, validateCSVUseCase);

  await awardRoutes(app, awardController);
  await movieRoutes(app, movieController);

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