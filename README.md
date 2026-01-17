# GastroBI Backend

Este é o backend da API GastroBI+, desenvolvido com NestJS e Prisma. Ele fornece funcionalidades para gerenciamento de restaurantes, pedidos, usuários, relatórios e muito mais.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- Node.js (versão 20 ou superior)
- npm ou yarn
- PostgreSQL (versão 15 ou superior)
- Redis (versão 7 ou superior)
- Docker e Docker Compose (opcional, para rodar com containers)

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd gastrobi-backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o banco de dados:
   - Certifique-se de que PostgreSQL e Redis estão rodando.
   - Crie um banco de dados chamado `gastrobi` (ou ajuste as configurações).

4. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env` (se existir) ou crie um com as seguintes variáveis:
     ```
     DATABASE_URL=postgresql://usuario:senha@localhost:5432/gastrobi
     REDIS_URL=redis://localhost:6379
     JWT_SECRET=seu-jwt-secret
     JWT_REFRESH_SECRET=seu-refresh-secret
     JWT_ACCESS_EXPIRES=15m
     JWT_REFRESH_EXPIRES=7d
     CORS_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:3003
     ```
   - Para gerar segredos seguros para JWT, use os seguintes comandos OpenSSL:
     ```bash
     openssl rand -hex 32  # Para JWT_SECRET
     openssl rand -hex 32  # Para JWT_REFRESH_SECRET
     ```
     Substitua os valores padrão no arquivo `.env` pelos gerados.

5. Execute as migrações do Prisma:
   ```bash
   npm run prisma:migrate:dev
   ```

6. Gere o cliente Prisma:
   ```bash
   npm run prisma:generate
   ```

7. (Opcional) Execute o seed para popular o banco:
   ```bash
   npm run prisma:seed
   ```

## Rodando o Projeto

### Localmente

1. Para desenvolvimento:
   ```bash
   npm run start:dev
   ```

2. Para produção:
   ```bash
   npm run build
   npm run start:prod
   ```

A API estará disponível em `http://localhost:3000`.

### Com Docker

1. Certifique-se de que Docker e Docker Compose estão instalados.

2. Execute:
   ```bash
   docker-compose up --build
   ```

Isso iniciará a API, PostgreSQL e Redis em containers. A API estará disponível em `http://localhost:3000`.

## Scripts Disponíveis

- `npm run build`: Compila o projeto TypeScript.
- `npm run start`: Inicia o servidor em modo produção.
- `npm run start:dev`: Inicia o servidor em modo desenvolvimento com watch.
- `npm run start:debug`: Inicia o servidor em modo debug.
- `npm run lint`: Executa o linter e corrige erros.
- `npm run format`: Formata o código com Prettier.
- `npm run test`: Executa os testes unitários.
- `npm run test:watch`: Executa os testes em modo watch.
- `npm run test:cov`: Executa os testes com cobertura.
- `npm run test:e2e`: Executa os testes end-to-end.
- `npm run prisma:generate`: Gera o cliente Prisma.
- `npm run prisma:migrate:dev`: Executa migrações em desenvolvimento.
- `npm run prisma:migrate:deploy`: Executa migrações em produção.
- `npm run prisma:seed`: Popula o banco com dados iniciais.
- `npm run prisma:studio`: Abre o Prisma Studio para visualizar o banco.

## Estrutura do Projeto

- `src/`: Código fonte da aplicação.
- `prisma/`: Configurações e migrações do Prisma.
- `test/`: Testes da aplicação.
- `dist/`: Código compilado (gerado após build).

## Documentação da API

A documentação da API está disponível via Swagger em `http://localhost:3000/api` quando o servidor estiver rodando.

## Contribuição

1. Faça um fork do projeto.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`).
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`).
4. Push para a branch (`git push origin feature/nova-feature`).
5. Abra um Pull Request.

## Licença

Este projeto é licenciado sob [UNLICENSED].