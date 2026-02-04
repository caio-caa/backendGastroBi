# Trocar Restaurante - Especificação da API

## Objetivo
Permitir que um usuário com múltiplos restaurantes possa alternar entre eles e carregar seus dados específicos.

---

## Rotas Sugeridas (escolher uma)

### Opção 1 (Recomendada)
```
PUT /api/v1/users/current-restaurant/:restaurantId
```

### Opção 2
```
POST /api/v1/auth/switch-restaurant
Body: { "restaurantId": "uuid" }
```

---

## Request

```http
PUT /api/v1/users/current-restaurant/uuid-do-restaurante
Authorization: Bearer {token}
```

---

## Response (200 OK)

```json
{
  "success": true,
  "message": "Restaurante alterado com sucesso",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "João Silva",
      "email": "joao@example.com",
      "role": "OWNER",
      "currentRestaurant": {
        "id": "uuid-restaurante-2",
        "name": "Pizza House",
        "cnpj": "12345678000190",
        "slug": "pizza-house",
        "status": "ACTIVE",
        "address": {
          "street": "Rua das Flores",
          "number": "123",
          "city": "São Paulo",
          "state": "SP",
          "zipCode": "01234-567"
        },
        "phoneNumber": "1133334444",
        "email": "contact@pizzahouse.com",
        "cuisine": "Italian",
        "rating": 4.8,
        "logo": "https://...",
        "banner": "https://..."
      }
    },
    "token": "novo-jwt-token-opcional" // se o token muda
  }
}
```

---

## Response de Erro (404, 403, 400)

```json
{
  "success": false,
  "message": "Restaurante não encontrado ou acesso negado",
  "error": "RESTAURANT_NOT_FOUND"
}
```

---

## Contexto no Frontend

Após receber a resposta:
1. Atualizar `AuthContext` com novo restaurante
2. Atualizar `WhiteLabelContext` com dados visuais do novo restaurante
3. Limpar dados em memória (carrinho, menu, etc)
4. Redirecionar para `/dashboard`

---

## Dados Necessários no Frontend

Listar restaurantes do usuário (assumindo que já vêm no login):

```json
{
  "user": {
    "restaurants": [
      {
        "id": "uuid-1",
        "name": "Burger King",
        "slug": "burger-king",
        "logo": "https://..."
      },
      {
        "id": "uuid-2",
        "name": "Pizza House",
        "slug": "pizza-house",
        "logo": "https://..."
      }
    ]
  }
}
```
