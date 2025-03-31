import { AppError } from '../../../shared/errors/appError.ts';
import { CSVReader } from '../../../utils/csv/validator.ts';
import { MovieRecord } from '../../../shared/types/index.ts';
import { Logger } from '../../../utils/logger.ts';

export class ValidateCSVUseCase {
  private readonly logger = Logger.getInstance();

  private validateRequiredColumns(record: MovieRecord): void {
    this.logger.debug('Validating required columns', { record });
    const requiredColumns = ['year', 'title', 'studios', 'producers', 'winner'];
    const columns = Object.keys(record);

    for (const column of requiredColumns) {
      if (!columns.includes(column)) {
        this.logger.error('Required column not found', { column, columns });
        throw new AppError(`Missing required column: ${column}`, 400);
      }
    }
    this.logger.info('Required columns validation completed successfully');
  }

  private validateRecord(record: MovieRecord): void {
    this.logger.debug('Validating record', { record });
    const year = parseInt(record.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      this.logger.error('Invalid year', { year: record.year });
      throw new AppError(`Invalid year: ${record.year}`, 400);
    }

    if (!record.title.trim()) {
      this.logger.error('Empty title');
      throw new AppError('Title cannot be empty', 400);
    }

    if (!record.studios.trim()) {
      this.logger.error('Empty studios');
      throw new AppError('Studios cannot be empty', 400);
    }

    if (!record.producers.trim()) {
      this.logger.error('Empty producers');
      throw new AppError('Producers cannot be empty', 400);
    }

    if (record.winner !== 'yes' && record.winner !== '') {
      this.logger.error('Invalid winner value', { winner: record.winner });
      throw new AppError(`Invalid winner value: ${record.winner}`, 400);
    }
  }

  async execute(file: Buffer): Promise<MovieRecord[]> {
    try {
      this.logger.info('Starting CSV file validation');
      const records = await CSVReader.readCSV(file);
      this.logger.info('CSV file read successfully', { recordCount: records.length });

      if (records.length > 0) {
        this.validateRequiredColumns(records[0]);
      }

      records.forEach((record, index) => {
        this.logger.debug(`Validating record ${index + 1}/${records.length}`);
        this.validateRecord(record);
        this.logger.debug('Record validated successfully', { index: index + 1 });
      });

      this.logger.info('CSV file validation completed successfully');
      return records;
    } catch (error) {
      if (error instanceof AppError) {
        this.logger.error('Validation error', { error: error.message });
        throw error;
      }
      this.logger.error('Error reading CSV file', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new AppError('Error reading CSV file', 400);
    }
  }
} 