import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { readFile } from 'fs/promises';
import { createServer } from './server.ts';
import { AwardIntervals } from '../../shared/types/index.ts';

interface UploadResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
}

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Awards API', () => {
  let app: any;

  beforeAll(async () => {
    app = await createServer();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should handle CSV upload and return correct award intervals', async () => {
    const csvPath = join(__dirname, '..', '..', '..', 'Movielist.csv');
    const fileContent = await readFile(csvPath, 'utf-8');

    const form = new FormData();
    form.append('file', fileContent, {
      filename: 'test.csv',
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

    expect(intervalsData).toHaveProperty('min');
    expect(intervalsData).toHaveProperty('max');
    expect(Array.isArray(intervalsData.min)).toBe(true);
    expect(Array.isArray(intervalsData.max)).toBe(true);

    intervalsData.min.forEach((interval) => {
      expect(interval).toHaveProperty('producer');
      expect(interval).toHaveProperty('interval');
      expect(interval).toHaveProperty('previousWin');
      expect(interval).toHaveProperty('followingWin');
    });

    intervalsData.max.forEach((interval) => {
      expect(interval).toHaveProperty('producer');
      expect(interval).toHaveProperty('interval');
      expect(interval).toHaveProperty('previousWin');
      expect(interval).toHaveProperty('followingWin');
    });
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

  it('should handle producers with multiple wins in different formats', async () => {
    const testCsv = `year;title;studios;producers;winner
                    1980;Movie 1;Studio A;John Smith, Jane Doe;yes
                    1985;Movie 2;Studio B;John Smith and Jane Doe;yes
                    1990;Movie 3;Studio C;John Smith, Jane Doe and Bob Wilson;yes`;

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
    const invalidCsv = `year;title;studios;producers;winner
                        ;Movie 1;Studio A;John Smith;yes`;

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
    expect(data.error.trim()).toBe('Invalid year:');
  });
}); 