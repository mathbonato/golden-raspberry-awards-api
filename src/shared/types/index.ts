export interface MovieData {
  id: number;
  year: number;
  title: string;
  studios: string;
  producers: string;
  winner: boolean;
}

export interface ProducerInterval {
  producer: string;
  interval: number;
  previousWin: number;
  followingWin: number;
}

export interface AwardIntervals {
  min: ProducerInterval[];
  max: ProducerInterval[];
}

export interface MovieRecord {
  year: string;
  title: string;
  studios: string;
  producers: string;
  winner: string;
} 