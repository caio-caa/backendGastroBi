# 📚 GastroBI+ API - Documentação para Administradores

**Base URL:** `http://localhost:3000/api/v1`

**Swagger UI:** `http://localhost:3000/api/docs`

---

## 🔐 Autenticação

Todas as rotas protegidas requerem o header:
```
Authorization: Bearer <access_token>
```

---

## 📋 Índice

1. [Auth (Autenticação)](#1-auth-autenticação)
2. [Users (Usuários)](#2-users-usuários)
3. [Restaurants (Restaurantes)](#3-restaurants-restaurantes)
4. [Analytics (Análises)](#4-analytics-análises)
5. [Billing (Faturamento)](#5-billing-faturamento)
6. [Audit Logs (Logs de Auditoria)](#6-audit-logs-logs-de-auditoria)
7. [White Label](#7-white-label)
8. [Health (Saúde)](#8-health-saúde)

---

## 1. Auth (Autenticação)

### 1.1 Login Admin

**POST** `/auth/login/admin`

Realiza login de usuários administradores.

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "type": "ADMIN",
    "role": "SUPER_ADMIN"
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login/admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

---

### 1.2 Login Restaurant

**POST** `/auth/login/restaurant`

Realiza login de usuários de restaurante.

**Body:**
```json
{
  "email": "owner@restaurant.com",
  "password": "password123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "owner@restaurant.com",
    "fullName": "Restaurant Owner",
    "type": "RESTAURANT",
    "role": "OWNER",
    "currentRestaurant": {
      "id": "uuid",
      "name": "Restaurant Name",
      "slug": "restaurant-name"
    }
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login/restaurant \
  -H "Content-Type: application/json" \
  -d '{"email": "owner@restaurant.com", "password": "password123"}'
```

---

### 1.3 Refresh Token

**POST** `/auth/refresh`

Renova o access token usando o refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta de Sucesso (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token"}'
```

---

### 1.4 Get Current User

**GET** `/auth/me`

🔒 **Requer autenticação**

Retorna informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "fullName": "Admin User",
  "type": "ADMIN",
  "role": "SUPER_ADMIN"
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

---

### 1.5 Logout

**POST** `/auth/logout`

🔒 **Requer autenticação**

Realiza logout do usuário.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Resposta de Sucesso (204):** No content

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>"
```

---

## 2. Users (Usuários)

> 🔒 Todas as rotas requerem autenticação com permissão de **ADMIN**

### 2.1 Listar Usuários

**GET** `/admin/users`

Lista todos os usuários do sistema.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| skip | number | Não | Número de registros a pular (default: 0) |
| take | number | Não | Número de registros a retornar (default: 50) |
| type | string | Não | Filtrar por tipo: `RESTAURANT`, `ADMIN` |

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phone": "+5511999999999",
      "type": "RESTAURANT",
      "role": "OWNER",
      "isActive": true,
      "createdAt": "2026-01-08T00:00:00.000Z"
    }
  ],
  "total": 100,
  "skip": 0,
  "take": 50
}
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?skip=0&take=50&type=RESTAURANT" \
  -H "Authorization: Bearer <access_token>"
```

---

### 2.2 Criar Usuário

**POST** `/admin/users`

Cria um novo usuário.

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "fullName": "New User",
  "phone": "+5511999999999",
  "type": "RESTAURANT",
  "role": "OWNER",
  "restaurantId": "uuid-do-restaurante"
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| email | string | Sim | Email único do usuário |
| password | string | Sim | Senha (mín. 6 caracteres) |
| fullName | string | Sim | Nome completo |
| phone | string | Não | Telefone |
| type | enum | Sim | `RESTAURANT` ou `ADMIN` |
| role | enum | Sim | `SUPER_ADMIN`, `ADMIN`, `OWNER`, `MANAGER`, `STAFF` |
| restaurantId | uuid | Não | ID do restaurante a associar |

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "fullName": "New User",
  "type": "RESTAURANT",
  "role": "OWNER",
  "isActive": true,
  "createdAt": "2026-01-08T00:00:00.000Z"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "fullName": "New User",
    "type": "RESTAURANT",
    "role": "OWNER"
  }'
```

---

### 2.3 Buscar Usuário por ID

**GET** `/admin/users/:id`

Retorna um usuário específico.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do usuário |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "User Name",
  "phone": "+5511999999999",
  "type": "RESTAURANT",
  "role": "OWNER",
  "isActive": true,
  "createdAt": "2026-01-08T00:00:00.000Z",
  "restaurants": [
    {
      "id": "uuid",
      "name": "Restaurant Name",
      "slug": "restaurant-name"
    }
  ]
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/users/uuid-do-usuario \
  -H "Authorization: Bearer <access_token>"
```

---

### 2.4 Atualizar Usuário

**PATCH** `/admin/users/:id`

Atualiza dados de um usuário.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do usuário |

**Body:**
```json
{
  "fullName": "Updated Name",
  "phone": "+5511888888888",
  "role": "MANAGER",
  "isActive": true,
  "password": "newpassword123"
}
```

**Campos (todos opcionais):**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| fullName | string | Nome completo |
| phone | string | Telefone |
| role | enum | `SUPER_ADMIN`, `ADMIN`, `OWNER`, `MANAGER`, `STAFF` |
| isActive | boolean | Status ativo/inativo |
| password | string | Nova senha (mín. 6 caracteres) |

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/users/uuid-do-usuario \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Updated Name", "isActive": true}'
```

---

### 2.5 Deletar Usuário

**DELETE** `/admin/users/:id`

Remove um usuário do sistema.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do usuário |

**Resposta de Sucesso (200):**
```json
{
  "message": "User deleted successfully"
}
```

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/users/uuid-do-usuario \
  -H "Authorization: Bearer <access_token>"
```

---

### 2.6 Banir Usuário

**POST** `/admin/users/:id/ban`

Bane um usuário (desativa a conta).

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do usuário |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "isActive": false,
  "message": "User banned successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/users/uuid-do-usuario/ban \
  -H "Authorization: Bearer <access_token>"
```

---

### 2.7 Desbanir Usuário

**POST** `/admin/users/:id/unban`

Remove o banimento de um usuário.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do usuário |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "isActive": true,
  "message": "User unbanned successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/users/uuid-do-usuario/unban \
  -H "Authorization: Bearer <access_token>"
```

---

### 2.8 Resetar Senha

**POST** `/admin/users/:id/reset-password`

Reseta a senha do usuário para uma senha temporária.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do usuário |

**Resposta de Sucesso (200):**
```json
{
  "message": "Password reset successfully",
  "temporaryPassword": "temp123456"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/users/uuid-do-usuario/reset-password \
  -H "Authorization: Bearer <access_token>"
```

---

## 3. Restaurants (Restaurantes)

> 🔒 Todas as rotas requerem autenticação com permissão de **ADMIN**

### 3.1 Listar Restaurantes

**GET** `/admin/restaurants`

Lista todos os restaurantes.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| skip | number | Não | Número de registros a pular (default: 0) |
| take | number | Não | Número de registros a retornar (default: 50) |
| status | string | Não | Filtrar por status: `ACTIVE`, `TRIAL`, `SUSPENDED`, `CANCELLED` |

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Restaurant Name",
      "slug": "restaurant-name",
      "cnpj": "12.345.678/0001-90",
      "phone": "+5511999999999",
      "email": "contact@restaurant.com",
      "status": "ACTIVE",
      "createdAt": "2026-01-08T00:00:00.000Z"
    }
  ],
  "total": 50,
  "skip": 0,
  "take": 50
}
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/restaurants?skip=0&take=50&status=ACTIVE" \
  -H "Authorization: Bearer <access_token>"
```

---

### 3.2 Criar Restaurante

**POST** `/admin/restaurants`

Cria um novo restaurante.

**Body:**
```json
{
  "name": "Novo Restaurante",
  "slug": "novo-restaurante",
  "cnpj": "12.345.678/0001-90",
  "phone": "+5511999999999",
  "email": "contato@novorestaurante.com",
  "ownerId": "uuid-do-proprietario"
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | Sim | Nome do restaurante |
| slug | string | Sim | Slug único para URL |
| cnpj | string | Não | CNPJ do restaurante |
| phone | string | Não | Telefone |
| email | string | Não | Email de contato |
| ownerId | uuid | Não | ID do proprietário |

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid",
  "name": "Novo Restaurante",
  "slug": "novo-restaurante",
  "status": "TRIAL",
  "createdAt": "2026-01-08T00:00:00.000Z"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/restaurants \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Restaurante",
    "slug": "novo-restaurante",
    "email": "contato@novorestaurante.com"
  }'
```

---

### 3.3 Buscar Restaurante por ID

**GET** `/admin/restaurants/:id`

Retorna um restaurante específico.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do restaurante |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "name": "Restaurant Name",
  "slug": "restaurant-name",
  "cnpj": "12.345.678/0001-90",
  "phone": "+5511999999999",
  "email": "contact@restaurant.com",
  "status": "ACTIVE",
  "createdAt": "2026-01-08T00:00:00.000Z",
  "subscription": {
    "plan": "PREMIUM",
    "status": "ACTIVE"
  },
  "_count": {
    "orders": 150,
    "customers": 80,
    "products": 45
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/restaurants/uuid-do-restaurante \
  -H "Authorization: Bearer <access_token>"
```

---

### 3.4 Atualizar Restaurante

**PATCH** `/admin/restaurants/:id`

Atualiza dados de um restaurante.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do restaurante |

**Body:**
```json
{
  "name": "Nome Atualizado",
  "phone": "+5511888888888",
  "email": "novoemail@restaurant.com"
}
```

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/restaurants/uuid-do-restaurante \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nome Atualizado"}'
```

---

### 3.5 Deletar Restaurante

**DELETE** `/admin/restaurants/:id`

Remove um restaurante do sistema.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do restaurante |

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/restaurants/uuid-do-restaurante \
  -H "Authorization: Bearer <access_token>"
```

---

### 3.6 Suspender Restaurante

**POST** `/admin/restaurants/:id/suspend`

Suspende um restaurante.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do restaurante |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "status": "SUSPENDED",
  "message": "Restaurant suspended successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/restaurants/uuid-do-restaurante/suspend \
  -H "Authorization: Bearer <access_token>"
```

---

### 3.7 Ativar Restaurante

**POST** `/admin/restaurants/:id/activate`

Ativa um restaurante suspenso ou em trial.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID do restaurante |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "status": "ACTIVE",
  "message": "Restaurant activated successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/restaurants/uuid-do-restaurante/activate \
  -H "Authorization: Bearer <access_token>"
```

---

## 4. Analytics (Análises)

> 🔒 Todas as rotas requerem autenticação com permissão de **ADMIN**

### 4.1 Visão Geral da Plataforma

**GET** `/admin/analytics/overview`

Retorna métricas gerais da plataforma.

**Resposta de Sucesso (200):**
```json
{
  "totalRestaurants": 150,
  "activeRestaurants": 120,
  "totalUsers": 450,
  "totalOrders": 15000,
  "totalRevenue": 1500000.00,
  "monthlyRecurringRevenue": 45000.00
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/analytics/overview \
  -H "Authorization: Bearer <access_token>"
```

---

### 4.2 Análise de Receita

**GET** `/admin/analytics/revenue`

Retorna análises de receita por período.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| startDate | string | Sim | Data inicial (ISO 8601) |
| endDate | string | Sim | Data final (ISO 8601) |

**Resposta de Sucesso (200):**
```json
{
  "totalRevenue": 150000.00,
  "revenueByPlan": {
    "BASIC": 30000.00,
    "PREMIUM": 80000.00,
    "ENTERPRISE": 40000.00
  },
  "dailyRevenue": [
    {
      "date": "2026-01-01",
      "revenue": 5000.00
    }
  ]
}
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/analytics/revenue?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer <access_token>"
```

---

### 4.3 Análise de Crescimento

**GET** `/admin/analytics/growth`

Retorna métricas de crescimento.

**Resposta de Sucesso (200):**
```json
{
  "newRestaurantsThisMonth": 15,
  "newUsersThisMonth": 45,
  "growthRate": 12.5,
  "churnRate": 2.3
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/analytics/growth \
  -H "Authorization: Bearer <access_token>"
```

---

### 4.4 Análise de Retenção

**GET** `/admin/analytics/retention`

Retorna métricas de retenção.

**Resposta de Sucesso (200):**
```json
{
  "retentionRate": 85.5,
  "averageLifetime": 18,
  "activeUsers30Days": 380
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/analytics/retention \
  -H "Authorization: Bearer <access_token>"
```

---

## 5. Billing (Faturamento)

> 🔒 Todas as rotas requerem autenticação com permissão de **ADMIN**

### 5.1 Listar Assinaturas

**GET** `/admin/billing/subscriptions`

Lista todas as assinaturas.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| skip | number | Não | Número de registros a pular (default: 0) |
| take | number | Não | Número de registros a retornar (default: 50) |
| status | string | Não | Filtrar por status: `ACTIVE`, `PAST_DUE`, `CANCELLED`, `TRIAL` |
| plan | string | Não | Filtrar por plano: `BASIC`, `PREMIUM`, `ENTERPRISE` |

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "restaurantId": "uuid",
      "restaurantName": "Restaurant Name",
      "plan": "PREMIUM",
      "status": "ACTIVE",
      "startDate": "2026-01-01T00:00:00.000Z",
      "nextBillingDate": "2026-02-01T00:00:00.000Z",
      "amount": 299.00
    }
  ],
  "total": 100,
  "skip": 0,
  "take": 50
}
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/billing/subscriptions?status=ACTIVE&plan=PREMIUM" \
  -H "Authorization: Bearer <access_token>"
```

---

### 5.2 Buscar Assinatura de Restaurante

**GET** `/admin/billing/subscriptions/:restaurantId`

Retorna a assinatura de um restaurante específico.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| restaurantId | uuid | ID do restaurante |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "plan": "PREMIUM",
  "status": "ACTIVE",
  "startDate": "2026-01-01T00:00:00.000Z",
  "nextBillingDate": "2026-02-01T00:00:00.000Z",
  "amount": 299.00,
  "paymentHistory": [
    {
      "id": "uuid",
      "amount": 299.00,
      "status": "PAID",
      "paidAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/billing/subscriptions/uuid-do-restaurante \
  -H "Authorization: Bearer <access_token>"
```

---

### 5.3 Atualizar Plano

**PATCH** `/admin/billing/subscriptions/:restaurantId/plan`

Atualiza o plano de assinatura de um restaurante.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| restaurantId | uuid | ID do restaurante |

**Body:**
```json
{
  "plan": "ENTERPRISE"
}
```

**Valores permitidos para `plan`:**
- `BASIC`
- `PREMIUM`
- `ENTERPRISE`

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "plan": "ENTERPRISE",
  "status": "ACTIVE",
  "message": "Plan updated successfully"
}
```

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/billing/subscriptions/uuid-do-restaurante/plan \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"plan": "ENTERPRISE"}'
```

---

### 5.4 Cancelar Assinatura

**POST** `/admin/billing/subscriptions/:restaurantId/cancel`

Cancela a assinatura de um restaurante.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| restaurantId | uuid | ID do restaurante |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "cancelledAt": "2026-01-08T00:00:00.000Z",
  "message": "Subscription cancelled successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/billing/subscriptions/uuid-do-restaurante/cancel \
  -H "Authorization: Bearer <access_token>"
```

---

### 5.5 Listar Pagamentos

**GET** `/admin/billing/payments`

Lista todos os pagamentos.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| skip | number | Não | Número de registros a pular (default: 0) |
| take | number | Não | Número de registros a retornar (default: 50) |

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "restaurantId": "uuid",
      "restaurantName": "Restaurant Name",
      "amount": 299.00,
      "status": "PAID",
      "paidAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "total": 500,
  "skip": 0,
  "take": 50
}
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/billing/payments?skip=0&take=50" \
  -H "Authorization: Bearer <access_token>"
```

---

## 6. Audit Logs (Logs de Auditoria)

> 🔒 Todas as rotas requerem autenticação com permissão de **ADMIN**

### 6.1 Listar Logs de Auditoria

**GET** `/admin/audit`

Lista todos os logs de auditoria.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| skip | number | Não | Número de registros a pular (default: 0) |
| take | number | Não | Número de registros a retornar (default: 50) |
| userId | string | Não | Filtrar por ID do usuário |
| action | string | Não | Filtrar por ação: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, etc. |
| entity | string | Não | Filtrar por entidade: `User`, `Restaurant`, `Order`, etc. |

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userEmail": "user@example.com",
      "action": "CREATE",
      "entity": "Restaurant",
      "entityId": "uuid",
      "details": {
        "name": "New Restaurant"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-01-08T00:00:00.000Z"
    }
  ],
  "total": 1000,
  "skip": 0,
  "take": 50
}
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/audit?action=CREATE&entity=Restaurant" \
  -H "Authorization: Bearer <access_token>"
```

---

### 6.2 Estatísticas de Auditoria

**GET** `/admin/audit/stats`

Retorna estatísticas dos logs de auditoria.

**Resposta de Sucesso (200):**
```json
{
  "totalLogs": 10000,
  "logsByAction": {
    "CREATE": 3000,
    "UPDATE": 4500,
    "DELETE": 500,
    "LOGIN": 2000
  },
  "logsByEntity": {
    "Order": 5000,
    "Product": 2000,
    "Customer": 1500,
    "User": 1500
  },
  "logsLast24h": 150,
  "logsLast7d": 850
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/audit/stats \
  -H "Authorization: Bearer <access_token>"
```

---

## 7. White Label

> 🔒 Todas as rotas requerem autenticação com permissão de **ADMIN**

### 7.1 Listar Configurações White Label

**GET** `/admin/white-label`

Lista todas as configurações white label.

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "clientName": "Client Company",
      "brandName": "Custom Brand",
      "domain": "custom.gastrobi.com",
      "primaryColor": "#FF5733",
      "secondaryColor": "#333333",
      "isActive": true,
      "createdAt": "2026-01-08T00:00:00.000Z"
    }
  ]
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/white-label \
  -H "Authorization: Bearer <access_token>"
```

---

### 7.2 Criar Configuração White Label

**POST** `/admin/white-label`

Cria uma nova configuração white label.

**Body:**
```json
{
  "clientName": "Client Company",
  "brandName": "Custom Brand",
  "domain": "custom.gastrobi.com",
  "primaryColor": "#FF5733",
  "secondaryColor": "#333333"
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| clientName | string | Sim | Nome do cliente |
| brandName | string | Sim | Nome da marca |
| domain | string | Sim | Domínio personalizado |
| primaryColor | string | Não | Cor primária (hex) |
| secondaryColor | string | Não | Cor secundária (hex) |

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid",
  "clientName": "Client Company",
  "brandName": "Custom Brand",
  "domain": "custom.gastrobi.com",
  "isActive": true,
  "createdAt": "2026-01-08T00:00:00.000Z"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/white-label \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Client Company",
    "brandName": "Custom Brand",
    "domain": "custom.gastrobi.com",
    "primaryColor": "#FF5733"
  }'
```

---

### 7.3 Buscar Configuração White Label

**GET** `/admin/white-label/:id`

Retorna uma configuração white label específica.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID da configuração |

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/white-label/uuid-da-config \
  -H "Authorization: Bearer <access_token>"
```

---

### 7.4 Atualizar Configuração White Label

**PATCH** `/admin/white-label/:id`

Atualiza uma configuração white label.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID da configuração |

**Body:**
```json
{
  "brandName": "Updated Brand",
  "primaryColor": "#00FF00",
  "customCSS": ".header { background: #000; }"
}
```

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/white-label/uuid-da-config \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"brandName": "Updated Brand"}'
```

---

### 7.5 Deletar Configuração White Label

**DELETE** `/admin/white-label/:id`

Remove uma configuração white label.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | uuid | ID da configuração |

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/white-label/uuid-da-config \
  -H "Authorization: Bearer <access_token>"
```

---

## 8. Health (Saúde)

> 🔓 Rotas públicas (não requerem autenticação)

### 8.1 Health Check Básico

**GET** `/health`

Verifica se a API está funcionando.

**Resposta de Sucesso (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T17:00:00.000Z",
  "version": "1.0.0"
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/health
```

---

### 8.2 Readiness Check

**GET** `/health/ready`

Verifica se todas as dependências (banco de dados, Redis) estão funcionando.

**Resposta de Sucesso (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T17:00:00.000Z",
  "checks": {
    "database": true,
    "redis": true
  }
}
```

**Resposta de Erro (503):**
```json
{
  "status": "error",
  "timestamp": "2026-01-08T17:00:00.000Z",
  "checks": {
    "database": true,
    "redis": false
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/health/ready
```

---

## 📊 Enums de Referência

### UserType
```
RESTAURANT - Usuário de restaurante
ADMIN      - Usuário administrador
```

### UserRole
```
SUPER_ADMIN - Super administrador
ADMIN       - Administrador
OWNER       - Proprietário
MANAGER     - Gerente
STAFF       - Funcionário
```

### RestaurantStatus
```
ACTIVE    - Ativo
TRIAL     - Em período de teste
SUSPENDED - Suspenso
CANCELLED - Cancelado
```

### SubscriptionPlan
```
BASIC      - Plano básico
PREMIUM    - Plano premium
ENTERPRISE - Plano enterprise
```

### SubscriptionStatus
```
ACTIVE    - Assinatura ativa
PAST_DUE  - Pagamento atrasado
CANCELLED - Assinatura cancelada
TRIAL     - Período de teste
```

### AuditAction
```
CREATE - Criação
UPDATE - Atualização
DELETE - Exclusão
LOGIN  - Login
LOGOUT - Logout
```

---

## ⚠️ Códigos de Erro Comuns

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou expirado |
| 403 | Forbidden - Sem permissão para acessar |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: email duplicado) |
| 422 | Unprocessable Entity - Validação falhou |
| 500 | Internal Server Error - Erro interno |

---

## 🔧 Exemplos de Integração

### JavaScript/Fetch

```javascript
const API_BASE = 'http://localhost:3000/api/v1';
let accessToken = '';

// Login
async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  accessToken = data.accessToken;
  return data;
}

// Request autenticada
async function getUsers() {
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  return response.json();
}
```

### Python/Requests

```python
import requests

API_BASE = 'http://localhost:3000/api/v1'

# Login
def login(email, password):
    response = requests.post(f'{API_BASE}/auth/login/admin', json={
        'email': email,
        'password': password
    })
    return response.json()

# Request autenticada
def get_users(access_token):
    response = requests.get(f'{API_BASE}/admin/users', headers={
        'Authorization': f'Bearer {access_token}'
    })
    return response.json()
```

---

**Documentação gerada em:** 08/01/2026

**Versão da API:** 1.0.0
