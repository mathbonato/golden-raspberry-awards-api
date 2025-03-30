import { AwardIntervals, ProducerInterval } from '../types.js';

export class AwardService {
  calculateIntervals(winners: { year: number; producers: string }[]): AwardIntervals {
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
  }
} 