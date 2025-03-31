# Golden Raspberry Awards API

A RESTful API for reading and analyzing the list of nominees and winners of the Golden Raspberry Awards for Worst Picture category.

## Features

- CSV file upload and processing
- Calculation of producer award intervals
- Data validation and error handling
- In-memory database using SQLite
- Integration tests coverage

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gra-api.git
cd gra-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `logs` directory in the project root:
```bash
mkdir logs
```

## Running the Application

1. Start the server:
```bash
npm run dev
```

The server will start on port 3000.

## Running Tests

```bash
npm test
```

## API Endpoints

### 1. Upload CSV File
```
POST /upload/csv

Content-Type: multipart/form-data

Request Body:
- file: CSV file with the following columns:
  - year: Movie release year
  - title: Movie title
  - studios: Production studios
  - producers: Movie producers
  - winner: Award winner (yes/"")

Response:
{
  "message": "csv file processed successfully"
}
```

### 2. Get Award Intervals
```
GET /awards/intervals

Response:
{
  "min": [
    {
      "producer": "Producer 1",
      "interval": 1,
      "previousWin": 2008,
      "followingWin": 2009
    }
  ],
  "max": [
    {
      "producer": "Producer 2",
      "interval": 99,
      "previousWin": 1900,
      "followingWin": 1999
    }
  ]
}
```

## CSV File Format

The CSV file should be semicolon-separated with the following columns:
- year: Movie release year (required)
- title: Movie title (required)
- studios: Production studios (required)
- producers: Movie producers (required)
- winner: Award winner (yes/"")

Example:
```csv
year;title;studios;producers;winner
1980;Can't Stop the Music;Associated Film Distribution;Allan Carr;yes
1980;Cruising;Lorimar Productions, United Artists;Jerry Weintraub;
```

## Sample Data

A sample CSV file with the complete list of nominees and winners is available in the `Movielist.csv` file in the project root.

## Error Handling

The API handles various error cases:
- Invalid file types
- Missing required columns
- Invalid year values
- Empty producer fields
- Future years

All errors are logged in the `logs/app.log` file.

## Technical Details

- Built with Node.js and TypeScript
- Uses SQLite as an in-memory database
- Implements Richardson Maturity Model Level 2
- Includes comprehensive integration tests
- Logs all operations and errors
