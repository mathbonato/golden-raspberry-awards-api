import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import { AwardIntervals, MovieRecord } from './types.js';
import { spawn } from 'child_process';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serverProcess: any;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Iniciar o servidor
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });

    // Aguardar o servidor iniciar
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Carregar dados de teste
    const csvFilePath = join(__dirname, '..', 'Movielist.csv');
    const fileContent = await readFile(csvFilePath, 'utf-8');
    
    const records: MovieRecord[] = await new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ';'
      }, (err, records) => {
        if (err) reject(err);
        resolve(records);
      });
    });

    // Limpar e inserir dados de teste
    await prisma.movie.deleteMany();
    for (const record of records) {
      await prisma.movie.create({
        data: {
          year: parseInt(record.year),
          title: record.title,
          studios: record.studios,
          producers: record.producers,
          winner: record.winner === 'yes'
        }
      });
    }
  });

  afterAll(async () => {
    // Encerrar o servidor
    if (serverProcess) {
      serverProcess.kill();
    }
    await prisma.$disconnect();
  });

  it('should return correct award intervals', async () => {
    const response = await fetch('http://localhost:3000/awards/intervals');
    const data = (await response.json()) as AwardIntervals;

    expect(data).toHaveProperty('min');
    expect(data).toHaveProperty('max');

    // Verificar estrutura dos dados
    data.min.forEach(item => {
      expect(item).toHaveProperty('producer');
      expect(item).toHaveProperty('interval');
      expect(item).toHaveProperty('previousWin');
      expect(item).toHaveProperty('followingWin');
    });

    data.max.forEach(item => {
      expect(item).toHaveProperty('producer');
      expect(item).toHaveProperty('interval');
      expect(item).toHaveProperty('previousWin');
      expect(item).toHaveProperty('followingWin');
    });

    // Verificar se os intervalos estão corretos
    if (data.min.length > 0) {
      const minInterval = data.min[0].interval;
      data.min.forEach(item => {
        expect(item.interval).toBe(minInterval);
      });
    }

    if (data.max.length > 0) {
      const maxInterval = data.max[0].interval;
      data.max.forEach(item => {
        expect(item.interval).toBe(maxInterval);
      });
    }
  });
}); 