# Secret Santa API

Uma API para gerenciar sorteios de amigo secreto, construída com Elysia, Bun, PostgreSQL e Better Auth.

## Funcionalidades

- ✨ **Gerenciamento de Sessões**: Criação, fechamento e bloqueio de sessões de amigo secreto
- 👥 **Gerenciamento de Participantes**: Adicionar múltiplos participantes por sessão
- 🎲 **Sorteio Automático**: Algoritmo para sortear os pares giver/receiver
- 📧 **Notificações por Email**: Envio automático de emails com os resultados do sorteio
- 🔐 **Autenticação**: Sistema de autenticação com Better Auth
- 🐳 **Docker**: Configuração completa com Docker Compose
- 📊 **Banco de Dados**: PostgreSQL com Drizzle ORM

## Tecnologias

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Elysia](https://elysiajs.com)
- **Banco de Dados**: PostgreSQL
- **ORM**: Drizzle
- **Autenticação**: Better Auth
- **Email**: Nodemailer
- **Containerização**: Docker & Docker Compose

## Estrutura do Projeto

```
src/
├── auth.ts                    # Configuração do Better Auth
├── env.ts                     # Validação de variáveis de ambiente
├── index.ts                   # Servidor principal e rotas
├── database/
│   ├── client.ts             # Cliente do banco de dados
│   ├── migrations/           # Migrações do banco
│   └── schema/              # Schemas das tabelas
│       ├── sessions.ts      # Schema de sessões
│       ├── participants.ts  # Schema de participantes
│       └── assignments.ts   # Schema de sorteios
├── modules/
│   ├── session/             # Lógica de sessões
│   ├── participants/        # Lógica de participantes
│   └── email/              # Serviço de email
└── http/
    └── plugins/            # Plugins HTTP
```

## Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <repository-url>
cd secret_santa
```

### 2. Instale as dependências

```bash
bun install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET=your_secret_here_minimum_32_characters
BETTER_AUTH_URL=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://username:password@127.0.0.1:5432/database_name"

# Docker PostgreSQL Configuration
POSTGRES_DB=secret_santa
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
```

### 4. Inicie o banco de dados

```bash
bun run docker:up
```

### 5. Execute as migrações

```bash
bun run db:migrate
```

### 6. Inicie o servidor de desenvolvimento

```bash
bun run dev
```

O servidor estará disponível em http://localhost:3000

## Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev          # Inicia servidor em modo desenvolvimento (hot reload)
bun run start        # Inicia servidor em modo produção

# Docker
bun run docker:up    # Sobe o container PostgreSQL
bun run docker:down  # Para o container PostgreSQL

# Banco de Dados
bun run db:generate  # Gera novas migrações
bun run db:migrate   # Executa migrações pendentes
```

## API Endpoints

### 1. Criar Sessão

Cria uma nova sessão de amigo secreto.

**POST** `/session`

```bash
curl -X POST http://localhost:3000/session \
  -H "Content-Type: application/json" \
  -d '{
    "creatorEmail": "creator@example.com",
    "sessionName": "Amigo Secreto 2024"
  }'
```

**Resposta:**

```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "secretToken": "987fcdeb-51a2-43d1-9f12-345678901234",
  "status": "open",
  "createdAt": "2024-10-06T10:30:00.000Z"
}
```

### 2. Adicionar Participantes

Adiciona participantes a uma sessão existente.

**POST** `/sessions/:sessionId/participants`

```bash
curl -X POST http://localhost:3000/sessions/123e4567-e89b-12d3-a456-426614174000/participants \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {
        "email": "joao@example.com",
        "name": "João Silva"
      },
      {
        "email": "maria@example.com",
        "name": "Maria Santos"
      },
      {
        "email": "pedro@example.com",
        "name": "Pedro Oliveira"
      }
    ]
  }'
```

**Resposta:**

```json
{
  "added": 3,
  "totalParticipants": 4,
  "duplicatesIgnored": []
}
```

### 3. Bloquear Sessão e Realizar Sorteio

Bloqueia a sessão e executa o sorteio, enviando emails para os participantes.

**POST** `/sessions/:sessionId/lock`

```bash
curl -X POST http://localhost:3000/sessions/123e4567-e89b-12d3-a456-426614174000/lock \
  -H "Content-Type: application/json"
```

**Resposta:**

```json
{
  "status": "locked",
  "participantCount": 4,
  "emailsSent": 4,
  "lockedAt": "2024-10-06T11:00:00.000Z"
}
```

### 4. Fechar Sessão

Fecha uma sessão, impedindo a adição de novos participantes.

**POST** `/sessions/:sessionId/close`

```bash
curl -X POST http://localhost:3000/sessions/123e4567-e89b-12d3-a456-426614174000/close \
  -H "Content-Type: application/json"
```

**Resposta:**

```json
{
  "status": "closed",
  "closedAt": "2024-10-06T11:30:00.000Z"
}
```

## Status da Sessão

As sessões possuem três estados possíveis:

- **`open`**: Sessão aberta, participantes podem ser adicionados
- **`closed`**: Sessão fechada, não aceita novos participantes mas ainda não foi sorteada
- **`locked`**: Sessão sorteada e finalizada, emails enviados

## Modelo de Dados

### Sessions

```typescript
{
  id: string (UUID)
  name?: string
  creatorEmail: string
  secretToken: string
  status: 'open' | 'closed' | 'locked'
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
}
```

### Participants

```typescript
{
  id: string (UUID)
  sessionId: string (UUID)
  email: string
  name?: string
  isCreator: boolean
  createdAt: Date
}
```

### Assignments

```typescript
{
  id: string(UUID);
  sessionId: string(UUID);
  giverId: string(UUID);
  receiverId: string(UUID);
  createdAt: Date;
}
```

## Fluxo Completo de Uso

### 1. Exemplo Completo via cURL

```bash
# 1. Criar uma sessão
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/session \
  -H "Content-Type: application/json" \
  -d '{"creatorEmail": "organizer@example.com", "sessionName": "Natal 2024"}')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId')
echo "Session ID: $SESSION_ID"

# 2. Adicionar participantes
curl -X POST http://localhost:3000/sessions/$SESSION_ID/participants \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {"email": "alice@example.com", "name": "Alice"},
      {"email": "bob@example.com", "name": "Bob"},
      {"email": "charlie@example.com", "name": "Charlie"},
      {"email": "diana@example.com", "name": "Diana"}
    ]
  }'

# 3. Realizar o sorteio
curl -X POST http://localhost:3000/sessions/$SESSION_ID/lock

# 4. (Opcional) Fechar a sessão posteriormente
curl -X POST http://localhost:3000/sessions/$SESSION_ID/close
```

## Desenvolvimento

### Estrutura de Desenvolvimento

```bash
# Instalar dependências
bun install

# Configurar banco de dados
bun run docker:up
bun run db:migrate

# Desenvolver
bun run dev
```

### Gerar Nova Migração

```bash
# Após alterar os schemas
bun run db:generate
bun run db:migrate
```

## Docker

O projeto inclui configuração Docker para desenvolvimento:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
