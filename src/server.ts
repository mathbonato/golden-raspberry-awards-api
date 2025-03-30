import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AwardIntervals, MovieRecord, ProducerInterval } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const app: FastifyInstance = fastify();

// Configuração do CORS
app.register(cors, {
  origin: true
});

// Função para carregar dados do CSV
async function loadCSVData(): Promise<void> {
  try {
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

    // Limpar tabela existente
    await prisma.movie.deleteMany();

    // Inserir novos registros
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

    console.log('Dados carregados com sucesso!');
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

// Rota para obter intervalos de prêmios
app.get('/awards/intervals', async (request, reply): Promise<AwardIntervals> => {
  try {
    // Buscar todos os filmes vencedores
    const winners = await prisma.movie.findMany({
      where: { winner: true },
      orderBy: { year: 'asc' }
    });

    // Processar intervalos
    const intervals: Record<string, number[]> = {};
    
    winners.forEach(movie => {
      const producers = movie.producers.split(', ').map(p => p.trim());
      
      producers.forEach(producer => {
        if (!intervals[producer]) {
          intervals[producer] = [];
        }
        intervals[producer].push(movie.year);
      });
    });

    // Calcular intervalos
    const result: AwardIntervals = {
      min: [],
      max: []
    };

    let minInterval = Infinity;
    let maxInterval = 0;

    for (const [producer, years] of Object.entries(intervals)) {
      if (years.length >= 2) {
        for (let i = 1; i < years.length; i++) {
          const interval = years[i] - years[i - 1];
          const producerInterval: ProducerInterval = {
            producer,
            interval,
            previousWin: years[i - 1],
            followingWin: years[i]
          };
          
          if (interval < minInterval) {
            minInterval = interval;
            result.min = [producerInterval];
          } else if (interval === minInterval) {
            result.min.push(producerInterval);
          }

          if (interval > maxInterval) {
            maxInterval = interval;
            result.max = [producerInterval];
          } else if (interval === maxInterval) {
            result.max.push(producerInterval);
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Erro ao processar intervalos:', error);
    reply.status(500).send({ error: 'Erro interno do servidor' });
    throw error;
  }
});

// Iniciar servidor
const start = async (): Promise<void> => {
  try {
    // Carregar dados do CSV
    await loadCSVData();
    
    // Iniciar servidor
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Servidor rodando na porta 3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 