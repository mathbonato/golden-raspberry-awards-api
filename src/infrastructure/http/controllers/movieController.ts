import { FastifyReply, FastifyRequest } from 'fastify';
import { UploadMoviesUseCase } from '../../../core/useCases/award/uploadMovies.ts';
import { ValidateCSVUseCase } from '../../../core/useCases/award/validateCSV.ts';
import { AppError } from '../../../shared/errors/appError.ts';

export class MovieController {
  constructor(
    private readonly uploadMoviesUseCase: UploadMoviesUseCase,
    private readonly validateCSVUseCase: ValidateCSVUseCase
  ) {}

  async uploadCSV(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await request.file();
      
      if (!data) {
        throw new AppError('no file uploaded', 400);
      }

      if (data.mimetype !== 'text/csv' && data.mimetype !== 'application/vnd.ms-excel') {
        return reply.status(400).send({ error: 'file must be a valid csv' });
      }

      const buffer = await data.toBuffer();
      const records = await this.validateCSVUseCase.execute(buffer);
      await this.uploadMoviesUseCase.execute(records);

      return reply.status(201).send({ message: 'csv file processed successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'internal server error' });
    }
  }
} 