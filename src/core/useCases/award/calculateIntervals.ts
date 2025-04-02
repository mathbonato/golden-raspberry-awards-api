import { Movie } from '../../domain/entities/movie.ts';
import { AwardIntervals, ProducerInterval } from '../../../shared/types/index.ts';
import { Logger } from '../../../utils/logger.ts';

export class CalculateIntervalsUseCase {
  private readonly logger = Logger.getInstance();

  private extractProducerNames(producers: string): string[] {
    const names = producers
      .split(/,\s*and\s*|\s*and\s*|,\s*/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    return names;
  }

  private groupWinnersByProducer(winners: Movie[]): Map<string, number[]> {
    const map = new Map<string, number[]>();

    for (const movie of winners) {
      const producerNames = this.extractProducerNames(movie.producers);
      for (const producer of producerNames) {
        const years = map.get(producer) ?? [];
        years.push(movie.year);
        map.set(producer, years);
      }
    }

    for (const [producer, years] of map.entries()) {
      map.set(producer, years.sort((a, b) => a - b));
    }

    this.logger.debug('Winners grouped by producer (sorted)', {
      data: Object.fromEntries(map.entries())
    });

    return map;
  }

  private createProducerInterval(
    producer: string,
    interval: number,
    previousWin: number,
    followingWin: number
  ): ProducerInterval {
    return { producer, interval, previousWin, followingWin };
  }

  private calculateIntervals(winnersByProducer: Map<string, number[]>): AwardIntervals {
    let globalMinInterval = Infinity;
    let globalMaxInterval = -Infinity;
    const minProducers: ProducerInterval[] = [];
    const maxProducers: ProducerInterval[] = [];

    for (const [producer, years] of winnersByProducer.entries()) {
      if (years.length < 2) continue;

      this.logger.debug('Processing producer intervals', {
        data: { producer, years }
      });

      for (let i = 1; i < years.length; i++) {
        const currentInterval = years[i] - years[i - 1];
        const intervalData = this.createProducerInterval(
          producer,
          currentInterval,
          years[i - 1],
          years[i]
        );

        if (currentInterval <= globalMinInterval) {
          if (currentInterval < globalMinInterval) {
            globalMinInterval = currentInterval;
            minProducers.length = 0;
          }
          minProducers.push(intervalData);
        }

        if (currentInterval >= globalMaxInterval) {
          if (currentInterval > globalMaxInterval) {
            globalMaxInterval = currentInterval;
            maxProducers.length = 0;
          }
          maxProducers.push(intervalData);
        }
      }
    }

    return { min: minProducers, max: maxProducers };
  }

  execute(winners: Movie[]): AwardIntervals {
    this.logger.info('Calculating intervals', {
      data: { totalWinners: winners.length }
    });

    const winnersByProducer = this.groupWinnersByProducer(winners);
    const result = this.calculateIntervals(winnersByProducer);

    this.logger.info('Finished calculating intervals', {
      data: {
        minInterval: result.min[0]?.interval,
        maxInterval: result.max[0]?.interval,
        producersMin: result.min.map(p => p.producer),
        producersMax: result.max.map(p => p.producer)
      }
    });

    return result;
  }
}
