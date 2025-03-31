import { FastifyReply, FastifyRequest } from 'fastify';
import { CalculateIntervalsUseCase } from '../../../core/useCases/award/calculateIntervals.ts';
import { MovieRepository } from '../../../core/domain/repositories/movieRepository.ts';
import { AppError } from '../../../shared/errors/appError.ts';

export class AwardController {
  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly calculateIntervalsUseCase: CalculateIntervalsUseCase
  ) {}

  async getIntervals(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const winners = await this.movieRepository.getWinners();
      const result = this.calculateIntervalsUseCase.execute(winners);
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'internal server error' });
    }
  }
} 