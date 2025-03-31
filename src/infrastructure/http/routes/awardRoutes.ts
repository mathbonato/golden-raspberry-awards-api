import { FastifyInstance } from 'fastify';
import { AwardController } from '../controllers/awardController.js';

export async function awardRoutes(app: FastifyInstance, controller: AwardController) {
  app.get('/awards/intervals', controller.getIntervals.bind(controller));
} 