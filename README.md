# Golden Raspberry Awards API

API RESTful para processar e analisar dados do Golden Raspberry Awards.

## Pré-requisitos

- Node.js
- Yarn

## Configuração

1. Clone o repositório
2. Instale as dependências:
```bash
yarn install
```

3. Execute as migrações do Prisma:
```bash
yarn prisma migrate dev
```

4. Gere o cliente Prisma:
```bash
yarn prisma generate
```

## Executando o projeto

Para desenvolvimento:
```bash
yarn dev
```

Para produção:
```bash
yarn build
yarn start
```

Para testes:
```bash
yarn test
```

## Endpoints

- `GET /awards/intervals`: Retorna os produtores com maior e menor intervalo entre prêmios

## Features

- Carregamento automático do arquivo CSV da raiz do projeto
- Cálculo de intervalos de prêmios por produtor
- Validação de dados e tratamento de erros
- Banco de dados em memória usando H2
- Cobertura de testes de integração

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
- Missing CSV file
- Invalid file format
- Missing required columns
- Invalid year values
- Empty producer fields
- Future years

All errors are logged in the `logs/app.log` file.

## Technical Details

- Built with Node.js and TypeScript
- Uses H2 as an in-memory database
- Implements Richardson Maturity Model Level 2
- Includes comprehensive integration tests
- Logs all operations and errors
