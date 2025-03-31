import { Movie } from '../../domain/entities/movie.ts';
import { AwardIntervals, ProducerInterval } from '../../../shared/types/index.ts';
import { Logger } from '../../../utils/logger.ts';

export class CalculateIntervalsUseCase {
  private readonly logger = Logger.getInstance();

  private extractProducerNames(producers: string): string[] {
    this.logger.debug('Extracting producer names', { data: { producers } });
    const names = producers
      .split(/,\s*and\s*|\s*and\s*|,\s*/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    this.logger.debug('Producer names extracted', { data: { names } });
    return names;
  }

  private groupWinnersByProducer(winners: Movie[]): Map<string, number[]> {
    this.logger.info('Grouping winners by producer', { data: { winnerCount: winners.length } });
    const winnersByProducer = new Map<string, number[]>();

    winners.forEach((movie) => {
      const producerNames = this.extractProducerNames(movie.producers);
      producerNames.forEach(producer => {
        if (!winnersByProducer.has(producer)) {
          winnersByProducer.set(producer, []);
        }
        winnersByProducer.get(producer)?.push(movie.year);
      });
    });

    this.logger.info('Winners grouped by producer', { 
      data: {
        producerCount: winnersByProducer.size,
        producers: Array.from(winnersByProducer.keys())
      }
    });
    return winnersByProducer;
  }

  private calculateIntervalsForProducer(years: number[]): { min: number; max: number; minIndex: number; maxIndex: number } {
    this.logger.debug('Calculating intervals for producer', { data: { years } });
    const sortedYears = [...years].sort((a, b) => a - b);
    const intervals: number[] = [];

    for (let i = 1; i < sortedYears.length; i++) {
      intervals.push(sortedYears[i] - sortedYears[i - 1]);
    }

    const minInterval = Math.min(...intervals);
    const maxInterval = Math.max(...intervals);

    this.logger.debug('Intervals calculated', { 
      data: {
        minInterval, 
        maxInterval, 
        minIndex: intervals.indexOf(minInterval),
        maxIndex: intervals.indexOf(maxInterval)
      }
    });

    return {
      min: minInterval,
      max: maxInterval,
      minIndex: intervals.indexOf(minInterval),
      maxIndex: intervals.indexOf(maxInterval)
    };
  }

  private createProducerInterval(
    producer: string,
    interval: number,
    previousWin: number,
    followingWin: number
  ): ProducerInterval {
    return {
      producer,
      interval,
      previousWin,
      followingWin
    };
  }

  private findWinningYears(years: number[], index: number): { previous: number; following: number } {
    const result = {
      previous: years[index],
      following: years[index + 1]
    };
    this.logger.debug('Winning years found', { data: { result } });
    return result;
  }

  private findProducersWithMinInterval(winnersByProducer: Map<string, number[]>): ProducerInterval[] {
    this.logger.info('Finding producers with minimum interval');
    const producersWithIntervals: ProducerInterval[] = [];

    winnersByProducer.forEach((years, producer) => {
      if (years.length < 2) {
        this.logger.debug('Producer ignored - less than 2 wins', { data: { producer, years } });
        return; 
      }

      const { min: minInterval, minIndex } = this.calculateIntervalsForProducer(years);
      const sortedYears = [...years].sort((a, b) => a - b);
      const minYears = this.findWinningYears(sortedYears, minIndex);

      producersWithIntervals.push(
        this.createProducerInterval(
          producer,
          minInterval,
          minYears.previous,
          minYears.following
        )
      );
    });

    producersWithIntervals.sort((a, b) => a.interval - b.interval);
    const minInterval = producersWithIntervals[0]?.interval;

    const result = producersWithIntervals.filter(item => item.interval === minInterval);
    this.logger.info('Producers with minimum interval found', { 
      data: { 
        minInterval,
        producers: result.map(p => p.producer)
      }
    });
    return result;
  }

  private findProducersWithMaxInterval(winnersByProducer: Map<string, number[]>): ProducerInterval[] {
    this.logger.info('Finding producers with maximum interval');
    const producersWithIntervals: ProducerInterval[] = [];

    winnersByProducer.forEach((years, producer) => {
      if (years.length < 2) {
        this.logger.debug('Producer ignored - less than 2 wins', { data: { producer, years } });
        return;
      }

      const { max: maxInterval, maxIndex } = this.calculateIntervalsForProducer(years);
      const sortedYears = [...years].sort((a, b) => a - b);
      const maxYears = this.findWinningYears(sortedYears, maxIndex);

      producersWithIntervals.push(
        this.createProducerInterval(
          producer,
          maxInterval,
          maxYears.previous,
          maxYears.following
        )
      );
    });

    producersWithIntervals.sort((a, b) => b.interval - a.interval);
    const maxInterval = producersWithIntervals[0]?.interval;

    const result = producersWithIntervals.filter(item => item.interval === maxInterval);
    this.logger.info('Producers with maximum interval found', { 
      data: {
        maxInterval,
        producers: result.map(p => p.producer)
      }
    });
    return result;
  }

  execute(winners: Movie[]): AwardIntervals {
    this.logger.info('Starting intervals calculation', { data: { winnerCount: winners.length } });
    const winnersByProducer = this.groupWinnersByProducer(winners);

    const result = {
      min: this.findProducersWithMinInterval(winnersByProducer),
      max: this.findProducersWithMaxInterval(winnersByProducer)
    };

    this.logger.info('Intervals calculation completed', {
      data: {
        minIntervalCount: result.min.length,
        maxIntervalCount: result.max.length,
        minInterval: result.min[0]?.interval,
        maxInterval: result.max[0]?.interval
      }
    });

    return result;
  }
} 