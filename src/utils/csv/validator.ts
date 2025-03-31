import { parse } from 'csv-parse';
import { readFile } from 'fs/promises';
import { MovieRecord } from '../../shared/types/index.ts';
import { AppError } from '../../shared/errors/appError.ts';

export class CSVReader {
  static async readCSV(filePath: string): Promise<MovieRecord[]> {
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      
      return new Promise((resolve, reject) => {
        parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          delimiter: ';'
        }, (err, records: MovieRecord[]) => {
          if (err) reject(new AppError('Error parsing CSV file'));
          
          if (!records.length) {
            reject(new AppError('CSV file is empty'));
          }

          resolve(records);
        });
      });
    } catch (error) {
      throw new AppError('Error reading CSV file');
    }
  }
} 