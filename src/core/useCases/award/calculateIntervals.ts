import { Movie } from '../../domain/entities/movie.ts';
import { AwardIntervals, ProducerInterval } from '../../../shared/types/index.ts';

export class CalculateIntervalsUseCase {
  private extractProducerNames(producers: string): string[] {
    return producers
      .split(/,\s*and\s*|\s*and\s*|,\s*/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }

  private groupWinnersByProducer(winners: Movie[]): Map<string, number[]> {
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

    return winnersByProducer;
  }

  private calculateIntervalsForProducer(years: number[]): { min: number; max: number; minIndex: number; maxIndex: number } {
    const sortedYears = [...years].sort((a, b) => a - b);
    const intervals: number[] = [];

    for (let i = 1; i < sortedYears.length; i++) {
      intervals.push(sortedYears[i] - sortedYears[i - 1]);
    }

    const minInterval = Math.min(...intervals);
    const maxInterval = Math.max(...intervals);

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
    return {
      previous: years[index],
      following: years[index + 1]
    };
  }

  private findProducersWithMinInterval(winnersByProducer: Map<string, number[]>): ProducerInterval[] {
    const producersWithIntervals: ProducerInterval[] = [];

    winnersByProducer.forEach((years, producer) => {
      if (years.length < 2) return;

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

    return producersWithIntervals.filter(item => item.interval === minInterval);
  }

  private findProducersWithMaxInterval(winnersByProducer: Map<string, number[]>): ProducerInterval[] {
    const producersWithIntervals: ProducerInterval[] = [];

    winnersByProducer.forEach((years, producer) => {
      if (years.length < 2) return;

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

    return producersWithIntervals.filter(item => item.interval === maxInterval);
  }

  execute(winners: Movie[]): AwardIntervals {
    const winnersByProducer = this.groupWinnersByProducer(winners);

    return {
      min: this.findProducersWithMinInterval(winnersByProducer),
      max: this.findProducersWithMaxInterval(winnersByProducer)
    };
  }
} 