# API Golden Raspberry Awards

API RESTful para consulta de indicados e vencedores da categoria Pior Filme do Golden Raspberry Awards.

## Requisitos

- Node.js 18 ou superior
- npm ou yarn

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Gere o cliente Prisma:
```bash
npm run prisma:generate
```

4. Execute as migrações do banco de dados:
```bash
npm run prisma:migrate
```

## Executando a aplicação

Para iniciar o servidor em modo desenvolvimento:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

## Executando os testes

Para executar os testes de integração:
```bash
npm test
```

## Endpoints

### GET /awards/intervals

Retorna os produtores com maior e menor intervalo entre prêmios consecutivos.

Exemplo de resposta:
```json
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