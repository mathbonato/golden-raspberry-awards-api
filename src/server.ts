import fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile } from 'fs/promises';
import { CSVReader } from './csv/validator.js';
import { MovieRepository } from './database/movieRepository.js';
import { AwardService } from './services/awardService.js';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = fastify();
const movieRepository = new MovieRepository(prisma);
const awardService = new AwardService();

app.register(cors, { origin: true });

app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

app.post('/upload/csv', async (request, reply) => {
  try {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'Nenhum arquivo enviado' });
    }

    if (data.mimetype !== 'text/csv' && data.mimetype !== 'application/vnd.ms-excel') {
      return reply.status(400).send({ error: 'Arquivo deve ser um CSV válido' });
    }

    const tempPath = join(__dirname, '..', 'temp.csv');
    await data.toBuffer().then(buffer => {
      return writeFile(tempPath, buffer);
    });

    const records = await CSVReader.validateAndReadCSV(tempPath);
    await movieRepository.clearAndLoadMovies(records);

    return { message: 'Arquivo CSV processado com sucesso' };
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    if (error instanceof Error) {
      return reply.status(400).send({ error: error.message });
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' });
  }
});

app.get('/awards/intervals', async (request, reply) => {
  try {
    const winners = await movieRepository.getWinners();
    const result = awardService.calculateIntervals(winners);
    return result;
  } catch (error) {
    console.error('Erro ao processar intervalos:', error);
    reply.status(500).send({ error: 'Erro interno do servidor' });
    throw error;
  }
});

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Servidor rodando na porta 3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();