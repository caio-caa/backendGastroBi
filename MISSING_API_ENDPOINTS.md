# 📋 Endpoints Faltantes - Front Customer (Cardápio Público)

**Base URL:** `http://localhost:3000/api/v1`

> 🔓 Todas as rotas são públicas (não requerem autenticação)

---

## 1. Validação de Cupom

### POST `/menu/:slug/coupon/validate`

Valida um código de cupom e calcula o desconto.

**Request:**
```json
{
  "code": "PRIMEIRA10",
  "restaurantSlug": "hamburgueria-do-ze",
  "subtotal": 75.90
}
```

**Response (200 - Válido):**
```json
{
  "valid": true,
  "code": "PRIMEIRA10",
  "discountType": "percentage",
  "discountValue": 10,
  "calculatedDiscount": 7.59,
  "minOrderValue": 30.00,
  "maxDiscount": 50.00,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "message": "Cupom aplicado com sucesso!"
}
```

**Response (200 - Inválido):**
```json
{
  "valid": false,
  "code": "INVALIDO",
  "discountType": null,
  "discountValue": 0,
  "calculatedDiscount": 0,
  "message": "Cupom inválido ou expirado"
}
```

**Campos do Request:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| code | string | Sim | Código do cupom |
| restaurantSlug | string | Sim | Slug do restaurante |
| subtotal | number | Sim | Subtotal do pedido (para calcular desconto) |

**Campos do Response:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| valid | boolean | Se o cupom é válido |
| code | string | Código do cupom (normalizado) |
| discountType | enum | `percentage` ou `fixed` |
| discountValue | number | Valor do desconto (% ou R$) |
| calculatedDiscount | number | Valor final do desconto em R$ |
| minOrderValue | number? | Valor mínimo do pedido |
| maxDiscount | number? | Desconto máximo em R$ |
| expiresAt | string? | Data de expiração ISO 8601 |
| message | string? | Mensagem para o usuário |

---

## 2. Cálculo de Taxa de Entrega

### POST `/menu/:slug/delivery/calculate`

Calcula a taxa de entrega baseada no CEP.

**Request:**
```json
{
  "zipCode": "01310100"
}
```

**Response (200 - Disponível):**
```json
{
  "available": true,
  "fee": 8.90,
  "estimatedTime": 35,
  "freeDeliveryMinimum": 80.00,
  "message": null
}
```

**Response (200 - Não Disponível):**
```json
{
  "available": false,
  "fee": 0,
  "estimatedTime": 0,
  "freeDeliveryMinimum": null,
  "message": "Infelizmente não entregamos nessa região"
}
```

**Campos do Request:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| zipCode | string | Sim | CEP (apenas números, 8 dígitos) |

**Campos do Response:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| available | boolean | Se entrega está disponível |
| fee | number | Taxa de entrega em R$ |
| estimatedTime | number | Tempo estimado em minutos |
| freeDeliveryMinimum | number? | Valor para frete grátis |
| message | string? | Mensagem para o usuário |

---

## 3. Informações do Restaurante (Detalhadas)

### GET `/menu/:slug/info`

Retorna informações detalhadas do restaurante.

> **Nota:** Parte dessas informações já vem no endpoint `/menu/:slug`, mas pode ser útil ter um endpoint separado para informações mais detalhadas.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Hamburgueria do Zé",
  "slug": "hamburgueria-do-ze",
  "logo": "https://example.com/logo.png",
  "cover": "https://example.com/cover.jpg",
  "description": "Os melhores hambúrgueres artesanais da cidade",
  "phone": "+5511999999999",
  "address": {
    "street": "Rua Augusta",
    "number": "1500",
    "neighborhood": "Consolação",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01304001"
  },
  "openingHours": [
    { "dayOfWeek": 0, "openTime": null, "closeTime": null, "isOpen": false },
    { "dayOfWeek": 1, "openTime": "11:00", "closeTime": "23:00", "isOpen": true },
    { "dayOfWeek": 2, "openTime": "11:00", "closeTime": "23:00", "isOpen": true },
    { "dayOfWeek": 3, "openTime": "11:00", "closeTime": "23:00", "isOpen": true },
    { "dayOfWeek": 4, "openTime": "11:00", "closeTime": "23:00", "isOpen": true },
    { "dayOfWeek": 5, "openTime": "11:00", "closeTime": "00:00", "isOpen": true },
    { "dayOfWeek": 6, "openTime": "11:00", "closeTime": "00:00", "isOpen": true }
  ],
  "isOpen": true,
  "rating": 4.8,
  "reviewsCount": 2100,
  "minimumOrderValue": 25.00,
  "deliveryTime": {
    "min": 25,
    "max": 45
  },
  "whiteLabel": {
    "primaryColor": "#22C55E",
    "secondaryColor": "#166534"
  }
}
```

---

## 4. Autenticação do Cliente (Opcional)

### POST `/menu/:slug/customer/auth/whatsapp`

Inicia autenticação via WhatsApp (envia código OTP).

**Request:**
```json
{
  "phone": "+5511999999999"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Código enviado para seu WhatsApp",
  "expiresIn": 300
}
```

---

### POST `/menu/:slug/customer/auth/verify`

Verifica o código OTP e retorna dados do cliente.

**Request:**
```json
{
  "phone": "+5511999999999",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "customer": {
    "id": "uuid",
    "name": "João Silva",
    "phone": "+5511999999999",
    "email": "joao@email.com",
    "points": 87,
    "level": "silver",
    "orders": 12
  },
  "token": "jwt-token-opcional"
}
```

---

## 5. Programa de Fidelidade do Cliente

### GET `/menu/:slug/customer/loyalty`

Retorna dados de fidelidade do cliente autenticado.

**Headers:**
```
Authorization: Bearer <token>
```
_ou via cookie se implementado_

**Response (200):**
```json
{
  "points": 87,
  "level": "silver",
  "nextLevel": "gold",
  "pointsToNextLevel": 213,
  "totalOrders": 12,
  "rewards": [
    {
      "id": "1",
      "type": "free_item",
      "name": "Hambúrguer Grátis",
      "description": "A cada 10 pedidos",
      "progress": 7,
      "target": 10,
      "available": false
    },
    {
      "id": "2",
      "type": "discount",
      "name": "15% de Desconto",
      "description": "Disponível para usar",
      "available": true,
      "couponCode": "FIDELIDADE15"
    }
  ],
  "history": [
    {
      "date": "2026-01-10T12:00:00.000Z",
      "type": "earned",
      "points": 15,
      "description": "Pedido #ORD-2026-001234"
    }
  ]
}
```

---

## 📊 Resumo de Endpoints Faltantes

| Endpoint | Método | Prioridade | Status |
|----------|--------|------------|--------|
| `/menu/:slug/coupon/validate` | POST | Alta | ✅ Implementado |
| `/menu/:slug/delivery/calculate` | POST | Alta | ✅ Implementado |
| `/menu/:slug/info` | GET | Média | ✅ Implementado |
| `/menu/:slug/customer/auth/whatsapp` | POST | Baixa | ✅ Implementado |
| `/menu/:slug/customer/auth/verify` | POST | Baixa | ✅ Implementado |
| `/menu/:slug/customer/loyalty` | GET | Baixa | ✅ Implementado |

---

## 🔧 Notas de Implementação

### Cupom
- Validar se o cupom pertence ao restaurante
- Verificar data de expiração
- Verificar valor mínimo do pedido
- Verificar uso máximo por cliente
- Considerar cupons de primeira compra

### Delivery
- Integrar com serviço de CEP (ViaCEP, Correios)
- Definir raio de entrega por restaurante
- Calcular distância ou usar tabela de bairros
- Considerar frete grátis acima de valor mínimo

### Autenticação Cliente
- Opcional para checkout (guest checkout permitido)
- Obrigatório para programa de fidelidade
- Pode usar WhatsApp Business API ou SMS

---

**Data:** 13 de Janeiro de 2026
