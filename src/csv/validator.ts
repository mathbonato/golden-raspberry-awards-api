import { MovieRecord } from '../types.js';
import { parse } from 'csv-parse';
import { readFile } from 'fs/promises';

export class CSVValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CSVValidationError';
  }
}

export class CSVReader {
  private static readonly REQUIRED_COLUMNS = ['year', 'title', 'studios', 'producers', 'winner'];
  private static readonly VALID_YEAR_RANGE = { min: 1980, max: 2019 };

  static async validateAndReadCSV(filePath: string): Promise<MovieRecord[]> {
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      
      const records: MovieRecord[] = await new Promise((resolve, reject) => {
        parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          delimiter: ';'
        }, (err, records) => {
          if (err) reject(new CSVValidationError(`Erro ao processar CSV: ${err.message}`));
          resolve(records);
        });
      });

      this.validateCSVStructure(records);

      this.validateRecords(records);

      return records;
    } catch (error) {
      if (error instanceof CSVValidationError) {
        throw error;
      }
      throw new CSVValidationError(`Erro ao ler arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private static validateCSVStructure(records: any[]): void {
    if (!records || records.length === 0) {
      throw new CSVValidationError('O arquivo CSV está vazio');
    }

    const firstRecord = records[0];
    const missingColumns = this.REQUIRED_COLUMNS.filter(column => !(column in firstRecord));

    if (missingColumns.length > 0) {
      throw new CSVValidationError(`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`);
    }
  }

  private static validateRecords(records: MovieRecord[]): void {
    records.forEach((record, index) => {
      const year = parseInt(record.year);
      if (isNaN(year) || year < this.VALID_YEAR_RANGE.min || year > this.VALID_YEAR_RANGE.max) {
        throw new CSVValidationError(
          `Ano inválido na linha ${index + 1}: ${record.year}. Deve estar entre ${this.VALID_YEAR_RANGE.min} e ${this.VALID_YEAR_RANGE.max}`
        );
      }

      if (!record.title || record.title.trim().length === 0) {
        throw new CSVValidationError(`Título inválido na linha ${index + 1}: não pode estar vazio`);
      }

      if (!record.studios || record.studios.trim().length === 0) {
        throw new CSVValidationError(`Estúdios inválidos na linha ${index + 1}: não podem estar vazios`);
      }

      if (!record.producers || record.producers.trim().length === 0) {
        throw new CSVValidationError(`Produtores inválidos na linha ${index + 1}: não podem estar vazios`);
      }

      if (!['yes', ''].includes(record.winner.toLowerCase())) {
        throw new CSVValidationError(`Valor inválido para winner na linha ${index + 1}: deve ser 'yes' ou vazio`);
      }
    });
  }
} 