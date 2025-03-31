import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { readFile } from 'fs/promises';
import { createServer } from './server.ts';
import { AwardIntervals } from '../../shared/types/index.ts';
import { Logger } from '../../utils/logger.ts';

interface UploadResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
}

interface LogEntry {
  level: string;
  message: string;
  correlationId?: string;
  data?: any;
}

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mockLogs: LogEntry[] = [];
const originalLogger = Logger.getInstance();
const mockLogger = {
  ...originalLogger,
  info: originalLogger.info.bind(originalLogger),
  debug: originalLogger.debug.bind(originalLogger),
  warn: async (message: string, context?: any) => {
    mockLogs.push({ level: 'WARN', message, ...context });
    await originalLogger.warn(message, context);
  },
  error: async (message: string, context?: any) => {
    mockLogs.push({ level: 'ERROR', message, ...context });
    await originalLogger.error(message, context);
  }
} as Logger;

Logger.getInstance = () => mockLogger;

describe('Awards API', () => {
  let app: any;

  beforeAll(async () => {
    app = await createServer();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    mockLogs.length = 0;
  });

  it('should handle real data from the provided CSV', async () => {
    const csvPath = join(__dirname, '..', '..', '..', 'Movielist.csv');
    const fileContent = await readFile(csvPath, 'utf-8');

    const form = new FormData();
    form.append('file', fileContent, {
      filename: 'Movielist.csv',
      contentType: 'text/csv'
    });

    const uploadResponse = await fetch('http://localhost:3000/upload/csv', {
      method: 'POST',
      body: form
    });

    expect(uploadResponse.status).toBe(201);
    const uploadData = await uploadResponse.json() as UploadResponse;
    expect(uploadData.message).toBe('csv file processed successfully');

    const intervalsResponse = await fetch('http://localhost:3000/awards/intervals');
    const intervalsData = await intervalsResponse.json() as AwardIntervals;

    expect(intervalsData.min.length).toBeGreaterThan(0);
    expect(intervalsData.max.length).toBeGreaterThan(0);

    const minIntervals = intervalsData.min.map(i => i.interval);
    const maxIntervals = intervalsData.max.map(i => i.interval);
    
    expect(Math.min(...minIntervals)).toBe(minIntervals[0]);
    expect(Math.max(...maxIntervals)).toBe(maxIntervals[0]);

    const minProducers = new Set(intervalsData.min.map(i => i.producer));
    const maxProducers = new Set(intervalsData.max.map(i => i.producer));
    
    const commonProducers = [...minProducers].filter(p => maxProducers.has(p));
    expect(commonProducers.length).toBe(0);
  });

  it('should return valid max and min intervals following the specified format', async () => {
    const testCsv = `year;title;studios;producers;winner
                    1980;Movie 1;Studio A;Producer 1;yes
                    1981;Movie 2;Studio B;Producer 2;yes
                    1982;Movie 3;Studio C;Producer 1;yes
                    1983;Movie 4;Studio D;Producer 2;yes
                    1984;Movie 5;Studio E;Producer 3;yes
                    1999;Movie 6;Studio F;Producer 3;yes`;

    const form = new FormData();
    form.append('file', testCsv, {
      filename: 'test.csv',
      contentType: 'text/csv'
    });

    const uploadResponse = await fetch('http://localhost:3000/upload/csv', {
      method: 'POST',
      body: form
    });

    expect(uploadResponse.status).toBe(201);

    const intervalsResponse = await fetch('http://localhost:3000/awards/intervals');
    const intervalsData = await intervalsResponse.json() as AwardIntervals;

    expect(intervalsData).toHaveProperty('min');
    expect(intervalsData).toHaveProperty('max');
    expect(Array.isArray(intervalsData.min)).toBe(true);
    expect(Array.isArray(intervalsData.max)).toBe(true);

    const intervalFormat = {
      producer: expect.any(String),
      interval: expect.any(Number),
      previousWin: expect.any(Number),
      followingWin: expect.any(Number)
    };

    intervalsData.min.forEach(interval => {
      expect(interval).toMatchObject(intervalFormat);
    });

    intervalsData.max.forEach(interval => {
      expect(interval).toMatchObject(intervalFormat);
    });

    const producer1Intervals = intervalsData.min.filter(i => i.producer === 'Producer 1');
    expect(producer1Intervals.length).toBeGreaterThan(0);
    expect(producer1Intervals[0]).toMatchObject({
      producer: 'Producer 1',
      interval: 2,
      previousWin: 1980,
      followingWin: 1982
    });

    const producer3Intervals = intervalsData.max.filter(i => i.producer === 'Producer 3');
    expect(producer3Intervals.length).toBeGreaterThan(0);
    expect(producer3Intervals[0]).toMatchObject({
      producer: 'Producer 3',
      interval: 15,
      previousWin: 1984,
      followingWin: 1999
    });

    const minIntervals = intervalsData.min.map(i => i.interval);
    const maxIntervals = intervalsData.max.map(i => i.interval);
    
    expect(Math.min(...minIntervals)).toBe(minIntervals[0]);
    expect(Math.max(...maxIntervals)).toBe(maxIntervals[0]);

    const minProducers = new Set(intervalsData.min.map(i => i.producer));
    const maxProducers = new Set(intervalsData.max.map(i => i.producer));
    const commonProducers = [...minProducers].filter(p => maxProducers.has(p));
    expect(commonProducers.length).toBe(0);
  });

  it('should reject invalid file types', async () => {
    const form = new FormData();
    form.append('file', 'invalid content', {
      filename: 'test.txt',
      contentType: 'text/plain'
    });

    const response = await fetch('http://localhost:3000/upload/csv', {
      method: 'POST',
      body: form
    });

    expect(response.status).toBe(400);
    const data = await response.json() as ErrorResponse;
    expect(data.error).toBe('file must be a valid csv');
  });

  it('should calculate intervals correctly for producers in different combinations', async () => {
    const testCsv = `year;title;studios;producers;winner
                    1980;Movie 1;Studio A;John Smith;yes
                    1985;Movie 2;Studio B;John Smith and Jane Doe;yes
                    1990;Movie 3;Studio C;John Smith;yes
                    1995;Movie 4;Studio D;John Smith and Bob Wilson;yes
                    2000;Movie 5;Studio E;John Smith;yes`;

    const form = new FormData();
    form.append('file', testCsv, {
      filename: 'test.csv',
      contentType: 'text/csv'
    });

    const uploadResponse = await fetch('http://localhost:3000/upload/csv', {
      method: 'POST',
      body: form
    });

    expect(uploadResponse.status).toBe(201);

    const intervalsResponse = await fetch('http://localhost:3000/awards/intervals');
    const intervalsData = await intervalsResponse.json() as AwardIntervals;

    const johnSmithIntervals = intervalsData.min.filter(i => i.producer === 'John Smith');
    expect(johnSmithIntervals.length).toBeGreaterThan(0);
    
    johnSmithIntervals.forEach(interval => {
      expect(interval.interval).toBe(5);
    });
  });

  it('should handle ties in intervals correctly', async () => {
    const testCsv = `year;title;studios;producers;winner
                    1980;Movie 1;Studio A;John Smith, Jane Doe;yes
                    1985;Movie 2;Studio B;John Smith, Jane Doe, Bob Wilson;yes
                    1990;Movie 3;Studio C;Jane Doe, Bob Wilson;yes
                    1995;Movie 4;Studio D;John Smith, Bob Wilson;yes`;

    const form = new FormData();
    form.append('file', testCsv, {
      filename: 'test.csv',
      contentType: 'text/csv'
    });

    const uploadResponse = await fetch('http://localhost:3000/upload/csv', {
      method: 'POST',
      body: form
    });

    expect(uploadResponse.status).toBe(201);

    const intervalsResponse = await fetch('http://localhost:3000/awards/intervals');
    const intervalsData = await intervalsResponse.json() as AwardIntervals;

    const allProducers = new Set([
      ...intervalsData.min.map(i => i.producer),
      ...intervalsData.max.map(i => i.producer)
    ]);

    expect(allProducers).toContain('John Smith');
    expect(allProducers).toContain('Jane Doe');
    expect(allProducers).toContain('Bob Wilson');

    const expectedMinInterval = 5;
    intervalsData.min.forEach(interval => {
      expect(interval.interval).toBe(expectedMinInterval);
    });

    const johnSmithMax = intervalsData.max.find(i => i.producer === 'John Smith');
    expect(johnSmithMax?.interval).toBe(10);
  });

  it('should validate CSV format', async () => {
    const invalidCsv = `title;studios;producers;winner
                        Movie 1;Studio A;John Smith;yes`;

    const form = new FormData();
    form.append('file', invalidCsv, {
      filename: 'test.csv',
      contentType: 'text/csv'
    });

    const response = await fetch('http://localhost:3000/upload/csv', {
      method: 'POST',
      body: form
    });

    expect(response.status).toBe(400);
    const data = await response.json() as ErrorResponse;
    expect(data.error).toBe('Missing required column: year');
  });

  it('should validate required fields', async () => {
    const invalidCsv = 'year;title;studios;producers;winner\n;Movie 1;Studio A;John Smith;yes';

    const form = new FormData();
    form.append('file', invalidCsv, {
      filename: 'test.csv',
      contentType: 'text/csv'
    });

    const response = await fetch('http://localhost:3000/upload/csv', {
      method: 'POST',
      body: form
    });

    expect(response.status).toBe(201);
    const data = await response.json() as UploadResponse;
    expect(data.message).toBe('csv file processed successfully');

    // Verifica os logs
    const invalidRecordsLog = mockLogs.find(log => 
      log.level === 'WARN' && 
      log.message === 'Invalid records found'
    );
    expect(invalidRecordsLog).toBeDefined();
    expect(invalidRecordsLog?.data?.invalidCount).toBe(1);
    expect(invalidRecordsLog?.data?.invalidRecords[0].errors).toContain('Invalid year: ');
  });

  it('should validate future year', async () => {
    const invalidCsv = 'year;title;studios;producers;winner\n3000;Movie 1;Studio A;John Smith;yes';
    
    const form = new FormData();
    form.append('file', invalidCsv, {
      filename: 'test.csv',
      contentType: 'text/csv'
    });

    const response = await fetch('http://localhost:3000/upload/csv', {
      method: 'POST',
      body: form
    });

    expect(response.status).toBe(201);
    const data = await response.json() as UploadResponse;
    expect(data.message).toBe('csv file processed successfully');

    // Verifica os logs
    const invalidRecordsLog = mockLogs.find(log => 
      log.level === 'WARN' && 
      log.message === 'Invalid records found'
    );
    expect(invalidRecordsLog).toBeDefined();
    expect(invalidRecordsLog?.data?.invalidCount).toBe(1);
    expect(invalidRecordsLog?.data?.invalidRecords[0].errors).toContain('Invalid year: 3000');
  });

  it('should handle empty producers field', async () => {
    const invalidCsv = 'year;title;studios;producers;winner\n1980;Movie 1;Studio A;;yes';
    
    const form = new FormData();
    form.append('file', invalidCsv, {
      filename: 'test.csv',
      contentType: 'text/csv'
    });

    const response = await fetch('http://localhost:3000/upload/csv', {
      method: 'POST',
      body: form
    });

    expect(response.status).toBe(201);
    const data = await response.json() as UploadResponse;
    expect(data.message).toBe('csv file processed successfully');

    const invalidRecordsLog = mockLogs.find(log => 
      log.level === 'WARN' && 
      log.message === 'Invalid records found'
    );
    expect(invalidRecordsLog).toBeDefined();
    expect(invalidRecordsLog?.data?.invalidCount).toBe(1);
    expect(invalidRecordsLog?.data?.invalidRecords[0].errors).toContain('Producers cannot be empty');
  });
}); 