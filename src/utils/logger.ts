import { writeFile, appendFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  WARN = 'WARN'
}

export class Logger {
  private static instance: Logger;
  private logFile: string;

  private constructor() {
    this.logFile = join(__dirname, '..', '..', 'logs', 'app.log');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async ensureLogFile(): Promise<void> {
    try {
      // Verifica se o arquivo existe
      await access(this.logFile);
    } catch {
      // Se o arquivo não existe, cria um novo
      await writeFile(this.logFile, '');
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataString = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${dataString}\n`;
  }

  async log(level: LogLevel, message: string, data?: any): Promise<void> {
    await this.ensureLogFile();
    const formattedMessage = this.formatMessage(level, message, data);
    await appendFile(this.logFile, formattedMessage);
  }

  async info(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.INFO, message, data);
  }

  async error(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.ERROR, message, data);
  }

  async debug(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.DEBUG, message, data);
  }

  async warn(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.WARN, message, data);
  }
} 