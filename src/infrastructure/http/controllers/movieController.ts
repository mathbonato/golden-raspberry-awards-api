import { FastifyReply, FastifyRequest } from 'fastify';
import { UploadMoviesUseCase } from '../../../core/useCases/award/uploadMovies.ts';
import { ValidateCSVUseCase } from '../../../core/useCases/award/validateCSV.ts';
import { AppError } from '../../../shared/errors/appError.ts';
import { Logger } from '../../../utils/logger.ts';

export class MovieController {
  private readonly logger = Logger.getInstance();

  constructor(
    private readonly uploadMoviesUseCase: UploadMoviesUseCase,
    private readonly validateCSVUseCase: ValidateCSVUseCase
  ) {}

  async uploadCSV(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.logger.info('Received CSV upload request');
      const data = await request.file();
      
      if (!data) {
        this.logger.error('Upload attempt without file');
        throw new AppError('no file uploaded', 400);
      }

      this.logger.debug('File received', { 
        data: {
          filename: data.filename,
          mimetype: data.mimetype,
          size: data.file.bytesRead
        }
      });

      if (data.mimetype !== 'text/csv' && data.mimetype !== 'application/vnd.ms-excel') {
        this.logger.error('Invalid file type', { data: { mimetype: data.mimetype } });
        return reply.status(400).send({ error: 'file must be a valid csv' });
      }

      const buffer = await data.toBuffer();
      this.logger.info('Starting CSV file validation');
      const records = await this.validateCSVUseCase.execute(buffer);
      
      this.logger.info('Starting records upload', { data: { recordCount: records.length } });
      await this.uploadMoviesUseCase.execute(records);

      this.logger.info('CSV upload completed successfully');
      return reply.status(201).send({ message: 'csv file processed successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        this.logger.error('Validation error', { 
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