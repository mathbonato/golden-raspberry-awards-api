import { FastifyReply, FastifyRequest } from 'fastify';
import { CalculateIntervalsUseCase } from '../../../core/useCases/award/calculateIntervals.ts';
import { MovieRepository } from '../../../core/domain/repositories/movieRepository.ts';
import { AppError } from '../../../shared/errors/appError.ts';
import { Logger } from '../../../utils/logger.ts';

export class AwardController {
  private readonly logger = Logger.getInstance();

  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly calculateIntervalsUseCase: CalculateIntervalsUseCase
  ) {}

  async getIntervals(_request: FastifyRequest, reply: FastifyReply) {
    try {
      this.logger.info('Received request to calculate intervals');
      const winners = await this.movieRepository.getWinners();
      this.logger.info('Winners retrieved from repository', { data: { winnerCount: winners.length } });

      const result = this.calculateIntervalsUseCase.execute(winners);
      this.logger.info('Intervals calculated successfully', {
        data: {
          result
        }
      });

      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof AppError) {
        this.logger.error('Error calculating intervals', { 
          data: {
            error: error.message,
            statusCode: error.statusCode
          }
        });
        return reply.status(error.statusCode).send({ error: error.message });
      }
      this.logger.error('Internal server error', { 
        data: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return reply.status(500).send({ error: 'internal server error' });
    }
  }
} 