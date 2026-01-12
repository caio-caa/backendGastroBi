# 🍽️ GastroBI+ API - Usuário Restaurante

**Base URL:** `http://localhost:3000/api/v1`

> 🔒 Todas as rotas requerem autenticação e header `x-restaurant-id`

**Headers obrigatórios:**
```
Authorization: Bearer <access_token>
x-restaurant-id: <uuid-do-restaurante>
```

---

## 📋 Índice

1. [Autenticação](#1-autenticação)
2. [Categorias](#2-categorias)
3. [Produtos](#3-produtos)
4. [Pedidos](#4-pedidos)
5. [Mesas](#5-mesas)
6. [Clientes](#6-clientes)
7. [Fidelidade](#7-fidelidade)
8. [Campanhas](#8-campanhas)
9. [Uploads](#9-uploads)

---

## 1. Autenticação

### 1.1 Login

**POST** `/auth/login/restaurant`

**Body:**
```json
{
  "email": "owner@restaurant.com",
  "password": "password123"
}
```

**Resposta (200):**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "owner@restaurant.com",
    "fullName": "Owner Name",
    "type": "RESTAURANT",
    "role": "OWNER",
    "currentRestaurant": {
      "id": "uuid",
      "name": "Meu Restaurante",
      "slug": "meu-restaurante"
    },
    "restaurants": [
      { "id": "uuid", "name": "Meu Restaurante", "slug": "meu-restaurante" }
    ]
  }
}
```

### 1.2 Refresh Token

**POST** `/auth/refresh`

**Body:**
```json
{ "refreshToken": "eyJhbG..." }
```

### 1.3 Meus Dados

**GET** `/auth/me`

### 1.4 Logout

**POST** `/auth/logout`

---

## 2. Categorias

### 2.1 Listar Categorias

**GET** `/categories`

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "name": "Pizzas",
    "description": "Nossas pizzas artesanais",
    "image": "https://...",
    "isActive": true,
    "order": 1,
    "_count": { "products": 15 }
  }
]
```

### 2.2 Criar Categoria

**POST** `/categories`

**Body:**
```json
{
  "name": "Bebidas",
  "description": "Refrigerantes, sucos e cervejas",
  "image": "https://example.com/bebidas.jpg"
}
```

### 2.3 Buscar Categoria

**GET** `/categories/:id`

### 2.4 Atualizar Categoria

**PATCH** `/categories/:id`

**Body:**
```json
{
  "name": "Bebidas Geladas",
  "description": "Nova descrição",
  "isActive": true
}
```

### 2.5 Deletar Categoria

**DELETE** `/categories/:id`

### 2.6 Reordenar Categorias

**PATCH** `/categories/reorder`

**Body:**
```json
{
  "categoryIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

---

## 3. Produtos

### 3.1 Listar Produtos

**GET** `/products`

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| categoryId | uuid | Filtrar por categoria |
| isActive | boolean | Filtrar por status |

### 3.2 Criar Produto

**POST** `/products`

**Body:**
```json
{
  "name": "Pizza Margherita",
  "description": "Molho de tomate, mozzarella e manjericão",
  "price": 45.90,
  "cost": 15.00,
  "categoryId": "uuid-da-categoria",
  "image": "https://example.com/pizza.jpg",
  "preparationTime": 25,
  "allergens": ["gluten", "lactose"],
  "tags": ["popular", "vegetariano"],
  "variations": [
    { "name": "Pequena", "price": 35.90 },
    { "name": "Média", "price": 45.90 },
    { "name": "Grande", "price": 55.90 }
  ],
  "extras": [
    { "name": "Borda recheada", "price": 8.00 },
    { "name": "Queijo extra", "price": 5.00 }
  ]
}
```

### 3.3 Buscar Produto

**GET** `/products/:id`

### 3.4 Atualizar Produto

**PATCH** `/products/:id`

**Body:**
```json
{
  "name": "Pizza Margherita Premium",
  "price": 49.90,
  "isActive": true,
  "isAvailable": true
}
```

### 3.5 Deletar Produto

**DELETE** `/products/:id`

### 3.6 Alternar Disponibilidade

**PATCH** `/products/:id/toggle`

### 3.7 Reordenar Produtos

**PATCH** `/products/reorder`

**Body:**
```json
{
  "categoryId": "uuid-da-categoria",
  "productIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

---

## 4. Pedidos

### 4.1 Listar Pedidos

**GET** `/orders`

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| skip | number | Paginação (default: 0) |
| take | number | Limite (default: 50) |
| type | enum | `DINE_IN`, `TAKEOUT`, `DELIVERY` |
| status | enum | Ver enums abaixo |

### 4.2 Criar Pedido

**POST** `/orders`

**Headers opcionais:**
```
x-idempotency-key: unique-key-123
```

**Body:**
```json
{
  "type": "DINE_IN",
  "customerId": "uuid-do-cliente",
  "tableId": "uuid-da-mesa",
  "items": [
    {
      "productId": "uuid-do-produto",
      "quantity": 2,
      "observations": "Sem cebola"
    }
  ],
  "notes": "Cliente VIP"
}
```

**Resposta (201):**
```json
{
  "id": "uuid",
  "orderNumber": "ORD-2026-001234",
  "type": "DINE_IN",
  "status": "PENDING",
  "items": [...],
  "subtotal": 91.80,
  "total": 91.80,
  "createdAt": "2026-01-08T17:00:00.000Z"
}
```

### 4.3 Buscar Pedido

**GET** `/orders/:id`

### 4.4 Atualizar Status do Pedido

**PATCH** `/orders/:id/status`

**Body:**
```json
{ "status": "PREPARING" }
```

**Status disponíveis:**
- `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `DELIVERED` → `COMPLETED`
- `CANCELLED` (a qualquer momento)

### 4.5 Cancelar Pedido

**POST** `/orders/:id/cancel`

### 4.6 Pedidos da Cozinha

**GET** `/orders/kitchen`

Retorna pedidos pendentes e em preparação.

### 4.7 Relatórios de Pedidos

**GET** `/orders/reports`

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| startDate | ISO date | Sim |
| endDate | ISO date | Sim |

---

## 5. Mesas

### 5.1 Listar Mesas

**GET** `/tables`

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "number": "01",
    "capacity": 4,
    "status": "AVAILABLE",
    "qrCode": "https://...",
    "currentOrder": null
  }
]
```

### 5.2 Criar Mesa

**POST** `/tables`

**Body:**
```json
{
  "number": "10",
  "capacity": 6
}
```

### 5.3 Buscar Mesa

**GET** `/tables/:id`

### 5.4 Atualizar Mesa

**PATCH** `/tables/:id`

**Body:**
```json
{
  "number": "10A",
  "capacity": 8
}
```

### 5.5 Deletar Mesa

**DELETE** `/tables/:id`

### 5.6 Atualizar Status da Mesa

**PATCH** `/tables/:id/status`

**Body:**
```json
{ "status": "OCCUPIED" }
```

**Status:** `AVAILABLE`, `OCCUPIED`, `RESERVED`, `CLEANING`

### 5.7 Gerar QR Code

**POST** `/tables/:id/qr-code`

**Body:**
```json
{ "baseUrl": "https://menu.meurestaurante.com" }
```

---

## 6. Clientes

### 6.1 Listar Clientes

**GET** `/customers`

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| skip | number | Paginação |
| take | number | Limite |
| search | string | Busca por nome/telefone |
| level | enum | `BRONZE`, `SILVER`, `GOLD`, `PLATINUM` |

### 6.2 Criar Cliente

**POST** `/customers`

**Body:**
```json
{
  "name": "João Silva",
  "phone": "+5511999999999",
  "email": "joao@email.com",
  "birthday": "1990-05-15",
  "tags": ["vip", "aniversariante"]
}
```

### 6.3 Buscar Cliente

**GET** `/customers/:id`

### 6.4 Atualizar Cliente

**PATCH** `/customers/:id`

**Body:**
```json
{
  "name": "João Silva Santos",
  "tags": ["vip", "frequente"]
}
```

### 6.5 Deletar Cliente

**DELETE** `/customers/:id`

### 6.6 Pedidos do Cliente

**GET** `/customers/:id/orders`

### 6.7 Adicionar Pontos

**POST** `/customers/:id/points`

**Body:**
```json
{
  "points": 100,
  "reason": "Bônus de aniversário"
}
```

---

## 7. Fidelidade

### 7.1 Regras de Pontuação

#### Listar Regras
**GET** `/loyalty/rules`

#### Criar Regra
**POST** `/loyalty/rules`

**Body:**
```json
{
  "name": "Pontos por compra",
  "type": "PURCHASE",
  "points": 10,
  "description": "10 pontos a cada R$1 gasto"
}
```

**Tipos:** `PURCHASE`, `VISIT`, `REFERRAL`, `BIRTHDAY`, `REVIEW`

#### Atualizar Regra
**PATCH** `/loyalty/rules/:id`

#### Deletar Regra
**DELETE** `/loyalty/rules/:id`

### 7.2 Recompensas

#### Listar Recompensas
**GET** `/loyalty/rewards`

#### Criar Recompensa
**POST** `/loyalty/rewards`

**Body:**
```json
{
  "name": "Desconto de 10%",
  "pointsCost": 500,
  "type": "DISCOUNT_PERCENT",
  "value": 10,
  "description": "10% de desconto no pedido"
}
```

**Tipos:** `DISCOUNT_PERCENT`, `DISCOUNT_FIXED`, `FREE_ITEM`, `FREE_DELIVERY`

#### Atualizar Recompensa
**PATCH** `/loyalty/rewards/:id`

#### Deletar Recompensa
**DELETE** `/loyalty/rewards/:id`

### 7.3 Resgate

#### Resgatar Recompensa
**POST** `/loyalty/redeem`

**Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "rewardId": "uuid-da-recompensa"
}
```

#### Histórico do Cliente
**GET** `/loyalty/history/:customerId`

---

## 8. Campanhas

### 8.1 Listar Campanhas

**GET** `/campaigns`

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| status | enum | `DRAFT`, `SCHEDULED`, `ACTIVE`, `PAUSED`, `COMPLETED` |
| type | enum | `SMS`, `EMAIL`, `PUSH`, `WHATSAPP` |

### 8.2 Criar Campanha

**POST** `/campaigns`

**Body:**
```json
{
  "name": "Promoção de Verão",
  "type": "WHATSAPP",
  "message": "🔥 20% OFF em todas as pizzas! Use o cupom VERAO20",
  "segmentation": {
    "level": ["GOLD", "PLATINUM"],
    "lastOrderDays": 30
  }
}
```

### 8.3 Buscar Campanha

**GET** `/campaigns/:id`

### 8.4 Atualizar Campanha

**PATCH** `/campaigns/:id`

**Body:**
```json
{
  "name": "Promoção Atualizada",
  "message": "Nova mensagem",
  "status": "ACTIVE"
}
```

### 8.5 Deletar Campanha

**DELETE** `/campaigns/:id`

### 8.6 Agendar Campanha

**POST** `/campaigns/:id/schedule`

**Body:**
```json
{ "scheduledFor": "2026-01-15T10:00:00.000Z" }
```

### 8.7 Pausar Campanha

**POST** `/campaigns/:id/pause`

### 8.8 Métricas da Campanha

**GET** `/campaigns/:id/metrics`

**Resposta (200):**
```json
{
  "sent": 500,
  "delivered": 485,
  "opened": 320,
  "clicked": 150,
  "converted": 45,
  "revenue": 4500.00
}
```

---

## 9. Uploads

### 9.1 Upload de Imagem

**POST** `/uploads/image`

**Content-Type:** `multipart/form-data`

**Body:**
```
file: <arquivo de imagem>
```

**Resposta (201):**
```json
{ "url": "https://cdn.gastrobi.com/images/abc123.jpg" }
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/uploads/image \
  -H "Authorization: Bearer <token>" \
  -H "x-restaurant-id: <uuid>" \
  -F "file=@/path/to/image.jpg"
```

---

## 📊 Enums

### OrderType
```
DINE_IN  - No local
TAKEOUT  - Retirada
DELIVERY - Entrega
```

### OrderStatus
```
PENDING    - Pendente
CONFIRMED  - Confirmado
PREPARING  - Preparando
READY      - Pronto
DELIVERED  - Entregue
COMPLETED  - Concluído
CANCELLED  - Cancelado
```

### TableStatus
```
AVAILABLE - Disponível
OCCUPIED  - Ocupada
RESERVED  - Reservada
CLEANING  - Limpeza
```

### CustomerLevel
```
BRONZE   - Bronze
SILVER   - Prata
GOLD     - Ouro
PLATINUM - Platina
```

---

## 🔧 Exemplo JavaScript

```javascript
const API = 'http://localhost:3000/api/v1';
let token = '';
let restaurantId = '';

// Login
async function login(email, password) {
  const res = await fetch(`${API}/auth/login/restaurant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  token = data.accessToken;
  restaurantId = data.user.currentRestaurant.id;
  return data;
}

// Request autenticada
async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-restaurant-id': restaurantId,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API}${endpoint}`, options);
  return res.json();
}

// Exemplos
const categories = await request('GET', '/categories');
const newProduct = await request('POST', '/products', {
  name: 'Novo Produto',
  price: 29.90,
  categoryId: 'uuid'
});
```

---

**Versão:** 1.0.0 | **Atualizado:** 08/01/2026
