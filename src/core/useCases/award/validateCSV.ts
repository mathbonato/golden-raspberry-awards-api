import { AppError } from '../../../shared/errors/appError.ts';
import { CSVReader } from '../../../utils/csv/validator.ts';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { MovieRecord } from '../../../shared/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ValidateCSVUseCase {
  private validateRequiredColumns(record: MovieRecord): void {
    const requiredColumns = ['year', 'title', 'studios', 'producers', 'winner'];
    const columns = Object.keys(record);

    for (const column of requiredColumns) {
      if (!columns.includes(column)) {
        throw new AppError(`Missing required column: ${column}`, 400);
      }
    }
  }

  private validateRecord(record: MovieRecord): void {
    const year = parseInt(record.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      throw new AppError(`Invalid year: ${record.year}`, 400);
    }

    if (!record.title.trim()) {
      throw new AppError('Title cannot be empty', 400);
    }

    if (!record.studios.trim()) {
      throw new AppError('Studios cannot be empty', 400);
    }

    if (!record.producers.trim()) {
      throw new AppError('Producers cannot be empty', 400);
    }

    if (record.winner !== 'yes' && record.winner !== '') {
      throw new AppError(`Invalid winner value: ${record.winner}`, 400);
    }
  }

  async execute(file: Buffer): Promise<MovieRecord[]> {
    const tempPath = join(__dirname, '..', '..', '..', '..', 'temp.csv');
    await writeFile(tempPath, file);

    try {
      const records = await CSVReader.readCSV(tempPath);

      if (records.length > 0) {
        this.validateRequiredColumns(records[0]);
      }

      records.forEach(record => this.validateRecord(record));

      return records;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error reading CSV file', 400);
    }
  }
} 