import { FastifyInstance } from 'fastify';
import { MovieController } from '../controllers/movieController.js';

export async function movieRoutes(app: FastifyInstance, controller: MovieController) {
  app.post('/upload/csv', controller.uploadCSV.bind(controller));
} 