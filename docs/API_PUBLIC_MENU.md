# 📖 GastroBI+ API - Cardápio Público

**Base URL:** `http://localhost:3000/api/v1`

> 🔓 Todas as rotas são públicas (não requerem autenticação)

---

## 1. Menu (Cardápio)

### 1.1 Obter Cardápio Público

**GET** `/menu/:slug`

Retorna o cardápio completo de um restaurante.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| slug | string | Slug único do restaurante |

**Resposta (200):**
```json
{
  "restaurant": {
    "id": "uuid",
    "name": "Restaurant Name",
    "slug": "restaurant-name",
    "logo": "https://example.com/logo.png",
    "phone": "+5511999999999"
  },
  "categories": [
    {
      "id": "uuid",
      "name": "Pizzas",
      "description": "Nossas pizzas artesanais",
      "image": "https://example.com/pizza.jpg",
      "products": [
        {
          "id": "uuid",
          "name": "Pizza Margherita",
          "description": "Molho de tomate, mozzarella e manjericão",
          "price": 45.90,
          "image": "https://example.com/margherita.jpg",
          "isAvailable": true,
          "preparationTime": 25,
          "allergens": ["gluten", "lactose"],
          "variations": [
            { "name": "Pequena", "price": 35.90 },
            { "name": "Grande", "price": 55.90 }
          ],
          "extras": [
            { "name": "Borda recheada", "price": 8.00 }
          ]
        }
      ]
    }
  ],
  "whiteLabel": {
    "primaryColor": "#FF5733",
    "secondaryColor": "#333333"
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/menu/restaurant-name
```

---

### 1.2 Obter Produto do Cardápio

**GET** `/menu/:slug/product/:productId`

Retorna detalhes de um produto específico.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| slug | string | Slug do restaurante |
| productId | uuid | ID do produto |

**Resposta (200):**
```json
{
  "id": "uuid",
  "name": "Pizza Margherita",
  "description": "Molho de tomate, mozzarella e manjericão fresco",
  "price": 45.90,
  "image": "https://example.com/margherita.jpg",
  "isAvailable": true,
  "preparationTime": 25,
  "allergens": ["gluten", "lactose"],
  "tags": ["popular", "vegetariano"],
  "variations": [
    { "name": "Pequena", "price": 35.90 },
    { "name": "Grande", "price": 55.90 }
  ],
  "extras": [
    { "name": "Borda recheada", "price": 8.00 },
    { "name": "Queijo extra", "price": 5.00 }
  ],
  "category": {
    "id": "uuid",
    "name": "Pizzas"
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/menu/restaurant-name/product/uuid-do-produto
```

---

## 2. Pedidos Públicos

### 2.1 Criar Pedido Público

**POST** `/menu/:slug/order`

Cria um pedido sem necessidade de login.

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| slug | string | Slug do restaurante |

**Body:**
```json
{
  "type": "DELIVERY",
  "tableNumber": "5",
  "items": [
    {
      "productId": "uuid-do-produto",
      "quantity": 2,
      "observations": "Sem cebola",
      "extras": [
        { "name": "Borda recheada", "price": 8.00 }
      ],
      "variation": { "name": "Grande", "price": 55.90 }
    }
  ],
  "customer": {
    "name": "João Silva",
    "phone": "+5511999999999",
    "address": {
      "street": "Rua Example",
      "number": "123",
      "complement": "Apto 45",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "zipCode": "01234-567"
    }
  }
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| type | enum | Sim | `DINE_IN`, `TAKEOUT`, `DELIVERY` |
| tableNumber | string | Não | Número da mesa (para DINE_IN) |
| items | array | Sim | Lista de itens do pedido |
| items[].productId | uuid | Sim | ID do produto |
| items[].quantity | number | Sim | Quantidade |
| items[].observations | string | Não | Observações do item |
| items[].extras | array | Não | Extras selecionados |
| items[].variation | object | Não | Variação selecionada |
| customer | object | Não | Dados do cliente (obrigatório para DELIVERY) |
| customer.name | string | Sim* | Nome do cliente |
| customer.phone | string | Sim* | Telefone do cliente |
| customer.address | object | Sim* | Endereço (para DELIVERY) |

**Resposta (201):**
```json
{
  "id": "uuid",
  "orderNumber": "ORD-2026-001234",
  "type": "DELIVERY",
  "status": "PENDING",
  "items": [
    {
      "productName": "Pizza Margherita",
      "quantity": 2,
      "unitPrice": 55.90,
      "extras": [{ "name": "Borda recheada", "price": 8.00 }],
      "subtotal": 127.80
    }
  ],
  "subtotal": 127.80,
  "deliveryFee": 8.00,
  "total": 135.80,
  "estimatedTime": 45,
  "createdAt": "2026-01-08T17:00:00.000Z"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/menu/restaurant-name/order \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DELIVERY",
    "items": [
      {"productId": "uuid", "quantity": 2}
    ],
    "customer": {
      "name": "João Silva",
      "phone": "+5511999999999",
      "address": {
        "street": "Rua Example",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "zipCode": "01234-567"
      }
    }
  }'
```

---

## 3. Health Check

### 3.1 Verificar Status da API

**GET** `/health`

**Resposta (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T17:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 📊 Enums

### OrderType
```
DINE_IN  - Consumo no local
TAKEOUT  - Retirada
DELIVERY - Entrega
```

---

## ⚠️ Erros Comuns

| Código | Descrição |
|--------|-----------|
| 400 | Dados inválidos |
| 404 | Restaurante ou produto não encontrado |
| 422 | Produto indisponível |

---

## 🔧 Exemplo JavaScript

```javascript
const API = 'http://localhost:3000/api/v1';

// Buscar cardápio
async function getMenu(slug) {
  const res = await fetch(`${API}/menu/${slug}`);
  return res.json();
}

// Criar pedido
async function createOrder(slug, orderData) {
  const res = await fetch(`${API}/menu/${slug}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return res.json();
}
```
