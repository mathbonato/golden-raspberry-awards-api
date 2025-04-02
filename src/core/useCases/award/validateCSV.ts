import { AppError } from '../../../shared/errors/appError.ts';
import { CSVReader } from '../../../utils/csv/validator.ts';
import { MovieRecord } from '../../../shared/types/index.ts';
import { Logger } from '../../../utils/logger.ts';

export class ValidateCSVUseCase {
  private readonly logger = Logger.getInstance();

  private validateRequiredColumns(record: MovieRecord): void {
    this.logger.debug('Validating required columns', { data: { record } });
    const requiredColumns = ['year', 'title', 'studios', 'producers', 'winner'];
    const columns = Object.keys(record);

    for (const column of requiredColumns) {
      if (!columns.includes(column)) {
        this.logger.error('Required column not found', { data: { column, columns } });
        throw new AppError(`Missing required column: ${column}`, 400);
      }
    }
    this.logger.info('Required columns validation completed successfully');
  }

  private validateRecord(record: MovieRecord, index: number): { isValid: boolean; errors: string[] } {
    const correlationId = `record-${index + 1}`;
    const errors: string[] = [];
    
    this.logger.debug('Validating record', { correlationId, data: { record } });
    
    const year = parseInt(record.year);
    if (isNaN(year) || year < 1900) {
      this.logger.error('Invalid year', { correlationId, data: { year: record.year } });
      errors.push(`Invalid year: ${record.year}`);
    }

    if (!record.title.trim()) {
      this.logger.error('Empty title', { correlationId });
      errors.push('Title cannot be empty');
    }

    if (!record.studios.trim()) {
      this.logger.error('Empty studios', { correlationId });
      errors.push('Studios cannot be empty');
    }

    if (!record.producers.trim()) {
      this.logger.error('Empty producers', { correlationId });
      errors.push('Producers cannot be empty');
    }

    if (record.winner !== 'yes' && record.winner !== '') {
      this.logger.error('Invalid winner value', { correlationId, data: { winner: record.winner } });
      errors.push(`Invalid winner value: ${record.winner}`);
    }

    if (errors.length === 0) {
      this.logger.debug('Record validated successfully', { correlationId });
    }

    return { isValid: errors.length === 0, errors };
  }

  async execute(file: Buffer): Promise<MovieRecord[]> {
    const correlationId = `csv-${Date.now()}`;
    try {
      this.logger.info('Starting CSV file validation', { correlationId });
      const records = await CSVReader.readCSV(file);
      this.logger.info('CSV file read successfully', { correlationId, data: { recordCount: records.length } });

      if (records.length > 0) {
        this.validateRequiredColumns(records[0]);
      }

      const validRecords: MovieRecord[] = [];
      const invalidRecords: { record: number; recordData: MovieRecord; errors: string[] }[] = [];
      
      records.forEach((record, index) => {
        this.logger.debug(`Validating record ${index + 1}/${records.length}`, { correlationId });
        const validation = this.validateRecord(record, index);
        
        if (validation.isValid) {
          validRecords.push(record);
          if (record.winner === 'yes') {
            this.logger.debug('Found winner record', { 
              correlationId, 
              data: { 
                year: record.year,
                title: record.title,
                producers: record.producers
              }
            });
          }
        } else {
          invalidRecords.push({ record: index + 1, recordData: record, errors: validation.errors });
        }
      });

      if (invalidRecords.length > 0) {
        this.logger.warn('Invalid records found', { 
          correlationId, 
          data: { 
            validCount: validRecords.length,
            invalidCount: invalidRecords.length,
            invalidRecords 
          }
        });
      }

      this.logger.info('CSV file validation completed', { 
        correlationId, 
        data: { 
          totalRecords: records.length,
          validRecords: validRecords.length,
          invalidRecords: invalidRecords.length,
          winners: validRecords.filter(r => r.winner === 'yes').length
        }
      });

      return validRecords;
    } catch (error) {
      if (error instanceof AppError) {
        this.logger.error('Validation error', { correlationId, data: { error: error.message } });
        throw error;
      }
      this.logger.error('Error reading CSV file', { correlationId, data: { error: error instanceof Error ? error.message : 'Unknown error' } });
      throw new AppError('Error reading CSV file', 400);
    }
  }
} 